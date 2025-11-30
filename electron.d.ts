/**
 * Global Electron API Types
 * Extends window object with our custom IPC API
 */

declare global {
  interface Window {
    api: {
      backend: {
        getStatus: () => Promise<{
          running: boolean;
          port: number;
          pid?: number;
          error?: string;
        }>;
      };
      app: {
        getVersion: () => Promise<string>;
        getInfo: () => Promise<{
          version: string;
          platform: string;
          arch: string;
          backendPort: number;
          isDev: boolean;
        }>;
      };
    };
  }
}

export {};
