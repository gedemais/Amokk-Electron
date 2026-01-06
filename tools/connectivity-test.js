/**
 * Connectivity Tests - Unified test suite for frontend-backend communication
 *
 * Tests:
 * 1. Backend is running and accessible
 * 2. Frontend is loaded and rendering
 * 3. Frontend can reach backend API
 * 4. API endpoints are functional
 */

const getEnv = (key, fallback) => {
  // Check import.meta.env (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Check process.env (Node.js/Electron Main)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const BACKEND_HOST = getEnv('VITE_BACKEND_HOST', '127.0.0.1');
const BACKEND_PORT = getEnv('VITE_BACKEND_PORT', '8000');
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;

// ============================================================================
// Test Results Structure
// ============================================================================

class TestResults {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  addTest(name, status, details = {}) {
    this.tests.push({
      name,
      status, // 'PASS', 'FAIL', 'SKIP', 'TIMEOUT'
      timestamp: new Date().toISOString(),
      details,
    });

    if (status === 'PASS') this.passed++;
    if (status === 'FAIL') this.failed++;
  }

  getSummary() {
    const total = this.tests.length;
    const duration = Date.now() - this.startTime;
    return {
      total,
      passed: this.passed,
      failed: this.failed,
      duration: `${duration}ms`,
      allPassed: this.failed === 0,
    };
  }

  getReport() {
    return {
      summary: this.getSummary(),
      tests: this.tests,
    };
  }
}

// ============================================================================
// Test Implementations
// ============================================================================

async function testBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/status`, {
      timeout: 5000,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        passed: true,
        details: { status: data.status, port: BACKEND_PORT },
      };
    } else {
      return {
        passed: false,
        details: { statusCode: response.status, error: 'Unexpected status code' },
      };
    }
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message },
    };
  }
}

async function testBackendLogin() {
  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@amokk.fr',
        password: 'admin',
      }),
      timeout: 5000,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        passed: true,
        details: {
          email: data.email,
          hasToken: !!data.token,
          remainingGames: data.remaining_games,
        },
      };
    } else {
      const error = await response.json().catch(() => ({}));
      return {
        passed: false,
        details: { statusCode: response.status, error: error.detail || 'Login failed' },
      };
    }
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message },
    };
  }
}

async function testBackendGetLocalData() {
  try {
    const response = await fetch(`${BACKEND_URL}/get_local_data`, {
      timeout: 5000,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        passed: true,
        details: {
          remainingGames: data.remaining_games,
          firstLaunch: data.first_launch,
          gameTimer: data.game_timer,
        },
      };
    } else {
      return {
        passed: false,
        details: { statusCode: response.status },
      };
    }
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message },
    };
  }
}

async function testFrontendElement() {
  // Only works in browser context (frontend)
  if (typeof document === 'undefined') {
    return {
      passed: null, // SKIP
      details: { skipped: 'Not in browser context' },
    };
  }

  try {
    const rootElement = document.getElementById('root');
    const appElement = document.querySelector('[class*="App"]');

    return {
      passed: rootElement !== null && rootElement.children.length > 0,
      details: {
        rootExists: rootElement !== null,
        rootHasChildren: rootElement ? rootElement.children.length > 0 : false,
        appRendered: appElement !== null,
      },
    };
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message },
    };
  }
}

async function testFrontendBackendCommunication() {
  // Only works if we're in the frontend context
  if (typeof window === 'undefined') {
    return {
      passed: null, // SKIP
      details: { skipped: 'Not in browser context' },
    };
  }

  try {
    // Try to reach backend from frontend context
    const response = await fetch(`${BACKEND_URL}/status`, {
      timeout: 5000,
    });

    if (response.ok) {
      return {
        passed: true,
        details: { canReachBackend: true },
      };
    } else {
      return {
        passed: false,
        details: { statusCode: response.status },
      };
    }
  } catch (error) {
    return {
      passed: false,
      details: { error: error.message },
    };
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runConnectivityTests(logger = null) {
  const results = new TestResults();

  // Helper to log test results
  const logTest = (testName, result) => {
    if (logger && logger.info) {
      const status = result.passed === true ? 'PASS' : result.passed === false ? 'FAIL' : 'SKIP';
      const logLevel = status === 'PASS' ? 'info' : status === 'FAIL' ? 'error' : 'debug';
      logger[logLevel]('TEST', `${testName}: ${status}`, result.details);
    }
  };

  // Run tests
  const tests = [
    {
      name: 'Backend Health Check',
      fn: testBackendHealth,
    },
    {
      name: 'Backend Login Endpoint',
      fn: testBackendLogin,
    },
    {
      name: 'Backend Get Local Data',
      fn: testBackendGetLocalData,
    },
    {
      name: 'Frontend Element Rendering',
      fn: testFrontendElement,
    },
    {
      name: 'Frontend-Backend Communication',
      fn: testFrontendBackendCommunication,
    },
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();

      if (result.passed === true) {
        results.addTest(test.name, 'PASS', result.details);
      } else if (result.passed === false) {
        results.addTest(test.name, 'FAIL', result.details);
      } else {
        results.addTest(test.name, 'SKIP', result.details);
      }

      logTest(test.name, result);
    } catch (error) {
      results.addTest(test.name, 'FAIL', { error: error.message });
      logTest(test.name, { passed: false, details: { error: error.message } });
    }
  }

  // Log summary
  const summary = results.getSummary();
  if (logger && logger.info) {
    const reportStatus = summary.allPassed ? 'ALL TESTS PASSED' : `TESTS FAILED (${summary.failed}/${summary.total})`;
    logger.info('TEST_SUMMARY', reportStatus, summary);
  }

  return results;
}

// ============================================================================
// Exports
// ============================================================================

export {
  runConnectivityTests,
  TestResults,
  testBackendHealth,
  testBackendLogin,
  testBackendGetLocalData,
  testFrontendElement,
  testFrontendBackendCommunication,
};

// Also expose to window if in browser context
if (typeof window !== 'undefined') {
  window.connectivityTests = {
    runConnectivityTests,
    TestResults,
  };
}
