# AMOKK Frontend Architecture - LLM Optimized

## Quick Summary
**Type**: React + TypeScript + Vite + Electron desktop app
**Purpose**: UI for AMOKK coaching platform (League of Legends)
**UI Framework**: Tailwind CSS + Radix UI components (shadcn/ui)
**Backend API**: `http://127.0.0.1:8000` (mock FastAPI)
**Package Manager**: npm
**Build**: Electron + Vite

---

## High-Level Architecture

### Technology Stack
```
Frontend Framework: React 18.3.1
Language: TypeScript 5.8.3
Build Tool: Vite 5.4.19
Styling: Tailwind CSS 3.4.17
Component Lib: Radix UI (via shadcn/ui)
Router: React Router v6.30.1
State Management: React Context API (Debug) + Fetch API
Data Fetching: Fetch API + React Query v5.83.0
Desktop Shell: Electron 28.0.0
Icons: Lucide React
Toast Notifications: Sonner v1.7.4
Form Validation: React Hook Form + Zod

Production Build: Electron Builder (cross-platform)
```

### Project Structure
```
src/
├── main.tsx              # App entry point
├── App.tsx               # Router + providers setup
├── index.css             # Global Tailwind styles
├── vite-env.d.ts         # Vite type definitions
│
├── pages/                # Page-level components
│   ├── Login.tsx         # Authentication page
│   ├── Dashboard.tsx     # Main dashboard/settings
│   └── NotFound.tsx      # 404 page
│
├── components/           # Reusable UI components
│   ├── DebugPanel.tsx    # Dev-only debug info viewer
│   ├── BackendStatus.tsx # Backend health check display
│   ├── NavLink.tsx       # Navigation link component
│   └── ui/               # shadcn/ui components (50+ button, card, input, etc.)
│
├── context/              # React Context providers
│   └── DebugContext.tsx  # Debug log storage context
│
├── hooks/                # Custom React hooks
│   ├── useDebugPanel.ts  # Wrapper for debug context
│   ├── use-mobile.tsx    # Mobile detection hook
│   └── use-toast.ts      # Toast notification hook
│
├── utils/                # Utility functions
│   └── logger.ts         # Conditional dev/prod logging
│
├── lib/                  # Helper/utility libraries
│   └── utils.ts          # Tailwind/classname utilities
│
└── assets/               # Static files (logo, etc.)
    └── logo.png
```

---

## Routing Structure

### Routes (4 total)
| Path | Component | Purpose | Auth Required |
|------|-----------|---------|---------------|
| `/` | Navigate to `/login` | Root redirect | No |
| `/login` | `Login.tsx` | User authentication | No |
| `/dashboard` | `Dashboard.tsx` | Main app interface | Yes (manual check) |
| `*` | `NotFound.tsx` | Catch-all 404 | No |

### Navigation Pattern
- No protected route enforcement (manual auth checks in components)
- Token stored in localStorage (`auth_token`)
- Manual navigation after successful login

---

## Key Components

### Pages

#### Login.tsx (155 lines)
**Purpose**: User authentication page
**Features**:
- Email + password input fields
- "Show password" toggle (Eye icon)
- Error message display (red banner)
- Loading state during request
- Auto-fill credentials in dev mode (`isDev`)
- Animated gradient background
- Logo display

**Backend Integration**:
- `POST /login` → `{email, password}`
- Response: `{token, remaining_games, plan_id, email}`
- Stores token in localStorage
- Navigates to `/dashboard` on success

**Dev Behavior**:
```typescript
if (isDev) {
  setEmail("admin@amokk.fr");
  setPassword("admin");
}
```

#### Dashboard.tsx (200+ lines)
**Purpose**: Main app dashboard with settings and coaching info
**Features** (partial read):
- Displays remaining games count
- Coach toggle switch
- Assistant toggle switch
- Volume control (slider 0-100)
- Push-to-Talk (PTT) key binding
- Proactive coach toggle
- Pricing plan selection modal
- Support request form

**State Management**:
```typescript
const [isActive, setIsActive] = useState(false);
const [assistantEnabled, setAssistantEnabled] = useState(true);
const [pushToTalkKey, setPushToTalkKey] = useState("V");
const [proactiveCoachEnabled, setProactiveCoachEnabled] = useState(false);
const [remainingGames, setRemainingGames] = useState(42);
const [volume, setVolume] = useState([70]);
const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
```

**Backend Calls**:
1. `GET /get_local_data` (on mount) → gets current state
2. `PUT /coach_toggle` → toggle main coach
3. `PUT /assistant_toggle` → toggle assistant
4. `PUT /update_volume` → update volume (0-100)
5. `PUT /update_ptt_key` → update PTT key
6. `POST /mock_select_plan` → change pricing plan
7. `POST /mock_contact_support` → submit support request

#### NotFound.tsx
**Purpose**: 404 error page
**Behavior**: Displayed for unknown routes

### Components

#### DebugPanel.tsx
**Purpose**: Development-only debug information viewer
**Features**:
- Shows last 20 debug log entries
- Two tabs: "Debug Responses" + "Guidelines"
- Guidelines organized by page (Login, Dashboard, etc.)
- Each guideline has test cases with step-by-step instructions
- Only visible in dev mode (`isDev`)

**Test Guidelines Structure**:
```typescript
interface TestGuide {
  name: string;              // Test name
  description: string;       // API endpoint
  testSteps: string[];       // Step-by-step instructions
}

interface PageGuideline {
  page: string;              // Page name
  icon: string;              // Emoji icon
  tests: TestGuide[];        // Array of test cases
}
```

**Example Guidelines**:
- Login: "Login avec credentials", "Login error handling"
- Dashboard: "Améliorer le Plan", "Coach Status Toggle", etc.

#### BackendStatus.tsx
**Purpose**: Display backend health/connection status
**Details**: Likely shows server connectivity

#### NavLink.tsx
**Purpose**: Custom navigation link component wrapper

### Context

#### DebugContext.tsx
**Purpose**: Store and manage debug log entries
**Features**:
- Stores max 20 debug entries
- Each entry: `{label: string, data: any, timestamp: Date}`
- Methods: `addDebugEntry()`, `clearDebugData()`
- Hook: `useDebug()` to access context

**Usage Pattern**:
```typescript
const debug = useDebugPanel();
debug.log("COACH_TOGGLE", responseData);  // Adds to debug panel
```

### Hooks

#### useDebugPanel.ts
**Purpose**: Convenient wrapper for debug context
**Returns**: `{log: addDebugEntry}`

#### use-mobile.tsx
**Purpose**: Responsive design hook to detect mobile viewport

#### use-toast.ts
**Purpose**: Toast notification hook (from shadcn/ui)

---

## Backend Integration (API Client)

### Base URL
```typescript
const BACKEND_URL = 'http://127.0.0.1:8000';
```

### API Call Pattern (in Dashboard.tsx)
```typescript
const fetchLocalData = async () => {
  try {
    logger.api('GET', '/get_local_data');
    const response = await fetch(`${BACKEND_URL}/get_local_data`);
    const data = await response.json();

    debug.log('GET_LOCAL_DATA', data);
    logger.apiResponse('/get_local_data', response.status, data);

    // Process response
  } catch (error) {
    logger.error('GET_LOCAL_DATA failed', error);
    debug.log('GET_LOCAL_DATA_ERROR', error message);
  }
};
```

### Error Handling
- Catch fetch errors
- Log to console (dev) and debug panel
- Display user-friendly error messages

### State Polling
- Optional: Can poll `/get_local_data` every 5 seconds (currently commented out)

---

## Logging System (logger.ts)

### Dev Mode (`import.meta.env.DEV`)
Verbose logs with emojis and full data

### Production Mode
Minimal logs with clean format

### Logger Methods
| Method | Dev Format | Prod Format | Usage |
|--------|-----------|-------------|-------|
| `debug()` | `🔍 [DEBUG] label` | (none) | Internal debugging |
| `info()` | `ℹ️ [INFO] label` | `label` | General information |
| `success()` | `✅ [SUCCESS] label` | `✓ label` | Success confirmations |
| `error()` | `❌ [ERROR] label` | `✗ label` | Error reporting |
| `warn()` | `⚠️ [WARN] label` | (none) | Warnings (dev only) |
| `api()` | `📡 [API] METHOD /endpoint` | (none) | API request logging |
| `apiResponse()` | `📡 [RESPONSE] /endpoint (status)` | (none) | API response logging |

---

## UI Components Library (shadcn/ui)

### 50+ Pre-built Components
All imported from `src/components/ui/`:
- Layout: Card, Sidebar, Resizable, Separator
- Input: Input, Textarea, Button, Select, Checkbox, Radio, Toggle
- Data Display: Progress, Badge, Avatar, Breadcrumb, Alert
- Overlay: Dialog, Popover, Dropdown Menu, Alert Dialog
- Tables: Tabs, Accordion, Collapsible
- Utilities: Toast, Toaster, Tooltip
- Advanced: Command, Carousel, Chart

### Styling Approach
- Tailwind CSS utility classes
- `clsx()` for conditional classnames
- `tailwind-merge` for dynamic class merging
- Dark mode support via `next-themes`

### Custom Button Variant
```
variant="gaming"  // Custom gaming-themed button style
```

---

## Development Workflow

### Environment Variables
- `import.meta.env.DEV` - Development mode detection
- `NODE_ENV` - Environment variable (set by electron script)

### Dev Mode Features
1. **Auto-filled Login**: `admin@amokk.fr / admin`
2. **Debug Panel**: Visible at bottom/side of screen
3. **Detailed Logging**: All API calls logged with emojis
4. **Test Guidelines**: Integrated testing guide in debug panel

### Build & Run Commands
```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Vite build to dist/
npm run electron     # Run Electron app in dev mode
npm run dist         # Build and package as Electron app
npm run dist:win     # Windows executable
npm run dist:mac     # macOS executable
npm run dist:linux   # Linux executable
```

### Electron Integration
- Uses `dist-electron/main.js` as entry point
- Electron spawns Python backend and Vite dev server
- Renderer process uses React frontend
- File:// origin allowed in CORS

---

## State Management Approach

### Client-Side State (useState)
- UI state (toggles, modals, form inputs)
- Form values (email, password, etc.)
- Loading states

### Context API (DebugContext)
- Debug log entries (dev-only)
- Shared across components

### Backend State (Persistent)
- All meaningful state stored on backend
- Frontend reads from `/get_local_data`
- Frontend updates via PUT/POST endpoints

### No Global State Library
- No Redux, Zustand, or Jotai
- Simple enough for mock app

---

## Performance Considerations

### React Query Integration
- Imported but not actively used in current code
- Available for future data fetching optimization
- Could replace fetch() calls for caching/retries

### Asset Optimization
- Logo loaded from `assets/logo.png`
- Lucide icons (tree-shakeable)
- Tailwind CSS (purged in build)

### CSS Bundle
- Tailwind CSS (production: ~30-50KB minified)
- Animation: `animate-pulse` (custom 8s duration)

---

## TypeScript Configuration

### Key Settings
```json
{
  "target": "ES2020",
  "lib": ["ES2020", "DOM", "DOM.Iterable"],
  "module": "ESNext",
  "jsx": "react-jsx",
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]      // Path alias for imports
  }
}
```

### Type Strictness
- `strict: false` - Lenient type checking
- `noUnusedLocals: false` - Allow unused variables
- `noImplicitAny: false` - Allow implicit any

---

## Styling System

### Tailwind CSS
- **Config**: `tailwind.config.ts`
- **Colors**: CSS custom properties (via design tokens)
- **Dark Mode**: Supported via `next-themes`
- **Animations**: Custom animations (e.g., `animate-pulse`)

### CSS Classes Used
| Class Pattern | Purpose |
|---|---|
| `min-h-screen` | Full viewport height |
| `flex items-center justify-center` | Centering |
| `bg-gradient-to-br` | Gradient backgrounds |
| `text-primary`, `text-accent` | Color system |
| `backdrop-blur` | Glassmorphism effect |
| `glow-text` | Custom glow effect |

### Custom Class: `glow-text`
- Used in login page title
- Likely adds text shadow/glow effect

---

## Known Issues & Patterns

### Authentication
- No actual JWT validation on frontend
- Token stored but not validated
- Manual navigation control (no route guards)

### API Error Handling
- Generic "Login failed" message
- Could be more specific per error type

### Proactive Coach Toggle
- Backend bug: ignores request body, always flips state
- Frontend assumes request.active is honored

### Polling
- `/get_local_data` polling commented out
- Could be enabled for live updates

---

## File Dependencies Summary

### Import Paths Used
- `@/components/ui/*` - UI component library
- `@/pages/*` - Page components
- `@/context/*` - Context providers
- `@/hooks/*` - Custom hooks
- `@/utils/*` - Utility functions
- `@/assets/*` - Static assets

### External Dependencies (Key)
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI framework |
| react-router-dom | 6.30.1 | Client-side routing |
| react-hook-form | 7.61.1 | Form state management |
| zod | 3.25.76 | Schema validation |
| lucide-react | 0.462.0 | Icon library |
| sonner | 1.7.4 | Toast notifications |
| tailwindcss | 3.4.17 | Utility CSS framework |
| recharts | 2.15.4 | Charts (imported but maybe not used) |
| @tanstack/react-query | 5.83.0 | Data fetching (available) |

---

## Development Best Practices

### Component Structure
1. **Imports**: UI components, hooks, utilities
2. **Constants**: Backend URL, default values
3. **Component Definition**: Function component with hooks
4. **API Methods**: Grouped at top of component
5. **Render**: JSX at bottom

### Event Handling
- Form submission: `e.preventDefault()` + async handler
- Toggle: Direct `onChange` handler
- Modal: State-driven visibility

### Error Feedback
- Error messages displayed to user
- Debug panel logs for development
- Console logs for production debugging

### Conditional Rendering
- Dev-only features: `{isDev && <Component />}`
- Loading states: `{isLoading ? "..." : "content"}`
- Error messages: `{errorMessage && <ErrorBanner />}`

---

## Integration Checklist

- [x] Frontend connects to backend at `http://127.0.0.1:8000`
- [x] Login endpoint functional
- [x] Dashboard displays and updates state
- [x] API calls properly logged (dev mode)
- [x] Error handling in place
- [x] Debug panel for development
- [x] Electron desktop app support
- [x] Responsive UI with Tailwind
- [ ] Production API endpoint (currently hardcoded)
- [ ] Real authentication/JWT validation
- [ ] Form validation with Zod (prepared, not used)
- [ ] React Query integration (prepared, not used)

---

## Version Info
- **Created**: React 18.3 + Vite 5.4 + Electron 28
- **Last Updated**: See git history
- **Node Version**: 16+ required
- **npm/yarn**: npm recommended
