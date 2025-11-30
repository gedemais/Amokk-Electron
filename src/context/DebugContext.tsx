import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface DebugEntry {
  label: string;
  data: any;
  timestamp: Date;
}

interface DebugContextType {
  debugData: DebugEntry[];
  addDebugEntry: (label: string, data: any) => void;
  clearDebugData: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugData, setDebugData] = useState<DebugEntry[]>([]);

  const addDebugEntry = useCallback((label: string, data: any) => {
    setDebugData(prev => {
      const newData = [
        {
          label,
          data,
          timestamp: new Date(),
        },
        ...prev,
      ];
      // Keep only last 20 items
      return newData.slice(0, 20);
    });
  }, []);

  const clearDebugData = useCallback(() => {
    setDebugData([]);
  }, []);

  return (
    <DebugContext.Provider value={{ debugData, addDebugEntry, clearDebugData }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within DebugProvider');
  }
  return context;
}
