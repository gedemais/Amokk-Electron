/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    openExternal: (url: string) => Promise<void>;
  };
  api?: {
    backend: {
      getStatus: () => Promise<any>;
    };
    app: {
      getVersion: () => Promise<string>;
      getInfo: () => Promise<any>;
    };
    logs: {
      getLogPath: () => Promise<string>;
      getLogs: () => Promise<string>;
      clearLogs: () => Promise<any>;
    };
  };
}