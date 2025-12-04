# AMOKK Windows Deployment - Session Summary (Dec 4, 2025)

## 🎯 CURRENT STATUS: Backend Launcher Output Capture

The Windows Electron app builds and starts successfully, but the Python backend isn't staying running. We're debugging launcher.py output capture. Made progress today but backend still not launching correctly.

---

## ⚠️ PROBLEM

**Symptom**: Backend process exits after ~16 seconds, app shows "Health check failed"

**What's Happening**:
1. App spawns python3.exe with launcher.py ✓
2. launcher.py runs for 10-16 seconds then exits
3. Can't see launcher.py output in logs (Python buffering issue)
4. No stderr/stdout from launcher.py being captured

**Latest Test** (22:31 UTC):
```
[22:31:05] Spawn python3.exe with launcher.py
[22:31:16] Health check timeout (10s wait) - backend not responding
[22:31:22] python.exe attempt exits with code 1
[22:31:25] App window opens (timeout fallback)
[22:31:25] Connectivity tests FAIL (3/5) - backend not running
```

---

## 🔧 CHANGES MADE TODAY

### 1. Fixed launcher.py Missing from Package
**File**: `electron-builder.yml` (lines 21-22)
```yaml
- from: backend/launcher.py
  to: backend/launcher.py
```
**Result**: launcher.py now included in build ✓

### 2. Added Python Output Unbuffering
**File**: `electron/main.ts` (line 451)
```typescript
env: { ...process.env, PYTHONUNBUFFERED: '1' }
```
**Why**: Prevents Python from buffering stdout/stderr when piped

### 3. Made launcher.py Verbose
**File**: `backend/launcher.py`
- Added [LAUNCHER] prefix to all output
- Shows: Python path, backend dir, requirements.txt path, pip status, main.py search, exit codes
- Purpose: Diagnose where launcher fails

### 4. Added Logging for Captured Output
**File**: `electron/main.ts` (lines 454-475)
- stdout/stderr listeners with logger.info() calls
- Changed from logger.debug → logger.info (so they show in logs)
- Output should appear as BACKEND_LAUNCHER_STDOUT / BACKEND_LAUNCHER_STDERR

---

## 📂 KEY FILES

### Source (WSL Build)
- **Main Electron Logic**: `/home/maboye/workplace/amok/electron/main.ts`
  - Lines 391-503: Python spawn and backend startup
  - Line 451: `PYTHONUNBUFFERED: '1'` (added today)
  - Lines 454-475: stdout/stderr capture (updated today)

- **Launcher Script**: `/home/maboye/workplace/amok/backend/launcher.py`
  - Installs dependencies: `pip install -r requirements.txt`
  - Spawns main.py: `subprocess.run([python, main.py])`
  - Must stay blocked on main.py forever (it's the FastAPI server)

- **Config**: `/home/maboye/workplace/amok/electron-builder.yml`
  - Lines 21-22: launcher.py in extraResources (added today)

### Deployment (Windows)
- **Deploy Dir**: `C:\Users\marca\OneDrive\Bureau-new\`
- **Backend Resources**: `C:\Users\marca\OneDrive\Bureau-new\resources\backend\`
  - `launcher.py` ← was missing, manually copied from release/win-unpacked
  - `main.py` ← FastAPI server
  - `requirements.txt` ← dependencies
  - `dist\AMOKK-Backend.exe` ← PyInstaller exe (skipped on Windows)

- **Test Launch**: `C:\Users\marca\OneDrive\Bureau-new\launch.bat`
- **Logs**: `C:\Users\marca\.amokk\logs\amokk-YYYY-MM-DD.log`

---

## 🚀 HOW IT WORKS

### Spawn Sequence
```
1. Electron app starts (AMOKK.exe)
   ↓
2. Validates resources exist
   ↓
3. Finds PyInstaller exe (AMOKK-Backend.exe)
   → Windows: SKIP IT (can't run Linux-compiled exe)
   ↓
4. Try Python commands in order: python3.exe, python.exe, py
   ↓
5. Spawn selected Python with launcher.py
   env: PYTHONUNBUFFERED=1, stdio: pipe stdout/stderr
   ↓
6. Listen for stdout/stderr and log them
   ↓
7. If error/exit ≠ 0: try next Python command
   ↓
8. If all fail: log error, continue with GUI anyway
   (status: timeout fallback, test results show failures)
```

### launcher.py Flow
```
print("[LAUNCHER] Starting AMOKK Backend Launcher")
print("[LAUNCHER] Python: {sys.executable}")

install_dependencies():
  - Check requirements.txt exists
  - Run: python -m pip install -r requirements.txt -q
  - Print success/error with [LAUNCHER] prefix

launch_main():
  - Check main.py exists
  - subprocess.run([sys.executable, "main.py"]) ← BLOCKS HERE
  - Runs uvicorn forever (should never return)
  - On return: print exit code

print("[LAUNCHER] Backend launcher exiting")
```

### main.py (FastAPI Server)
- Runs: `uvicorn.run(app, host="127.0.0.1", port=8000)`
- Should block forever
- Handles REST API endpoints
- Creates startup log message

---

## 📋 EXACT NEXT STEPS

### Session Start Procedure
1. Check logs from previous test to see if [LAUNCHER] output appears
2. If visible: diagnose why main.py isn't staying running
3. If not visible: implement file-based logging in launcher.py

### To Rebuild & Test
```bash
# Build the Windows package
bash /home/maboye/workplace/amok/install/install-windows.sh "/mnt/c/Users/marca/OneDrive/Bureau-new"

# Copy updated launcher.py to deployment
cp /mnt/c/Users/marca/OneDrive/Bureau-new/release/win-unpacked/resources/backend/launcher.py \
   /mnt/c/Users/marca/OneDrive/Bureau-new/resources/backend/launcher.py

# Clear old logs
rm "/mnt/c/Users/marca/.amokk/logs"/*.log 2>/dev/null || true

# Launch and test (on Windows or via WSL)
cd "/mnt/c/Users/marca/OneDrive/Bureau-new"
cmd.exe /c "launch.bat"

# After ~15 seconds, check logs
tail -300 "/mnt/c/Users/marca/.amokk/logs"/*.log | grep -E "\[LAUNCHER\]|BACKEND_LAUNCHER|BACKEND_SPAWN"
```

### Check For
Look in logs for:
- `[LAUNCHER]` prefix strings (from launcher.py)
- `BACKEND_LAUNCHER_STDOUT` entries (captured output)
- `BACKEND_LAUNCHER_STDERR` entries (error output)

If found → check what launcher.py says about pip install and main.py
If not found → Python output still being buffered, need different approach

---

## 🐛 DEBUGGING STRATEGY

### If [LAUNCHER] output appears:
```
✓ launcher.py IS running
✓ output IS being captured
✓ Now diagnose main.py behavior:
  - Check if pip install succeeded
  - Check if main.py was found
  - Check if uvicorn start log appears
  - Check why main.py exited (if it did)
```

### If [LAUNCHER] output doesn't appear:
```
✗ stdout/stderr capture not working
Options:
A) Switch stdio to 'inherit' (see output in console)
B) Use file-based logging in launcher.py
   - Write to: backend/launcher_debug.log
   - Check: C:\Users\marca\OneDrive\Bureau-new\resources\backend\launcher_debug.log
```

---

## 🔑 KEY CODE LOCATIONS

### Python Spawn (electron/main.ts:447-452)
```typescript
pythonProcess = spawn(pythonCmd, [backendLauncher], {
  cwd: path.dirname(backendLauncher),
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false,
  env: { ...process.env, PYTHONUNBUFFERED: '1' },  // ← ADDED TODAY
});
```

### Output Capture (electron/main.ts:458-475)
```typescript
if (pythonProcess.stdout) {
  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    pythonStdout += output;
    if (output) {
      logger.info('BACKEND_LAUNCHER_STDOUT', output);  // ← CHANGED TO INFO
    }
  });
}
// Same for stderr...
```

### Log On Error (electron/main.ts:491-496)
```typescript
logger.info('BACKEND_SPAWN', 'Python exited with error, trying next command', {
  pythonCmd,
  exitCode: code,
  stdout: pythonStdout,  // ← Will show captured output
  stderr: pythonStderr,  // ← Will show captured errors
});
```

---

## 📊 TEST RESULTS (Last Test 22:31 UTC)

```
Spawn 1: python3.exe launcher.py
  - No error event
  - No exit event for 10+ seconds
  - Health check times out after 20s waiting

Spawn 2: python.exe launcher.py
  - Exits quickly with code 1

Spawn 3: py launcher.py
  - (still in progress in logs)

App Response:
  - Window opens (startup timeout fallback)
  - All connectivity tests fail
  - Backend not responding on port 8000
```

---

## 🎯 SUCCESS CRITERIA

When working correctly:
1. `[LAUNCHER]` output appears in logs
2. Shows Python path and working directory
3. Shows "Installing dependencies..." and success
4. Shows "main.py found, starting server..."
5. **Backend doesn't exit** - stays running forever
6. Electron health check succeeds
7. App fully functional with backend responding

---

## 💾 BUILD ENVIRONMENT

**WSL (Build)**:
- Python 3.12.3
- venv at: `/home/maboye/workplace/amok/backend/venv`
- Build script: `/home/maboye/workplace/amok/install/install-windows.sh`

**Windows (Runtime)**:
- Python 3.12.10
- Commands: python3.exe, python.exe, py (all work)
- Path: `C:\Users\marca\OneDrive\Bureau-new\`

---

## 📝 PREVIOUS SESSION CONTEXT

From earlier sessions:
- Fixed cross-platform Python detection
- Fixed PyInstaller exe skip on Windows
- Created install scripts with venv support
- Implemented path resolution for resources
- Added IPC handlers and health checks
- Created launcher.py for dependency auto-install
- Fixed Inno Setup configuration

This session:
- Fixed launcher.py missing from package
- Added Python unbuffering
- Made launcher.py verbose
- Added stdout/stderr capture with logging
- Ready to diagnose backend startup issue

---

## 🔄 WHAT'S NEEDED TO PROCEED

1. **Rebuild and test** with latest changes
2. **Check logs** for [LAUNCHER] output appearance
3. **Diagnose** where launcher.py / main.py fails
4. **Fix** the root cause (likely main.py not starting correctly)
5. **Verify** backend stays running
6. **Test full flow**: spawn → pip → launch → health check → app ready

---

**Last Modified**: December 4, 2025 ~22:35 UTC
**Status**: Awaiting next session to test output capture changes
**Priority**: Get launcher.py output visible in logs
