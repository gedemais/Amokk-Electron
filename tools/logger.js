/**
 * AMOKK Unified Logger
 *
 * Can be used in:
 * - Electron main process (electron/main.ts)
 * - Electron renderer process (React frontend)
 * - Backend via IPC communication
 *
 * Usage:
 *   import logger from './logger.js';
 *   logger.info('STARTUP', 'App starting');
 *   logger.error('BACKEND', 'Failed to start', { port: 8000 });
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Load Environment Variables from .env file
// ============================================================================

function loadEnvFile() {
  const locations = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '.env'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.env'),
  ];

  for (const location of locations) {
    try {
      if (fs.existsSync(location)) {
        const content = fs.readFileSync(location, 'utf-8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (!line || line.startsWith('#') || line.startsWith(';')) {
            continue;
          }

          const [key, ...valueParts] = line.split('=');
          const trimmedKey = key.trim();
          let value = valueParts.join('=').trim();

          if (!trimmedKey) {
            continue;
          }

          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          if (process.env[trimmedKey] === undefined) {
            process.env[trimmedKey] = value;
          }
        }

        console.log(`[LOGGER] Environment variables loaded from: ${location}`);
        return;
      }
    } catch (e) {
      // Continue to next location
    }
  }

  console.warn('[LOGGER] No .env file found, using system environment only');
}

loadEnvFile();

// ============================================================================
// Configuration
// ============================================================================

// Helper function to parse boolean strings
function parseBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
}

const CONFIG = {
  // Log levels: trace < debug < info < warn < error
  logLevel: process.env.LOG_LEVEL || 'info',

  // Console output (display in terminal/console)
  logConsole: parseBoolean(process.env.LOG_CONSOLE, true),

  // File output (write to ~/.amokk/logs/)
  logToFile: parseBoolean(process.env.LOG_FILE, true),

  // Custom log directory
  logDir: process.env.LOG_DIR || path.join(os.homedir(), '.amokk', 'logs'),

  // Max log file size before rotation (default: 10MB)
  maxLogSize: parseInt(process.env.LOG_MAX_SIZE) || 10 * 1024 * 1024,

  // Max number of log files to keep
  maxLogFiles: parseInt(process.env.LOG_MAX_FILES) || 5,

  // Use colors in console output
  useColors: !parseBoolean(process.env.NO_COLOR, false) && process.stdout.isTTY,

  // Development mode detection
  isDev: process.env.NODE_ENV === 'development' || parseBoolean(process.env.DEV, false),
};

// ============================================================================
// Color Codes (ANSI)
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const LOG_COLORS = {
  trace: COLORS.gray,
  debug: COLORS.blue,
  info: COLORS.cyan,
  warn: COLORS.yellow,
  error: COLORS.red,
  fatal: COLORS.red + COLORS.bright,
};

const LOG_EMOJIS = {
  trace: '📍',
  debug: '🔍',
  info: 'ℹ️ ',
  warn: '⚠️ ',
  error: '❌',
  fatal: '💥',
};

// ============================================================================
// Log Level Configuration
// ============================================================================

const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

function shouldLog(level) {
  return LOG_LEVELS[level] >= LOG_LEVELS[CONFIG.logLevel];
}

// ============================================================================
// Log File Management
// ============================================================================

let logFile = null;
let logFilePath = null;

function ensureLogDir() {
  if (!CONFIG.logToFile) return;

  try {
    if (!fs.existsSync(CONFIG.logDir)) {
      fs.mkdirSync(CONFIG.logDir, { recursive: true });
    }
  } catch (error) {
    console.error(`[LOGGER] Failed to create log directory: ${error.message}`);
  }
}

function getLogFilePath() {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(CONFIG.logDir, `amokk-${timestamp}.log`);
}

function rotateLogFile() {
  if (!CONFIG.logToFile) return;

  try {
    const filePath = getLogFilePath();

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > CONFIG.maxLogSize) {
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        const timestamp = Date.now();
        const newPath = path.join(dir, `${base}-${timestamp}${ext}`);
        fs.renameSync(filePath, newPath);
      }
    }

    logFilePath = filePath;
  } catch (error) {
    console.error(`[LOGGER] Failed to rotate log file: ${error.message}`);
  }
}

function writeToFile(message) {
  if (!CONFIG.logToFile) return;

  try {
    ensureLogDir();
    rotateLogFile();

    if (logFilePath) {
      fs.appendFileSync(logFilePath, message + '\n', 'utf8');
    }
  } catch (error) {
    console.error(`[LOGGER] Failed to write to log file: ${error.message}`);
  }
}

// ============================================================================
// Logger Utility Functions
// ============================================================================

function formatTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

function formatMessage(level, debugId, message, data) {
  const timestamp = formatTimestamp();
  const emoji = LOG_EMOJIS[level] || '';

  let formatted = `[${timestamp}] [${level.toUpperCase()}] [${debugId}] ${emoji} ${message}`;

  if (data) {
    try {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      formatted += `\n  ${dataStr}`;
    } catch (e) {
      formatted += `\n  [Could not serialize data]`;
    }
  }

  return formatted;
}

function colorize(message, level) {
  if (!CONFIG.useColors) return message;

  const color = LOG_COLORS[level] || COLORS.reset;
  return color + message + COLORS.reset;
}

function log(level, debugId, message, data) {
  // Check if should log
  if (!shouldLog(level)) return;

  // Validate inputs
  if (typeof debugId !== 'string' || !debugId) {
    if (CONFIG.logConsole) {
      console.error('[LOGGER] Invalid debugId (must be non-empty string)');
    }
    return;
  }

  // Format message
  const formatted = formatMessage(level, debugId, message, data);
  const colored = colorize(formatted, level);

  // Output to console if enabled
  if (CONFIG.logConsole) {
    if (level === 'error' || level === 'fatal') {
      console.error(colored);
    } else if (level === 'warn') {
      console.warn(colored);
    } else {
      console.log(colored);
    }
  }

  // Output to file if enabled
  if (CONFIG.logToFile) {
    writeToFile(formatted);
  }
}

// ============================================================================
// Public Logger API
// ============================================================================

const logger = {
  /**
   * Trace level logging (very detailed, usually disabled in production)
   * @param {string} debugId - Identifier for the log source (e.g., 'STARTUP', 'BACKEND')
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  trace: (debugId, message, data) => log('trace', debugId, message, data),

  /**
   * Debug level logging
   * @param {string} debugId - Identifier for the log source
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  debug: (debugId, message, data) => log('debug', debugId, message, data),

  /**
   * Info level logging
   * @param {string} debugId - Identifier for the log source
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  info: (debugId, message, data) => log('info', debugId, message, data),

  /**
   * Warn level logging
   * @param {string} debugId - Identifier for the log source
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  warn: (debugId, message, data) => log('warn', debugId, message, data),

  /**
   * Error level logging
   * @param {string} debugId - Identifier for the log source
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  error: (debugId, message, data) => log('error', debugId, message, data),

  /**
   * Fatal error logging (usually followed by process exit)
   * @param {string} debugId - Identifier for the log source
   * @param {string} message - Log message
   * @param {any} data - Optional data to log
   */
  fatal: (debugId, message, data) => log('fatal', debugId, message, data),

  /**
   * Log a separator line for visual organization
   * @param {string} title - Optional title for the separator
   * @param {number} width - Width of the separator (default 60)
   */
  separator: (title = '', width = 60) => {
    if (title) {
      const padding = Math.max(0, width - title.length - 4) / 2;
      const line = '='.repeat(Math.floor(padding)) + ` ${title} ` + '='.repeat(Math.ceil(padding));
      console.log(colorize(line, 'info'));
    } else {
      console.log(colorize('='.repeat(width), 'info'));
    }
  },

  /**
   * Get current configuration
   */
  getConfig: () => ({ ...CONFIG }),

  /**
   * Set configuration
   * @param {object} config - Config overrides
   */
  setConfig: (config) => {
    Object.assign(CONFIG, config);
    logger.debug('LOGGER', 'Configuration updated', CONFIG);
  },

  /**
   * Get log file path
   */
  getLogPath: () => logFilePath,

  /**
   * Clear logs (for testing)
   */
  clearLogs: () => {
    try {
      if (logFilePath && fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath);
        logger.info('LOGGER', 'Log file cleared');
      }
    } catch (error) {
      logger.error('LOGGER', 'Failed to clear logs', error.message);
    }
  },
};

// ============================================================================
// Initialization
// ============================================================================

// Ensure log directory exists on startup
ensureLogDir();

// Log startup message
logger.info('LOGGER', 'Logger initialized', {
  environment: CONFIG.isDev ? 'development' : 'production',
  logLevel: CONFIG.logLevel,
  logToFile: CONFIG.logToFile,
  logDir: CONFIG.logDir,
});

// ============================================================================
// Exports
// ============================================================================

export default logger;

// Also expose to window if in browser context
if (typeof window !== 'undefined') {
  window.logger = logger;
}
