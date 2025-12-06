# AMOKK Frontend-Only Build Guide

## Overview

This guide explains how to build and deploy AMOKK in **frontend-only mode**, where the Electron application contains only the React frontend and connects to a separately deployed backend server.

## When to Use Frontend-Only Mode

- **Microservices Architecture**: Backend deployed on a separate server
- **Cloud Deployment**: Backend hosted on AWS, Azure, or other cloud platforms
- **Reduced Application Size**: Frontend package is ~175 MB vs ~350 MB for full build
- **Backend Scaling**: Multiple frontends can connect to a single backend instance
- **Security**: Backend can run with elevated privileges while frontend runs as user

## Architecture Comparison

### Full Build (default)
```
┌─────────────────────────────────────┐
│   AMOKK.exe (350 MB)                │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend   │ │
│  │  (React App) │  │  (FastAPI)  │ │
│  └──────────────┘  └─────────────┘ │
│         │                  │        │
│         └──────────────────┘        │
│          http://127.0.0.1:8000     │
└─────────────────────────────────────┘
```

### Frontend-Only Build
```
┌─────────────────────────┐      ┌──────────────────┐
│  AMOKK-Frontend.exe     │      │  Backend Server  │
│  (175 MB)               │      │  (Separate)      │
│                         │      │                  │
│  ┌──────────────┐       │      │  ┌────────────┐  │
│  │   Frontend   │───────┼──────┼─>│   FastAPI  │  │
│  │  (React App) │       │ HTTP │  │   Backend  │  │
│  └──────────────┘       │      │  └────────────┘  │
│                         │      │                  │
└─────────────────────────┘      └──────────────────┘
     Client Side                    http://yourserver:8000
```

## Building Frontend-Only

### Prerequisites

- Node.js 18+ installed
- npm installed
- All project dependencies installed (`npm install`)

### Build Command

```bash
npm run dist:win_front
```

This command will:
1. Build the React frontend with Vite
2. Compile Electron TypeScript files
3. Package the frontend-only application with electron-builder
4. Output to `release-frontend/win-unpacked/`

### Build Output

```
release-frontend/
├── win-unpacked/
│   ├── AMOKK-Frontend.exe          # Main executable (~175 MB)
│   ├── resources/
│   │   ├── app.asar                # Packaged Node.js code
│   │   ├── dist/                   # React frontend build
│   │   ├── dist-electron/          # Electron compiled files
│   │   └── assets/                 # Icons and assets
│   └── locales/, *.dll, *.pak      # Electron/Chromium dependencies
│
├── AMOKK-Frontend-Installer.exe    # NSIS installer
└── builder-debug.yml               # Build logs
```

### Using Installation Script

```bash
# Build and prepare for Inno Setup
./install/install_winfront.sh /path/to/destination

# Example
./install/install_winfront.sh /mnt/c/Users/marca/Downloads
```

The script will:
- Build the frontend-only application
- Copy `release-frontend/win-unpacked/` to destination
- Create `inno-setup-frontend.iss` for Inno Setup compilation

## Configuration

### Backend URL Configuration

The frontend connects to the backend using environment variables defined in `.env`:

```env
# .env file
VITE_BACKEND_HOST=yourserver.com
VITE_BACKEND_PORT=8000
```

**Important**: These must be set **before building** because Vite embeds them at build time.

### Example Configurations

#### Local Development Backend
```env
VITE_BACKEND_HOST=127.0.0.1
VITE_BACKEND_PORT=8000
```

#### Production Cloud Backend
```env
VITE_BACKEND_HOST=api.amokk.fr
VITE_BACKEND_PORT=443
```

#### Internal Network Backend
```env
VITE_BACKEND_HOST=192.168.1.100
VITE_BACKEND_PORT=8000
```

## Deployment

### Frontend Deployment

1. **Build the frontend-only package**:
   ```bash
   # Configure backend URL in .env
   echo "VITE_BACKEND_HOST=api.yourserver.com" > .env
   echo "VITE_BACKEND_PORT=8000" >> .env

   # Build
   npm run dist:win_front
   ```

2. **Distribute the installer**:
   - Use `AMOKK-Frontend-Installer.exe` from `release-frontend/`
   - Or use Inno Setup to create custom installer

3. **Client Installation**:
   - Users run the installer
   - Application connects to configured backend URL
   - No Python or backend dependencies required on client

### Backend Deployment

The backend must be deployed separately and accessible at the URL configured in `.env`.

#### Option 1: Docker Deployment
```bash
# Build backend Docker image
cd backend
docker build -t amokk-backend .

# Run backend
docker run -p 8000:8000 amokk-backend
```

#### Option 2: Cloud Platform (AWS, Azure, GCP)
- Deploy `backend/` directory as a Python FastAPI application
- Ensure port 8000 is accessible
- Configure CORS to allow frontend domain

#### Option 3: On-Premise Server
```bash
# On server
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## How It Works

### Automatic Detection

The application automatically detects frontend-only mode at runtime:

```typescript
// electron/main.ts
let isFrontendOnly = false;
if (!isDev) {
  const backendDir = path.join(process.resourcesPath, 'backend', 'dist');
  isFrontendOnly = !fs.existsSync(backendDir);
}

if (isFrontendOnly) {
  logger.info('Frontend-only mode: skipping backend startup');
  logger.warn('Backend must be running separately on http://127.0.0.1:8000');
} else {
  await startBackend();
}
```

### API Connection

The frontend uses environment variables for API URLs:

```typescript
// src/pages/Login.tsx, Dashboard.tsx
const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST || '127.0.0.1';
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8000';
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
```

## Troubleshooting

### Frontend cannot connect to backend

**Check**:
1. Backend is running and accessible at configured URL
2. Firewall allows connections on backend port
3. CORS is configured correctly on backend
4. `.env` was set correctly **before building**

**Solution**:
```bash
# Test backend connection
curl http://yourserver:8000/status

# Rebuild with correct .env
npm run dist:win_front
```

### "Backend must be running separately" warning

**Expected**: This warning appears in frontend-only mode.

**Action**: Ensure backend is deployed and running at the configured URL.

### CORS errors in browser console

**Cause**: Backend CORS policy doesn't allow frontend origin.

**Solution**: Update backend CORS configuration in `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*", "https://yourfrontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Comparison: Full vs Frontend-Only

| Feature | Full Build | Frontend-Only |
|---------|-----------|---------------|
| **Size** | ~350 MB | ~175 MB |
| **Backend** | Embedded | Separate |
| **Python Required** | No (embedded) | Yes (on server) |
| **Deployment** | Single executable | Frontend + Backend |
| **Scalability** | One instance | Multiple frontends → 1 backend |
| **Updates** | Must redeploy full app | Can update backend independently |
| **Network** | Local only | Can be remote |
| **Use Case** | Standalone desktop app | Client-server architecture |

## Security Considerations

- **HTTPS**: Use HTTPS for production backend (configure in .env)
- **Authentication**: Backend JWT tokens are stored in localStorage
- **CORS**: Restrict CORS to known frontend domains
- **Firewall**: Only expose necessary backend ports

## Advanced: Multiple Environments

Build different versions for different environments:

```bash
# Development build
cp .env.dev .env
npm run dist:win_front
mv release-frontend release-frontend-dev

# Staging build
cp .env.staging .env
npm run dist:win_front
mv release-frontend release-frontend-staging

# Production build
cp .env.prod .env
npm run dist:win_front
mv release-frontend release-frontend-prod
```

## Support

For issues with frontend-only builds:
1. Check backend is accessible: `curl http://backend:8000/status`
2. Verify `.env` configuration before building
3. Check Electron logs in `~/.amokk/logs/`
4. Review build output in `release-frontend/builder-debug.yml`

## Files Changed for Frontend-Only Support

- `electron-builder-frontend.yml` - Frontend-only build configuration
- `electron/main.ts` - Auto-detection of frontend-only mode
- `src/pages/Login.tsx` - Uses env variables for API URL
- `src/pages/Dashboard.tsx` - Uses env variables for API URL
- `.env.example` - Documented backend configuration
- `install/install_winfront.sh` - Frontend-only installation script
- `package.json` - Added `dist:win_front` command
