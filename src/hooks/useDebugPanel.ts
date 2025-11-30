import { useDebug } from '@/context/DebugContext';

/**
 * Hook personnalisé pour les components qui font des API calls
 * Provides a convenient way to log API requests and responses to the debug panel
 */
export function useDebugPanel() {
  const { addDebugEntry } = useDebug();

  return {
    log: addDebugEntry,
  };
}
