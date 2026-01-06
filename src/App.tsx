import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { DebugPanel } from "@/components/DebugPanel";
import { DebugProvider } from "@/context/DebugContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { useEffect } from "react";

const queryClient = new QueryClient();
const isDev = import.meta.env.DEV;

// Run connectivity tests on app load
async function runStartupTests() {
  console.log('[APP] Running startup connectivity tests...');
  try {
    // Dynamic import to avoid circular dependencies
    const testModule = await import('../tools/connectivity-test.js');
    if (testModule.runConnectivityTests) {
      const results = await testModule.runConnectivityTests();
      const summary = results.getSummary();
      console.log('[APP] Tests completed:', summary);
      if (summary.allPassed) {
        console.log('[APP] ✅ All connectivity tests passed!');
      } else {
        console.warn('[APP] ⚠️  Some tests failed:', summary);
      }
    }
  } catch (error) {
    console.error('[APP] Error running tests:', error);
  }
}

const App = () => {
  // Run tests on component mount
  useEffect(() => {
    console.log('[APP] App component mounted, running tests...');
    runStartupTests();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <DebugProvider>
            <Toaster />
            <Sonner />

            <HashRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>

            {/* Debug panel visible only in dev mode */}
            <DebugPanel />
          </DebugProvider>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
