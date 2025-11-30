/**
 * Debug Panel - Only visible in development mode
 * Shows API responses and debug information
 * Features: Debug responses tab + Guidelines tab for backend route testing
 */

import { useState, useEffect, useRef } from 'react';
import { useDebug } from '@/context/DebugContext';

interface TestGuide {
  name: string;
  description: string;
  testSteps: string[];
}

interface PageGuideline {
  page: string;
  icon: string;
  tests: TestGuide[];
}

// Guidelines organized by page
const PAGE_GUIDELINES: PageGuideline[] = [
  {
    page: 'Login',
    icon: '🔐',
    tests: [
      {
        name: 'Login avec credentials',
        description: 'POST /login',
        testSteps: [
          '1. Email auto-rempli: admin@amokk.fr',
          '2. Password auto-rempli: admin',
          '3. Clique "Login" button',
          '4. Check Debug tab → LOGIN_RESPONSE',
          '5. Verify token, remaining_games, plan_id dans response',
          '6. Should navigate to Dashboard after login',
        ],
      },
      {
        name: 'Login error handling',
        description: 'Test invalid credentials',
        testSteps: [
          '1. Change email to invalid (e.g., test@test.com)',
          '2. Clique "Login"',
          '3. Should show error message in red',
          '4. Check Debug tab → LOGIN_ERROR',
          '5. Should NOT navigate to Dashboard',
        ],
      },
    ],
  },
  {
    page: 'Dashboard',
    icon: '📊',
    tests: [
      {
        name: 'Améliorer le Plan',
        description: 'GET /get_local_data + Plan selection',
        testSteps: [
          '1. Page load → auto-fetches GET_LOCAL_DATA',
          '2. Check Debug tab → GET_LOCAL_DATA response',
          '3. Clique "Améliorer le Plan" button',
          '4. Dialog shows 3 pricing plans (Starter, Try-Hard, Rush)',
          '5. Verify remaining_games count displayed',
          '6. Optional: Try selecting a plan (UI only)',
        ],
      },
      {
        name: 'Coach Status Toggle',
        description: 'PUT /coach_toggle',
        testSteps: [
          '1. Locate "Statut du Coach" card',
          '2. Toggle switch ON',
          '3. Check Debug tab → COACH_TOGGLE response',
          '4. Verify: success=true, active=true',
          '5. Text should change to "Actif"',
          '6. Toggle OFF again → verify active=false',
        ],
      },
      {
        name: 'Amélioration Panel',
        description: 'Configuration options (Assistant, PTT Key, Volume, Coach Proactif)',
        testSteps: [
          '🤖 Assistant Toggle:',
          '  1. Clique "Configuration" card',
          '  2. Find "Assistant" toggle in dialog',
          '  3. Toggle ON → Check Debug tab → ASSISTANT_TOGGLE',
          '  4. Verify: success=true, active=true',
          '',
          '🎙️ Push-to-Talk Key Binding:',
          '  1. In Configuration dialog → "Raccourci Push-to-Talk"',
          '  2. Clique "Bind Key" button → Press a key (F12, V, P)',
          '  3. Button shows selected key',
          '  4. Check Debug tab → UPDATE_PTT_KEY response',
          '  5. Verify ppt_key field matches',
          '',
          '🔊 Volume Control:',
          '  1. In Configuration dialog → find Volume slider',
          '  2. Drag slider to change value',
          '  3. Check Debug tab → UPDATE_VOLUME response',
          '  4. Verify: volume field matches slider',
          '  5. Click "Tester le Volume" → hear voice at new volume',
          '',
          '🎯 Coach Proactif Toggle:',
          '  1. In Configuration dialog → "Coach Proactif (V1.9.6)"',
          '  2. Toggle ON/OFF',
          '  3. Check Debug tab → MOCK_PROACTIVE_COACH_TOGGLE',
          '  4. Verify: success=true, active=true/false',
        ],
      },
      {
        name: 'Contact Support Button',
        description: 'POST /mock_contact_support',
        testSteps: [
          '1. Scroll down to "Un problème?" section',
          '2. Clique "Nous Contacter" button',
          '3. Check Debug tab → MOCK_CONTACT_SUPPORT response',
          '4. Verify: success=true, ticket_id generated',
          '5. Ticket ID format: AMOKK-XXXXX',
        ],
      },
    ],
  },
];

export function DebugPanel() {
  const { debugData, clearDebugData } = useDebug();
  const [expanded, setExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [activeTab, setActiveTab] = useState<'debug' | 'guidelines'>('debug');
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const headerRef = useRef<HTMLDivElement>(null);
  const isDev = import.meta.env.VITE_DEV === 'true';

  const togglePageExpand = (page: string) => {
    const newSet = new Set(expandedPages);
    if (newSet.has(page)) {
      newSet.delete(page);
    } else {
      newSet.add(page);
    }
    setExpandedPages(newSet);
  };

  const toggleTestExpand = (testId: string) => {
    const newSet = new Set(expandedTests);
    if (newSet.has(testId)) {
      newSet.delete(testId);
    } else {
      newSet.add(testId);
    }
    setExpandedTests(newSet);
  };

  // Bloquer complètement les événements du Debug Panel
  const blockEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Helper pour exécuter une action et bloquer l'événement
  const withBlockedEvent = (callback: () => void) => (e: React.SyntheticEvent) => {
    blockEvent(e);
    callback();
  };

  if (!isDev) return null;

  // Drag and drop with global event listeners
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking on header, not on buttons
    if ((e.target as HTMLElement).closest('button')) return;

    blockEvent(e);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // Toggle visibility
  if (isHidden) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setIsHidden(false)}
          className="px-3 py-2 bg-cyan-900 hover:bg-cyan-800 text-cyan-300 rounded border border-cyan-500 font-bold text-sm transition-colors"
          title="Open Debug Panel"
        >
          🔍 Debug
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed w-96 bg-slate-900 border-l-2 border-b-2 border-cyan-500 text-xs font-mono text-cyan-400 overflow-hidden flex flex-col select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxHeight: `calc(100vh - ${position.y}px)`,
        zIndex: 99999,
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
      onClick={blockEvent}
      onMouseDown={blockEvent}
      onKeyDown={blockEvent}
      onContextMenu={blockEvent}
      onDoubleClick={blockEvent}
    >
      {/* Header - Draggable & Clickable */}
      <div
        className="bg-slate-800 px-3 py-2 flex justify-between items-center border-b border-cyan-500 cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-colors"
        onMouseDown={handleHeaderMouseDown}
        onClick={(e) => {
          blockEvent(e);
          if (!(e.target as HTMLElement).closest('button')) {
            setExpanded(!expanded);
          }
        }}
      >
        <div className="flex-1 flex items-center gap-2">
          <span className="font-bold">🔍 DEBUG PANEL</span>
          <span>
            {expanded ? '▼' : '▲'}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-1" onClick={blockEvent}>
          {expanded && activeTab === 'debug' && debugData.length > 0 && (
            <button
              onClick={withBlockedEvent(clearDebugData)}
              className="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 text-red-300 rounded border border-red-700 transition-colors"
              title="Clear debug logs"
            >
              Clear
            </button>
          )}

          <button
            onClick={withBlockedEvent(() => setIsHidden(true))}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600 transition-colors"
            title="Hide Debug Panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      {expanded && (
        <>
          <div className="flex border-b border-cyan-900 bg-slate-800">
            <button
              onClick={withBlockedEvent(() => setActiveTab('debug'))}
              className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'debug'
                  ? 'bg-cyan-900 text-cyan-300 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              💾 Debug
            </button>
            <button
              onClick={withBlockedEvent(() => setActiveTab('guidelines'))}
              className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === 'guidelines'
                  ? 'bg-cyan-900 text-cyan-300 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              📋 Guidelines
            </button>
          </div>

          {/* Content */}
          <div
            className="overflow-y-auto flex-1 min-h-0 p-2 space-y-2"
            onClick={blockEvent}
            onMouseDown={blockEvent}
          >
            {activeTab === 'debug' ? (
              <>
                {debugData.length === 0 ? (
                  <div className="text-slate-400">Waiting for API responses...</div>
                ) : (
                  debugData.map((item, idx) => (
                    <div key={idx} className="bg-slate-800 p-2 rounded border border-cyan-900">
                      <div className="font-bold text-cyan-300">{item.label}</div>
                      <div className="text-cyan-400 mt-1 whitespace-pre-wrap break-words">
                        {typeof item.data === 'object' ? JSON.stringify(item.data, null, 2) : item.data}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              <>
                {PAGE_GUIDELINES.map((pageGuide) => (
                  <div key={pageGuide.page} className="bg-slate-800 p-2 rounded border border-cyan-900">
                    {/* Page Header - Collapsible */}
                    <button
                      onClick={withBlockedEvent(() => togglePageExpand(pageGuide.page))}
                      className="w-full flex items-center gap-2 text-left hover:bg-slate-700 p-1 rounded transition-colors"
                    >
                      <span className="text-lg">{pageGuide.icon}</span>
                      <span className="font-bold text-cyan-300 flex-1">{pageGuide.page}</span>
                      <span className="text-slate-400 text-xs">
                        {expandedPages.has(pageGuide.page) ? '▼' : '▶'}
                      </span>
                    </button>

                    {/* Tests - Collapsed/Expanded */}
                    {expandedPages.has(pageGuide.page) && (
                      <div className="mt-2 space-y-2 ml-2">
                        {pageGuide.tests.map((test, testIdx) => {
                          const testId = `${pageGuide.page}-${testIdx}`;
                          const isTestExpanded = expandedTests.has(testId);
                          return (
                            <div key={testIdx} className="bg-slate-900 p-2 rounded border border-slate-700">
                              {/* Test Header - Collapsible */}
                              <button
                                onClick={withBlockedEvent(() => toggleTestExpand(testId))}
                                className="w-full flex items-center gap-2 text-left hover:bg-slate-800 p-1 -mx-1 rounded transition-colors"
                              >
                                <span className="text-slate-400 text-xs">
                                  {isTestExpanded ? '▼' : '▶'}
                                </span>
                                <span className="font-semibold text-cyan-300 flex-1">{test.name}</span>
                              </button>
                              <div className="text-slate-400 text-xs mb-2 ml-5">{test.description}</div>

                              {/* Steps - Collapsed/Expanded */}
                              {isTestExpanded && (
                                <>
                                  <div className="text-yellow-300 text-xs font-semibold mb-1 ml-5">🧪 Steps:</div>
                                  <div className="text-slate-300 text-xs space-y-1 ml-7">
                                    {test.testSteps.map((step, stepIdx) => (
                                      <div key={stepIdx} className="text-slate-300">
                                        {step}
                                      </div>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
