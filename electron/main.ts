// @ts-nocheck
/**
 * AMOKK Electron Main Process
 * Manages:
 * - Electron window creation and lifecycle
 * - Python backend subprocess
 * - IPC communication between main and renderer
 * - Auto-updates and system integration
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ============================================================================
// Environment Setup
// ============================================================================

// Load .env file first, before anything else
try {
  const envLoaderModule = await import('../tools/env-loader.js');
  const envLoader = envLoaderModule.default || envLoaderModule;
  envLoader.loadEnv?.();
  console.log('[STARTUP] Environment variables loaded');
} catch (e) {
  console.warn('[STARTUP] Could not load .env file:', (e as any).message);
}

// ============================================================================
// Import Test Suite
// ============================================================================

let connectivityTest: any = null;
try {
  connectivityTest = await import('../tools/connectivity-test.js');
} catch (e) {
  console.warn('[STARTUP] Could not load connectivity tests');
}

// ============================================================================
// Logger Setup
// ============================================================================

// Import centralized logger (after env is loaded)
const loggerModule = await import('../tools/logger.js');
const logger = loggerModule.default || loggerModule;

// ============================================================================
// Configuration
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect development mode: check if we're running from unpacked source or ASAR
const isDev = !app.isPackaged;
const BACKEND_PORT = 8000;
const BACKEND_HOST = '127.0.0.1';

// Detect frontend-only mode (no embedded backend)
// Check if backend directory exists in resources
let isFrontendOnly = false;
if (!isDev) {
  const backendDir = path.join(process.resourcesPath, 'backend', 'dist');
  isFrontendOnly = !fs.existsSync(backendDir);
}

logger.info('INIT', 'Electron initialization', { isDev, isFrontendOnly, platform: process.platform, arch: process.arch });

// Determine backend path
function getBackendPath(): string {
  console.error('=== PATH_RESOLVE START ===');
  console.error('isDev:', isDev, 'platform:', process.platform);
  logger.debug('PATH_RESOLVE', 'Resolving backend path', { isDev, platform: process.platform });

  let backendExe: string;
  let backendPy: string;
  let baseDir: string;

  if (isDev) {
    // Development: use project root
    baseDir = path.join(__dirname, '..');
    logger.debug('PATH_RESOLVE', 'Development mode - using project root');
  } else {
    // Production: find resources directory
    const exePath = path.dirname(process.execPath);
    const appPath = app.getAppPath();

    // List of possible locations for resources (in order of preference)
    const possibleBaseDirs = [
      process.resourcesPath,  // Official Electron method
      path.join(exePath, 'resources'),  // Next to exe: /Bureau/resources
      path.join(exePath, '..', 'resources'),  // Parent of exe
      path.join(path.dirname(appPath), 'resources'),  // Relative to app path
      path.join(process.cwd(), 'resources'),  // Current working directory
      exePath,  // Check if backend is directly next to exe (unpacked mode)
    ].filter(Boolean);

    console.error('=== PRODUCTION MODE ===');
    console.error('process.execPath:', process.execPath);
    console.error('exePath:', exePath);
    console.error('appPath:', appPath);
    console.error('process.cwd():', process.cwd());
    console.error('possibleBaseDirs:', possibleBaseDirs);

    baseDir = '';
    for (const dir of possibleBaseDirs) {
      const dirExists = fs.existsSync(dir);
      const backendExists = fs.existsSync(path.join(dir, 'backend'));
      console.error(`  Checking: ${dir}`);
      console.error(`    exists: ${dirExists}, has backend: ${backendExists}`);

      if (dirExists && backendExists) {
        baseDir = dir;
        console.error(`  ✓ FOUND: ${baseDir}`);
        break;
      }
    }

    if (!baseDir) {
      // Fallback: if resources doesn't exist but backend does at exe level (win-unpacked)
      const backendAtExeLevel = path.join(exePath, 'resources', 'backend');
      if (fs.existsSync(backendAtExeLevel)) {
        baseDir = path.join(exePath, 'resources');
        console.error(`✓ Found backend at exe level: ${baseDir}`);
      } else {
        baseDir = exePath;
        console.error(`⚠ Backend not found, using fallback baseDir: ${baseDir}`);
      }
    }

    logger.debug('PATH_RESOLVE', 'Production mode - found base directory', { baseDir });
  }

  const backendDir = path.join(baseDir, 'backend');
  logger.debug('PATH_RESOLVE', 'Backend directory resolved', { backendDir });

  // Build list of possible backend executable names
  // (compiled on Linux might not have .exe extension even for Windows)
  const backendExePaths: string[] = [];
  if (process.platform === 'win32') {
    backendExePaths.push(
      path.join(backendDir, 'dist', 'AMOKK-Backend.exe'),
      path.join(backendDir, 'dist', 'AMOKK-Backend')  // Fallback: compiled on Linux
    );
  } else {
    backendExePaths.push(path.join(backendDir, 'dist', 'AMOKK-Backend'));
  }

  backendPy = path.join(backendDir, 'main.py');

  logger.debug('PATH_RESOLVE', 'Path resolution complete', {
    isDev,
    baseDir,
    backendExePaths,
    backendPyScript: backendPy,
    backendExeExists: backendExePaths.map(p => ({ path: p, exists: fs.existsSync(p) })),
    backendPyExists: fs.existsSync(backendPy),
  });

  // Try to use PyInstaller-built executable FIRST (preferred)
  console.error('=== Checking backend executables ===');
  for (const exePath of backendExePaths) {
    const exists = fs.existsSync(exePath);
    console.error(`Checking: ${exePath} - exists: ${exists}`);
    if (exists) {
      console.error('✓ Using PyInstaller executable:', exePath);
      logger.info('PATH_RESOLVE', 'Using PyInstaller executable', { exePath });
      return exePath;
    }
  }

  // Fallback to Python script
  logger.warn('PATH_RESOLVE', 'PyInstaller executable not found, falling back to Python script', {
    attemptedPaths: backendExePaths,
    backendPy,
  });
  return backendPy;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface BackendStatus {
  running: boolean;
  port: number;
  pid?: number;
  error?: string;
}

// ============================================================================
// Global Variables
// ============================================================================

let mainWindow: any = null;
let pythonProcess: any = null;
let backendReady = false;
let backendStartAttempts = 0;
const MAX_BACKEND_ATTEMPTS = 3;

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Validate that all required files exist before starting
 */
async function validateEnvironment(): Promise<void> {
  logger.info('VALIDATE', 'Starting environment validation');

  if (isDev) {
    logger.debug('VALIDATE', 'Development mode - skipping validation');
    return;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check backend executable exists (skip in frontend-only mode)
  if (!isFrontendOnly) {
    const backendPath = getBackendPath();
    if (!fs.existsSync(backendPath)) {
      logger.error('VALIDATE', 'Backend executable not found', { backendPath });
      errors.push(`Backend executable not found: ${backendPath}`);
    } else {
      logger.info('VALIDATE', 'Backend executable found', { backendPath });

    // Check if executable has proper permissions (Linux/macOS)
    if (process.platform !== 'win32') {
      try {
        const stats = fs.statSync(backendPath);
        const isExecutable = (stats.mode & 0o111) !== 0;
        if (!isExecutable) {
          logger.warn('VALIDATE', 'Backend not executable, will chmod +x at startup');
          warnings.push(`Backend is not executable. Will attempt chmod +x during startup.`);
        } else {
          logger.info('VALIDATE', 'Backend has execute permissions');
        }
      } catch (e: any) {
        logger.warn('VALIDATE', 'Could not check backend permissions', { error: e.message });
        warnings.push(`Could not check backend permissions`);
      }
    }
  }
  } else {
    logger.info('VALIDATE', 'Frontend-only mode - skipping backend validation');
  }

  // Check if frontend exists
  const appPath = app.getAppPath();
  let baseDir = path.dirname(appPath);
  const frontendPath = path.join(baseDir, 'dist', 'index.html');
  if (!fs.existsSync(frontendPath)) {
    logger.error('VALIDATE', 'Frontend not found', { frontendPath });
    errors.push(`Frontend not found: ${frontendPath}`);
  } else {
    logger.info('VALIDATE', 'Frontend found', { frontendPath });
  }

  // Check if assets directory exists
  const assetsPath = path.join(baseDir, 'assets');
  if (!fs.existsSync(assetsPath)) {
    logger.warn('VALIDATE', 'Assets directory not found', { assetsPath });
    warnings.push(`Assets directory not found: ${assetsPath}`);
  } else {
    logger.info('VALIDATE', 'Assets directory found');
  }

  // Report warnings
  if (warnings.length > 0) {
    warnings.forEach(w => logger.warn('VALIDATE', w));
  }

  // Report errors and fail
  if (errors.length > 0) {
    logger.error('VALIDATE', 'Environment validation failed', { errorCount: errors.length });
    errors.forEach(err => logger.error('VALIDATE', err));

    dialog.showErrorBox(
      'AMOKK - Environment Error',
      'Missing required files:\n\n' + errors.join('\n')
    );

    throw new Error('Environment validation failed');
  }

  logger.info('VALIDATE', 'Environment validation passed!');
}

// ============================================================================
// Backend Management
// ============================================================================

/**
 * Start the Python backend process
 */
async function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    logger.info('BACKEND_START', 'Checking if backend already running');

    if (pythonProcess) {
      logger.info('BACKEND_START', 'Backend already running, skipping startup');
      resolve();
      return;
    }

    logger.info('BACKEND_START', `Starting Python backend on ${BACKEND_HOST}:${BACKEND_PORT}`);

    const backendPath = getBackendPath();
    logger.debug('BACKEND_START', 'Backend path resolved', { backendPath });

    try {
      // Check if backend is an executable or script
      const isPy = backendPath.endsWith('.py');
      const isWinExe = backendPath.endsWith('.exe');
      const isLinuxBinary = !isPy && !isWinExe && fs.existsSync(backendPath);

      logger.debug('BACKEND_START', 'Backend path type detection', {
        isPython: isPy,
        isWindowsExe: isWinExe,
        isLinuxBinary: isLinuxBinary,
        fileExists: fs.existsSync(backendPath),
      });

      if ((isWinExe || isLinuxBinary) && !isPy) {
        // On Windows, PyInstaller exe compiled on Linux doesn't work,
        // so skip directly to Python fallback
        const shouldTryExe = process.platform !== 'win32' || !isWinExe;

        if (shouldTryExe) {
        // Run the PyInstaller-built executable directly
        // Ensure it has execute permissions (for AppImage/extracted builds)
        if (process.platform !== 'win32') {
          try {
            fs.chmodSync(backendPath, 0o755);
            logger.info('BACKEND_SPAWN', 'Set executable permissions (chmod +x)');
          } catch (e: any) {
            // Ignore if file system is read-only (AppImage mounted as read-only)
            if (e.code === 'EROFS') {
              logger.debug('BACKEND_SPAWN', 'File system is read-only (AppImage), skipping chmod');
            } else {
              logger.warn('BACKEND_SPAWN', 'Could not chmod backend', { error: e.message });
            }
          }
        }

        logger.info('BACKEND_SPAWN', 'Spawning PyInstaller executable', { backendPath });
        let exeSpawnFailed = false;

        // Attach error handler BEFORE spawning to catch all errors
        const handleExeSpawnError = (err: any) => {
          if (exeSpawnFailed) return;  // Only handle once
          exeSpawnFailed = true;

          logger.warn('BACKEND_SPAWN', 'PyInstaller executable failed to spawn, falling back to Python', {
            error: err.message,
            backendPath
          });

          pythonProcess?.removeAllListeners();

          // Get launcher.py path (which auto-installs dependencies)
          const backendLauncher = path.join(path.dirname(backendPath), '..', 'launcher.py');

          // Setup Python fallback with retry logic
          const pythonCmds: string[] = [];
          if (process.platform === 'win32') {
            pythonCmds.push('python3.exe', 'python.exe', 'py');
          } else {
            pythonCmds.push('/usr/bin/python3', 'python3', 'python');
          }

          let pythonAttempt = 0;
          const tryPythonFallback = () => {
            if (pythonAttempt >= pythonCmds.length) {
              const fallbackError = new Error('Both PyInstaller executable and Python fallback failed');
              logger.error('BACKEND_SPAWN', 'All spawn methods failed', { pythonCmds });
              reject(fallbackError);
              return;
            }

            const pythonCmd = pythonCmds[pythonAttempt];
            pythonAttempt++;

            logger.info('BACKEND_SPAWN', 'Trying Python launcher fallback', {
              pythonCmd,
              backendPath: backendLauncher,
              attempt: pythonAttempt,
            });

            pythonProcess = spawn(pythonCmd, [backendLauncher], {
              cwd: path.dirname(backendLauncher),
              stdio: ['ignore', 'pipe', 'pipe'],
              detached: false,
              env: { ...process.env },
            });

            pythonProcess.once('error', () => {
              tryPythonFallback();
            });
          };

          tryPythonFallback();
        };

        // NOW spawn and attach handler
        pythonProcess = spawn(backendPath, [], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
        });

        pythonProcess.once('error', handleExeSpawnError);
        } else {
        // On Windows with PyInstaller .exe: skip exe and use Python directly
        logger.info('BACKEND_SPAWN', 'Skipping PyInstaller .exe on Windows, using Python fallback directly');
        // Fall through to Python handling (it's below)
        }

        if (!shouldTryExe || !pythonProcess) {
        // Run Python script with fallback logic
        const pythonCmds: string[] = [];

        // Platform-specific Python command order
        if (process.platform === 'win32') {
          pythonCmds.push('python3.exe', 'python.exe', 'py');  // Windows
        } else {
          pythonCmds.push('/usr/bin/python3', 'python3', 'python');  // Linux/macOS
        }

        // Use launcher.py which auto-installs dependencies before running main.py
        const backendLauncher = path.join(path.dirname(backendPath), '..', 'launcher.py');

        let pythonCmd = pythonCmds[0];
        let spawnAttempt = 0;
        const maxAttempts = pythonCmds.length;

        const trySpawnPython = () => {
          if (spawnAttempt >= maxAttempts) {
            const error = new Error('Could not find python3 executable');
            logger.error('BACKEND_SPAWN', 'All python spawn attempts failed', { pythonCmds });
            pythonProcess?.kill?.();
            pythonProcess = null;
            return;
          }

          pythonCmd = pythonCmds[spawnAttempt];
          spawnAttempt++;

          logger.info('BACKEND_SPAWN', 'Spawning Python launcher', {
            pythonCmd,
            backendPath: backendLauncher,
            attempt: spawnAttempt,
          });

          pythonProcess = spawn(pythonCmd, [backendLauncher], {
            cwd: path.dirname(backendLauncher),
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
            env: { ...process.env, PYTHONUNBUFFERED: '1' },
          });

          // Capture stdout and stderr for debugging
          let pythonStdout = '';
          let pythonStderr = '';

          if (pythonProcess.stdout) {
            pythonProcess.stdout.on('data', (data) => {
              const output = data.toString().trim();
              pythonStdout += output;
              if (output) {
                logger.info('BACKEND_LAUNCHER_STDOUT', output);
              }
            });
          }

          if (pythonProcess.stderr) {
            pythonProcess.stderr.on('data', (data) => {
              const output = data.toString().trim();
              pythonStderr += output;
              if (output) {
                logger.info('BACKEND_LAUNCHER_STDERR', output);
              }
            });
          }

          pythonProcess.once('error', (err: any) => {
            logger.info('BACKEND_SPAWN', 'Python spawn error, trying next command', {
              pythonCmd,
              error: err.message,
              stdout: pythonStdout,
              stderr: pythonStderr,
            });
            trySpawnPython();
          });

          // Also handle exit code 1 (command not found or execution error)
          pythonProcess.once('exit', (code: number) => {
            if (code !== 0) {
              logger.info('BACKEND_SPAWN', 'Python exited with error, trying next command', {
                pythonCmd,
                exitCode: code,
                stdout: pythonStdout,
                stderr: pythonStderr,
              });
              trySpawnPython();
            }
          });
        };

        // Start the spawn attempts
        trySpawnPython();
        }
      }

      let backendOutput = '';
      let healthCheckStarted = false;

      pythonProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        logger.debug('BACKEND_STDIO', 'Backend stdout', { message: message.trim() });
        backendOutput += message;

        // Check if backend is ready (from log output)
        if (
          message.includes('Uvicorn running') ||
          message.includes('Server running on')
        ) {
          logger.info('BACKEND_STDIO', 'Backend ready signal detected from logs');
          backendReady = true;
          resolve();
        }
      });

      pythonProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        logger.debug('BACKEND_STDIO', 'Backend stderr', { message: message.trim() });
        backendOutput += message;
      });

      pythonProcess.on('error', (err: any) => {
        logger.error('BACKEND_SPAWN', 'Failed to spawn backend process', { error: err.message });
        backendReady = false;
        reject(err);
      });

      pythonProcess.on('exit', (code: number) => {
        logger.warn('BACKEND_SPAWN', 'Backend process exited', { exitCode: code });
        pythonProcess = null;
        backendReady = false;
      });

      // Start health check after short delay
      setTimeout(() => {
        if (!healthCheckStarted) {
          healthCheckStarted = true;
          logger.debug('BACKEND_START', 'Starting health check polling');
          pollBackendHealth();
        }
      }, 1000);

      // Timeout for backend startup (20 seconds)
      const startupTimeout = parseInt(process.env.BACKEND_TIMEOUT || '20000');
      setTimeout(() => {
        if (!backendReady) {
          logger.warn('BACKEND_START', `Backend startup timeout (${startupTimeout}ms) - assuming it started`);
          backendReady = true;
          resolve();
        }
      }, startupTimeout);
    } catch (error: any) {
      logger.error('BACKEND_START', 'Error starting backend', { error: error.message });
      backendReady = false;
      reject(error);
    }
  });
}

/**
 * Poll backend health to detect when it's ready
 */
function pollBackendHealth(): void {
  const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds
  let attempts = 0;

  const check = async () => {
    attempts++;
    try {
      const response = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/status`);
      if (response.ok) {
        logger.info('BACKEND_HEALTH', 'Backend is responsive!', { attempts });
        backendReady = true;
        return;
      }
    } catch (e) {
      // Not ready yet, continue polling
    }

    if (attempts < maxAttempts) {
      setTimeout(check, 500);
    } else {
      logger.warn('BACKEND_HEALTH', 'Health check max attempts reached', { maxAttempts });
      backendReady = true;
    }
  };

  check();
}

/**
 * Call backend logout endpoint before shutdown
 */
async function callBackendLogout(): Promise<void> {
  try {
    logger.info('BACKEND_LOGOUT', 'Calling logout endpoint');
    const response = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      logger.info('BACKEND_LOGOUT', 'Logout successful');
    } else {
      logger.warn('BACKEND_LOGOUT', 'Logout failed', { status: response.status });
    }
  } catch (error: any) {
    logger.warn('BACKEND_LOGOUT', 'Failed to call logout endpoint', { error: error.message });
  }
}

/**
 * Stop the Python backend process
 */
function stopBackend(): void {
  logger.info('BACKEND_STOP', 'Stopping backend process');

  if (pythonProcess) {
    logger.debug('BACKEND_STOP', 'Killing backend process', { pid: pythonProcess.pid });
    pythonProcess.kill();
    pythonProcess = null;
    backendReady = false;
    logger.info('BACKEND_STOP', 'Backend process stopped');
  } else {
    logger.debug('BACKEND_STOP', 'No backend process running');
  }
}

/**
 * Check if backend is healthy by testing an endpoint
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    logger.trace('BACKEND_HEALTH', 'Checking backend health');
    const response = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/status`);
    const isHealthy = response.ok;
    logger.trace('BACKEND_HEALTH', 'Backend health check result', { isHealthy, status: response.status });
    return isHealthy;
  } catch (error: any) {
    logger.trace('BACKEND_HEALTH', 'Backend health check failed', { error: error.message });
    return false;
  }
}

// ============================================================================
// Window Management
// ============================================================================

/**
 * Create the main application window
 */
async function createWindow(): Promise<void> {
  console.log('🪟 Creating application window...');

  // Determine correct preload path
  let preloadPath: string;
  if (isDev) {
    // Development: preload.js is in the same directory as main.js (both compiled to dist-electron/electron)
    preloadPath = path.join(__dirname, 'preload.js');
  } else {
    // Production: preload.js must be loaded from extraResources (not from app.asar)
    // Electron requires preload scripts to be on the real filesystem
    preloadPath = path.join(process.resourcesPath, 'dist-electron', 'electron', 'preload.js');
  }

  // Verify preload file exists
  logger.debug('WINDOW', 'Preload path resolved', { preloadPath, exists: fs.existsSync(preloadPath) });
  if (!fs.existsSync(preloadPath)) {
    logger.error('WINDOW', 'Preload script not found!', { preloadPath });
    console.error(`❌ CRITICAL: Preload script not found at: ${preloadPath}`);

    dialog.showErrorBox(
      'AMOKK - Preload Error',
      `Preload script not found.\n\nExpected path: ${preloadPath}\n\nPlease reinstall the application.`
    );

    app.quit();
    return;
  }

  let iconPath: string;
  if (isDev) {
    iconPath = path.join(__dirname, '../../assets/icon.png');
  } else {
    // In production, use the resources directory
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: iconPath,
  });

  // Determine the URL to load
  let loadURL: string;

  if (isDev) {
    // Development: Load from Vite dev server
    loadURL = 'http://localhost:8080';
    console.log(`📍 Development mode: Loading from Vite dev server`);
  } else {
    // Production: Load from bundled files
    const appPath = app.getAppPath();
    let baseDir: string;

    if (appPath.includes('app.asar')) {
      // Packed: /path/to/resources/app.asar
      baseDir = path.dirname(appPath); // Navigate to /path/to/resources
    } else {
      // Unpacked: /path/to/resources/app or /path/to/resources
      baseDir = path.dirname(appPath);
    }

    const frontendPath = path.join(baseDir, 'dist', 'index.html');

    // CRITICAL: Verify file exists before loading
    if (!fs.existsSync(frontendPath)) {
      console.error(`\n${'='.repeat(60)}`);
      console.error(`❌ CRITICAL ERROR: Frontend file not found!`);
      console.error(`${'='.repeat(60)}`);
      console.error(`\nExpected path: ${frontendPath}`);
      console.error(`\nDebug information:`);
      console.error(`  - appPath: ${appPath}`);
      console.error(`  - baseDir: ${baseDir}`);
      console.error(`  - isDev: ${isDev}`);

      try {
        console.error(`\nContents of baseDir (${baseDir}):`);
        const contents = fs.readdirSync(baseDir);
        contents.forEach(item => {
          const itemPath = path.join(baseDir, item);
          const isDir = fs.statSync(itemPath).isDirectory();
          console.error(`  ${isDir ? '📁' : '📄'} ${item}`);
        });
      } catch (e: any) {
        console.error(`  ⚠️  Could not read directory: ${e.message}`);
      }

      console.error(`${'='.repeat(60)}\n`);

      // Show error dialog to user
      // dialog already imported at top
      dialog.showErrorBox(
        'AMOKK - Startup Error',
        `Failed to load application.\n\nThe frontend files are missing or not in the expected location.\n\nPath: ${frontendPath}`
      );

      app.quit();
      return;
    }

    loadURL = `file://${frontendPath}`;
    console.log(`📍 Production mode: Loading from bundled files`);
    console.log(`📄 Frontend path: ${frontendPath}`);
  }

  console.log(`📍 Loading URL: ${loadURL}`);

  // Capture console messages from renderer process
  mainWindow.webContents.on('console-message', (level, message, line, sourceId) => {
    const levelName = ['log', 'warn', 'error'][level] || 'log';
    logger.debug('RENDERER', `${levelName.toUpperCase()}: ${message}`, { line, sourceId });
  });

  // Add error handler for failed page loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logger.error('WINDOW', 'Failed to load page!', {
      URL: validatedURL,
      errorCode: errorCode,
      error: errorDescription,
    });

    if (!isDev) {
      // dialog already imported at top
      dialog.showErrorBox(
        'AMOKK - Failed to Load',
        `Could not load the application.\n\nError: ${errorDescription}\n\nURL: ${validatedURL}`
      );
    }
  });

  mainWindow.webContents.on('crashed', () => {
    logger.error('WINDOW', 'Renderer process crashed');

    if (!isDev) {
      // dialog already imported at top
      dialog.showErrorBox(
        'AMOKK - Renderer Crashed',
        'The application renderer has crashed.\n\nPlease restart the application.'
      );
    }
  });

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('WINDOW', 'Page finished loading successfully');
  });

  // Attempt to load the page
  try {
    await mainWindow.loadURL(loadURL);
  } catch (error: any) {
    console.error(`❌ Failed to load URL: ${error.message}`);
    if (!isDev) {
      // dialog already imported at top
      dialog.showErrorBox(
        'AMOKK - Load Error',
        `Failed to load application: ${error.message}`
      );
    }
    app.quit();
    return;
  }

  // Open DevTools in development
  if (isDev) {
    console.log('🔧 Opening DevTools...');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('✅ Window created successfully\n');
}

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Setup IPC communication handlers
 */
function setupIPC(): void {
  logger.debug('IPC_SETUP', 'Setting up IPC handlers');

  // Get backend status
  ipcMain.handle('backend:status', async (): Promise<BackendStatus> => {
    logger.trace('IPC', 'backend:status requested');
    const healthy = await checkBackendHealth();
    return {
      running: backendReady && healthy,
      port: BACKEND_PORT,
      pid: pythonProcess?.pid,
    };
  });

  // Get app version
  ipcMain.handle('app:version', () => {
    logger.trace('IPC', 'app:version requested');
    return app.getVersion();
  });

  // Get app info
  ipcMain.handle('app:info', () => {
    logger.trace('IPC', 'app:info requested');
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      backendPort: BACKEND_PORT,
      isDev,
    };
  });

  // Get log file path
  ipcMain.handle('app:getLogPath', () => {
    const logPath = logger.getLogPath?.() || 'No log path available';
    logger.debug('IPC', 'app:getLogPath requested', { logPath });
    return logPath;
  });

  // Get log file contents
  ipcMain.handle('app:getLogs', async () => {
    try {
      const logPath = logger.getLogPath?.();
      if (!logPath || !fs.existsSync(logPath)) {
        logger.warn('IPC', 'Log file not found', { logPath });
        return 'Log file not found';
      }

      const contents = fs.readFileSync(logPath, 'utf-8');
      logger.debug('IPC', 'Log contents retrieved', { size: contents.length });
      return contents;
    } catch (error: any) {
      logger.error('IPC', 'Failed to read log file', { error: error.message });
      return `Error reading logs: ${error.message}`;
    }
  });

  // Clear logs
  ipcMain.handle('app:clearLogs', () => {
    try {
      logger.clearLogs?.();
      logger.info('IPC', 'Logs cleared by user');
      return { success: true, message: 'Logs cleared' };
    } catch (error: any) {
      logger.error('IPC', 'Failed to clear logs', { error: error.message });
      return { success: false, message: error.message };
    }
  });

  // Handle logs from renderer process
  ipcMain.handle('log:renderer', (event, data) => {
    const { level, args } = data;
    const message = args.join(' ');

    if (level === 'error') {
      logger.error('RENDERER', message);
    } else if (level === 'warn') {
      logger.warn('RENDERER', message);
    } else {
      logger.info('RENDERER', message);
    }

    return { success: true };
  });

  logger.info('IPC_SETUP', 'IPC handlers registered successfully');
}

// ============================================================================
// App Lifecycle
// ============================================================================

/**
 * App is ready - start backend and create window
 */
app.on('ready', async () => {
  logger.separator('AMOKK APPLICATION STARTING');

  try {
    logger.info('STARTUP', 'App ready event triggered');

    // Validate environment (production only)
    logger.info('STARTUP', 'Validating environment');
    await validateEnvironment();

    // Setup IPC handlers
    logger.info('STARTUP', 'Setting up IPC handlers');
    setupIPC();

    // Start Python backend (skip if frontend-only mode)
    if (isFrontendOnly) {
      logger.info('STARTUP', 'Frontend-only mode: skipping backend startup');
      logger.warn('STARTUP', 'Backend must be running separately on http://127.0.0.1:8000');
    } else {
      logger.info('STARTUP', 'Starting Python backend');
      await startBackend();
    }

    // Create main window
    logger.info('STARTUP', 'Creating application window');
    await createWindow();

    logger.info('STARTUP', 'Application ready!');

    // Run connectivity tests after everything is started
    logger.info('STARTUP', 'Running connectivity tests...');
    if (connectivityTest && connectivityTest.runConnectivityTests) {
      try {
        const testResults = await connectivityTest.runConnectivityTests(logger);
        const summary = testResults.getSummary();
        logger.info('TESTS', `Connectivity tests completed: ${summary.passed}/${summary.total} passed`, summary);
      } catch (testError: any) {
        logger.error('TESTS', 'Error running connectivity tests', { error: testError.message });
      }
    }

    logger.separator();
  } catch (error: any) {
    logger.error('STARTUP', 'Failed to start application', { error: error.message });
    logger.separator();

    // dialog already imported at top
    dialog.showErrorBox(
      'AMOKK - Startup Error',
      `Failed to start application:\n\n${error.message}`
    );

    app.quit();
  }
});

/**
 * Quit app when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  logger.info('LIFECYCLE', 'All windows closed');

  if (process.platform !== 'darwin') {
    logger.info('LIFECYCLE', 'Quitting app (not macOS)');
    app.quit();
  } else {
    logger.info('LIFECYCLE', 'Keeping app running (macOS convention)');
  }
});

/**
 * Re-create window when app is activated (macOS)
 */
app.on('activate', async () => {
  logger.info('LIFECYCLE', 'App activated');

  if (mainWindow === null) {
    logger.info('LIFECYCLE', 'Main window null, recreating');
    await createWindow();
  } else {
    logger.debug('LIFECYCLE', 'Main window already exists');
  }
});

/**
 * Handle app will-quit event to call logout before shutdown
 */
let logoutCalled = false;
app.on('will-quit', async (event) => {
  if (!logoutCalled) {
    event.preventDefault();
    logoutCalled = true;

    logger.separator('AMOKK APPLICATION CLOSING');
    logger.info('SHUTDOWN', 'App will-quit event triggered');

    // Call backend logout endpoint
    await callBackendLogout();

    // Now actually quit
    app.quit();
  }
});

/**
 * Clean up on app quit
 */
app.on('quit', () => {
  logger.info('SHUTDOWN', 'App quit event triggered');

  stopBackend();

  logger.info('SHUTDOWN', 'Application shutdown complete');
  logger.separator();
});

/**
 * Handle any uncaught exceptions
 */
process.on('uncaughtException', async (error: any) => {
  logger.fatal('UNCAUGHT_EXCEPTION', 'Uncaught exception', {
    message: error.message,
    stack: error.stack,
  });

  await callBackendLogout();
  stopBackend();
  logger.info('SHUTDOWN', 'Exiting due to uncaught exception');

  process.exit(1);
});
