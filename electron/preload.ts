/**
 * AMOKK Electron Preload Script
 * Exposes safe IPC methods to the renderer process
 * Maintains security by limiting what the renderer can access
 */

/// <reference types="electron" />
import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose backend status and app info to renderer
 * All IPC calls go through here for security
 */
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
});

// Expose IPC for debugging in development
if (process.env.NODE_ENV === 'development') {
  console.log('✅ Preload script loaded - IPC API available');
}
