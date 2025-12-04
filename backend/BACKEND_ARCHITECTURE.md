# AMOKK Backend Architecture - LLM Optimized

## Quick Summary
**Type**: FastAPI REST API (Mock Backend)
**Purpose**: Provide coaching data and settings for AMOKK React/Electron frontend
**Language**: Python 3.12
**Run**: `python main.py` (starts Uvicorn on `127.0.0.1:8000`)
**State Persistence**: JSON file (`state.json`)

---

## Architecture Overview

### Single File Structure
- **main.py** - Complete FastAPI application (654 lines)
  - Logging setup (suppresses FastAPI/Uvicorn verbosity)
  - Pydantic request/response models
  - Authentication (mock JWT)
  - AppState class (persistent state manager)
  - FastAPI app with CORS middleware
  - All endpoints (8 total)
  - Startup/shutdown events

### Dependencies (4 only)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
```

---

## State Management (AppState Class)

### In-Memory + Persistent Storage
- **Storage**: `state.json` file in backend root
- **Load on startup**: Reads state.json or creates defaults
- **Save on update**: Every modification calls `save_state()`

### State Properties
| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `remaining_games` | int | 42 | Coaching sessions available |
| `first_launch` | bool | True | First user experience flag |
| `game_timer` | int | 0 | In-game timer (seconds) |
| `coach_active` | bool | True | Main coach enabled/disabled |
| `assistant_active` | bool | True | Assistant enabled/disabled |
| `proactive_coach_active` | bool | False | Proactive coach mode toggle |
| `ptt_key` | str | 'v' | Push-to-Talk key binding |
| `volume` | int | 80 | Volume level (0-100) |
| `plan_id` | int | 1 | Current pricing plan (1,2,3) |

---

## Authentication

### Mock Authentication (Development Only)
```python
VALID_USERS = {
    "admin@amokk.fr": "admin",
}
```

### Login Endpoint
- **POST /login**
  - Input: `{email, password}`
  - Output: `{token, remaining_games, plan_id, email}`
  - Token: Random hex-based mock JWT (no signature validation)
  - Status: 401 on invalid credentials

---

## CORS Configuration

### Allowed Origins
```
http://localhost:8080     # Vite dev server
http://127.0.0.1:8080
http://localhost:3000     # Alternative dev port
http://127.0.0.1:3000
http://localhost:5173     # Vite default port
http://127.0.0.1:5173
file://                   # Electron renderer process
```

### Middleware Settings
- Credentials: Allowed
- Methods: All (*
- Headers: All (*)

---

## API Endpoints (8 Total)

### Health/Status Endpoints
**GET /** - Root health check
- Returns: `{status, message, version, endpoints[]}`
- Purpose: List all available endpoints

**GET /status** - Full application status
- Returns: Complete AppState dump
- Purpose: Get all current settings

### Authentication (1)
**POST /login** - User authentication
- Request: `{email: str, password: str}`
- Response: `{token: str, remaining_games: int, plan_id: int, email: str}`
- Logs: "❌ Login failed" or "✅ Login successful"

### Data Retrieval (1)
**GET /get_local_data** - Dashboard refresh data
- Returns: `{remaining_games, first_launch, game_timer}`
- Called by frontend every 5 seconds
- No request body required

### Configuration Toggles (3)
**PUT /coach_toggle** - Toggle main coach
- Request: `{active: bool}`
- Returns: `{success: bool, active: bool}`
- Log emoji: 🎤

**PUT /assistant_toggle** - Toggle assistant
- Request: `{active: bool}`
- Returns: `{success: bool, active: bool}`
- Log emoji: 🤖

**PUT /mock_proactive_coach_toggle** - Toggle proactive mode
- Request: `{active: bool}`
- Note: Always TOGGLES (ignores request value, flips current state)
- Returns: `{success: bool, active: bool}`
- Log emoji: 🎯

### Configuration Updates (2)
**PUT /update_ptt_key** - Update Push-to-Talk key
- Request: `{ptt_key: str}`
- Validation: Cannot be empty
- Returns: `{success: bool, ptt_key: str}`
- Log emoji: 🎙️

**PUT /update_volume** - Update volume level
- Request: `{volume: int}` (0-100)
- Validation: 0 <= volume <= 100
- Returns: `{success: bool, volume: int}`
- Log emoji: 🔊

### Plan Management (1)
**POST /mock_select_plan** - Change pricing plan
- Request: `{plan_id: int}` (1, 2, or 3)
- Plan definitions:
  - 1: "Starter" → 10 games
  - 2: "Try-Hard" → 50 games
  - 3: "Rush" → 999999 games (unlimited)
- Returns: `{success: bool, plan_id: int, plan_name: str, remaining_games: int}`
- Log emoji: 📦
- Updates: `app_state.remaining_games` based on plan

### Support/Utility (2)
**POST /mock_contact_support** - Submit support request
- Request: `{subject: str = "Support Request", message: str = ""}`
- Returns: `{success: bool, ticket_id: str, message: str}`
- ticket_id format: "AMOKK-{6-char-hex}"
- Log emoji: 📧

**POST /reset** - Reset state to defaults (testing utility)
- No request body
- Returns: `{message: str, state: {...}}`
- Log emoji: 🔄

---

## Error Handling

### HTTP Exceptions
- **401**: Invalid login credentials
- **400**: Invalid input (empty PTT key, volume out of range, invalid plan_id)
- **500**: General server errors

### Logging Pattern
- ✅ Success events (login, state loaded)
- ❌ Errors (login failed, save failed, exceptions)
- ⚠️ Warnings (state load fallback)
- 💾 State save confirmation
- Emoji prefixes for visual scanning

### Log Format
```
[HH:MM:SS] emoji Message content
```
Example: `[14:23:45] ✅ Login successful: admin@amokk.fr`

---

## Request/Response Models (Pydantic)

| Model | Fields | Purpose |
|-------|--------|---------|
| CoachToggleRequest | active: bool | Coach on/off |
| AssistantToggleRequest | active: bool | Assistant on/off |
| PTTKeyRequest | ptt_key: str | PTT key update |
| VolumeRequest | volume: int | Volume level (0-100) |
| PlanSelectionRequest | plan_id: int | Plan ID (1-3) |
| ContactSupportRequest | subject: str, message: str | Support ticket |
| LoginRequest | email: str, password: str | Login |
| LoginResponse | token: str, remaining_games: int, plan_id: int, email: str | Login response |
| LocalDataResponse | remaining_games: int, first_launch: bool, game_timer: int | Dashboard data |

---

## Startup/Shutdown Events

### Startup (@app.on_event("startup"))
```
========================
🚀 AMOKK Mock Backend Starting
========================
✅ Server running on http://127.0.0.1:8000
📚 Docs: http://127.0.0.1:8000/docs
========================
```

### Shutdown (@app.on_event("shutdown"))
```
========================
🛑 AMOKK Mock Backend Shutting Down
========================
```

---

## Integration Points

### Frontend Integration
- Base URL: `http://127.0.0.1:8000`
- Docs/Swagger: `http://127.0.0.1:8000/docs`
- All requests should include token (mock JWT from login)
- Frontend polls `/get_local_data` every 5 seconds

### File System
- State file: `backend/state.json` (created on first run)
- Virtual env: `backend/venv/` (ignored in .gitignore)

### Environment
- Host: `127.0.0.1` (localhost only)
- Port: `8000` (hardcoded)
- Uvicorn: log_level="warning", reload=False

---

## Key Design Decisions

1. **No database**: In-memory state + JSON file (suitable for mock)
2. **Mock authentication**: No JWT validation, just token generation
3. **CORS open**: Allows all methods/headers (dev convenience)
4. **Proactive coach toggle BUG**: Endpoint ignores request.active, always flips current state
5. **Single file**: Everything in main.py (no modular structure needed for mock)
6. **Emoji logging**: Visual scanning of logs during development
7. **Persistent state**: JSON file survives app restarts
8. **No database models**: Pydantic validates all inputs

---

## Common Tasks

### Read Current State
```bash
curl http://127.0.0.1:8000/status
```

### Login
```bash
curl -X POST http://127.0.0.1:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@amokk.fr","password":"admin"}'
```

### Toggle Coach
```bash
curl -X PUT http://127.0.0.1:8000/coach_toggle \
  -H "Content-Type: application/json" \
  -d '{"active":false}'
```

### Update Volume
```bash
curl -X PUT http://127.0.0.1:8000/update_volume \
  -H "Content-Type: application/json" \
  -d '{"volume":50}'
```

### Reset State
```bash
curl -X POST http://127.0.0.1:8000/reset
```

---

## Files in Backend Directory

| File | Purpose |
|------|---------|
| main.py | Main FastAPI application |
| requirements.txt | Python dependencies |
| .env.example | Configuration template |
| state.json | Persistent application state |
| run.sh / run.bat | Shell/batch startup scripts |
| test_api.py | API test file |
| postman_collection.json | Postman API collection |
| build-exe.py | PyInstaller build script |
| AMOKK-Backend.spec | PyInstaller spec file |
| .gitignore | Git ignore rules |

---

## Known Issues

1. **Proactive Coach Toggle**: Endpoint ignores the `active` field and always toggles the current state (toggle behavior, not set behavior)
2. **Mock Authentication**: No real JWT validation, credentials hardcoded
3. **No data validation**: game_timer never updated by API (only in state file)

---

## Version Info
- **Created**: FastAPI 0.104.1
- **Last Updated**: See git history
- **Python Version**: 3.12+ required
