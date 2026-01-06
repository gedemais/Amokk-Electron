/**
 * AMOKK Electron Preload Script
 * Exposes safe IPC methods to the renderer process
 * Maintains security by limiting what the renderer can access
 */

/// <reference types="electron" />
import { contextBridge, ipcRenderer, shell } from 'electron';

/**
 * Expose backend status and app info to renderer
 * All IPC calls go through here for security
 */
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => shell.openExternal(url),
});

contextBridge.exposeInMainWorld('api', {
  // Backend management
  backend: {
    getStatus: () => ipcRenderer.invoke('backend:status'),
  },

  // App information
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    getInfo: () => ipcRenderer.invoke('app:info'),
  },

  // Logger and debugging
  logs: {
    getLogPath: () => ipcRenderer.invoke('app:getLogPath'),
    getLogs: () => ipcRenderer.invoke('app:getLogs'),
    clearLogs: () => ipcRenderer.invoke('app:clearLogs'),
  },
});

// Override console methods to send logs to main process
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function(...args) {
  originalLog(...args);
  ipcRenderer.invoke('log:renderer', { level: 'log', args: args.map(String) }).catch(() => {});
};

console.error = function(...args) {
  originalError(...args);
  ipcRenderer.invoke('log:renderer', { level: 'error', args: args.map(String) }).catch(() => {});
};

console.warn = function(...args) {
  originalWarn(...args);
  ipcRenderer.invoke('log:renderer', { level: 'warn', args: args.map(String) }).catch(() => {});
};

// Expose IPC for debugging in development
if (process.env.NODE_ENV === 'development') {
  console.log('[PRELOAD] Preload script loaded - IPC API available');
  console.log('[PRELOAD] Available APIs:');
  console.log('  - window.api.backend.getStatus()');
  console.log('  - window.api.app.getVersion()');
  console.log('  - window.api.app.getInfo()');
  console.log('  - window.api.logs.getLogPath()');
  console.log('  - window.api.logs.getLogs()');
  console.log('  - window.api.logs.clearLogs()');
}
