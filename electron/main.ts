/**
 * AMOKK Electron Main Process
 * Manages:
 * - Electron window creation and lifecycle
 * - Python backend subprocess
 * - IPC communication between main and renderer
 * - Auto-updates and system integration
 */

/// <reference types="electron" />
import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ============================================================================
// Configuration
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect development mode: check if we're running from unpacked source or ASAR
const isDev = !app.isPackaged;
const BACKEND_PORT = 8000;
const BACKEND_HOST = '127.0.0.1';

// Determine backend path
function getBackendPath(): string {
  let backendExe: string;
  let backendPy: string;
  let baseDir: string;

  if (isDev) {
    // Development: use project root
    baseDir = path.join(__dirname, '..');
  } else {
    // Production: extraResources are placed in the root of the app resources
    // AppImage structure: /tmp/.mount_XXX/resources/ contains everything
    const appPath = app.getAppPath();

    // Navigate up from app.asar to get to resources directory
    if (appPath.includes('app.asar')) {
      // Path is like: /path/to/resources/app.asar
      baseDir = path.dirname(appPath); // Go up from app.asar to resources/
    } else {
      // Path is like: /path/to/resources/app (unpacked)
      baseDir = path.dirname(appPath);
    }
  }

  const backendDir = path.join(baseDir, 'backend');

  if (process.platform === 'win32') {
    backendExe = path.join(backendDir, 'dist', 'AMOKK-Backend.exe');
  } else {
    backendExe = path.join(backendDir, 'dist', 'AMOKK-Backend');
  }
  backendPy = path.join(backendDir, 'main.py');

  console.log(`🔍 Path resolution:
    - isDev: ${isDev}
    - baseDir: ${baseDir}
    - backendExe: ${backendExe}
    - backendExe exists: ${fs.existsSync(backendExe)}`);

  // Try to use PyInstaller-built executable FIRST (preferred)
  if (fs.existsSync(backendExe)) {
    console.log(`✅ Using PyInstaller executable: ${backendExe}`);
    return backendExe;
  }

  // Fallback to Python script
  console.log(`⚠️  PyInstaller executable not found, falling back to Python script: ${backendPy}`);
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
// Backend Management
// ============================================================================

/**
 * Start the Python backend process
 */
async function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (pythonProcess) {
      console.log('🔄 Backend already running');
      resolve();
      return;
    }

    console.log(`🚀 Starting Python backend on ${BACKEND_HOST}:${BACKEND_PORT}...`);

    const backendPath = getBackendPath();
    console.log(`📁 Backend path: ${backendPath}`);

    try {
      // Check if backend is an executable or script
      const isPy = backendPath.endsWith('.py');
      const isWinExe = backendPath.endsWith('.exe');
      // On Linux/Mac, PyInstaller creates binary without extension
      // We detect it by the filename pattern and file existence
      const isLinuxBinary = !isPy && !isWinExe && fs.existsSync(backendPath);

      console.log(`📝 Backend path type check:
        - Path: ${backendPath}
        - Is Python: ${isPy}
        - Is Windows Exe: ${isWinExe}
        - Is Linux Binary: ${isLinuxBinary}
        - File exists: ${fs.existsSync(backendPath)}`);

      if ((isWinExe || isLinuxBinary) && !isPy) {
        // Run the PyInstaller-built executable directly
        // Ensure it has execute permissions (for AppImage/extracted builds)
        if (process.platform !== 'win32') {
          try {
            fs.chmodSync(backendPath, 0o755);
            console.log('✅ Set executable permissions (chmod +x)');
          } catch (e: any) {
            // Ignore if file system is read-only (AppImage mounted as read-only)
            if (e.code === 'EROFS') {
              console.log('ℹ️  File system is read-only (AppImage), skipping chmod');
            } else {
              console.warn('⚠️  Could not chmod backend:', e.message);
            }
          }
        }

        console.log(`🚀 Spawning PyInstaller executable: ${backendPath}`);
        pythonProcess = spawn(backendPath, [], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
        });
      } else {
        // Run Python script
        let pythonCmd = 'python3';
        if (process.platform === 'win32') {
          pythonCmd = 'python';
        }

        console.log(`🐍 Spawning Python script with: ${pythonCmd} ${backendPath}`);
        pythonProcess = spawn(pythonCmd, [backendPath], {
          cwd: path.dirname(backendPath),
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
        });
      }

      let backendOutput = '';

      pythonProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        console.log(`[Backend] ${message}`);
        backendOutput += message;

        // Check if backend is ready
        if (
          message.includes('Uvicorn running') ||
          message.includes('Server running on')
        ) {
          backendReady = true;
          console.log('✅ Backend is ready!');
          resolve();
        }
      });

      pythonProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        console.error(`[Backend Error] ${message}`);
        backendOutput += message;
      });

      pythonProcess.on('error', (err) => {
        console.error(`❌ Failed to start backend: ${err.message}`);
        backendReady = false;
        reject(err);
      });

      pythonProcess.on('exit', (code) => {
        console.log(`⚠️  Backend exited with code ${code}`);
        pythonProcess = null;
        backendReady = false;
      });

      // Timeout for backend startup (10 seconds)
      setTimeout(() => {
        if (!backendReady) {
          console.warn('⏱️ Backend startup timeout - assuming it started');
          resolve();
        }
      }, 10000);
    } catch (error) {
      console.error(`❌ Error starting backend:`, error);
      backendReady = false;
      reject(error);
    }
  });
}

/**
 * Stop the Python backend process
 */
function stopBackend(): void {
  if (pythonProcess) {
    console.log('🛑 Stopping backend...');
    pythonProcess.kill();
    pythonProcess = null;
    backendReady = false;
  }
}

/**
 * Check if backend is healthy by testing an endpoint
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`http://${BACKEND_HOST}:${BACKEND_PORT}/status`);
    return response.ok;
  } catch {
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
  let iconPath: string;

  if (isDev) {
    preloadPath = path.join(__dirname, 'preload.ts');
    iconPath = path.join(__dirname, '../assets/icon.png');
  } else {
    // In production, use the resources directory
    const appPath = app.getAppPath();
    let baseDir: string;
    if (appPath.includes('app.asar')) {
      baseDir = path.dirname(appPath); // Go up from app.asar to resources/
    } else {
      baseDir = path.dirname(appPath);
    }
    preloadPath = path.join(baseDir, 'dist-electron', 'preload.js');
    iconPath = path.join(baseDir, 'assets', 'icon.png');
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

  // Try to load from Vite dev server first
  const devUrl = 'http://localhost:8080';
  let prodUrl: string;

  if (isDev) {
    prodUrl = `file://${path.join(__dirname, '../dist/index.html')}`;
  } else {
    // In production, use the bundled dist directory in resources
    const appPath = app.getAppPath();
    let baseDir: string;
    if (appPath.includes('app.asar')) {
      baseDir = path.dirname(appPath);
    } else {
      baseDir = path.dirname(appPath);
    }
    prodUrl = `file://${path.join(baseDir, 'dist', 'index.html')}`;
  }

  let loadURL: string;

  // In development, try dev server; in production, use bundled files
  if (isDev) {
    loadURL = devUrl;
  } else {
    loadURL = prodUrl;
  }

  console.log(`📍 Loading URL: ${loadURL}`);

  // Check if file exists (for debugging)
  if (loadURL.startsWith('file://')) {
    const filePath = loadURL.replace('file://', '');
    const exists = fs.existsSync(filePath);
    console.log(`📄 File exists (${filePath}): ${exists}`);
  }

  // Add error handler for failed page loads
  mainWindow.webContents.on('did-fail-load', () => {
    console.error('❌ Failed to load page:', loadURL);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('❌ Renderer process crashed');
  });

  await mainWindow.loadURL(loadURL);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('✅ Window created');
}

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Setup IPC communication handlers
 */
function setupIPC(): void {
  // Get backend status
  ipcMain.handle('backend:status', async (): Promise<BackendStatus> => {
    const healthy = await checkBackendHealth();
    return {
      running: backendReady && healthy,
      port: BACKEND_PORT,
      pid: pythonProcess?.pid,
    };
  });

  // Get app version
  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  // Get app info
  ipcMain.handle('app:info', () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      backendPort: BACKEND_PORT,
      isDev,
    };
  });
}

// ============================================================================
// App Lifecycle
// ============================================================================

/**
 * App is ready - start backend and create window
 */
app.on('ready', async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 AMOKK Application Starting');
  console.log('='.repeat(60) + '\n');

  try {
    // Setup IPC handlers first
    setupIPC();

    // Start Python backend
    await startBackend();

    // Create main window
    await createWindow();

    console.log('\n✅ Application ready!\n');
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    app.quit();
  }
});

/**
 * Quit app when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Re-create window when app is activated (macOS)
 */
app.on('activate', async () => {
  if (mainWindow === null) {
    await createWindow();
  }
});

/**
 * Clean up on app quit
 */
app.on('quit', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🛑 AMOKK Application Closing');
  console.log('='.repeat(60) + '\n');
  stopBackend();
});

/**
 * Handle any uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  stopBackend();
  process.exit(1);
});
