/**
 * Backend Status Component
 * Displays the status of the Python backend in development
 */

import { useEffect, useState } from 'react';

interface BackendStatusData {
  running: boolean;
  port: number;
  pid?: number;
  error?: string;
}

export function BackendStatus() {
  const [status, setStatus] = useState<BackendStatusData | null>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const hasElectronAPI = typeof window !== 'undefined' && !!(window as any).api;
    setIsElectron(hasElectronAPI);

    if (!hasElectronAPI) {
      return;
    }

    // Check backend status
    const checkStatus = async () => {
      try {
        const backendStatus = await (window as any).api.backend.getStatus();
        setStatus(backendStatus);
      } catch (error) {
        console.error('Failed to check backend status:', error);
      }
    };

    checkStatus();

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isElectron || !status) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-3 rounded-lg bg-slate-900 border border-slate-700 text-sm">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            status.running ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-slate-300">
          Backend: {status.running ? '🟢 Running' : '🔴 Offline'} (port {status.port})
        </span>
      </div>
      {status.error && (
        <div className="text-red-400 text-xs mt-1">{status.error}</div>
      )}
    </div>
  );
}
