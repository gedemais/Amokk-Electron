"""
AMOKK Mock Backend - FastAPI Server
Provides local coaching data endpoints for the React frontend
Compliant with GUIDE.md and ANALYSE.md specifications
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
from pathlib import Path
import logging
import sys
from datetime import datetime

# ============================================================================
# Logging Configuration - Clean and readable logs
# ============================================================================

# Suppress FastAPI/Uvicorn verbose logs
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("fastapi").setLevel(logging.WARNING)

# Create custom logger for AMOKK
logger = logging.getLogger("amokk")
logger.setLevel(logging.INFO)

# Console handler with clean format
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter('[%(asctime)s] %(message)s', datefmt='%H:%M:%S')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# ============================================================================
# Pydantic Models (Request/Response schemas)
# ============================================================================

class CoachToggleRequest(BaseModel):
    active: bool


class AssistantToggleRequest(BaseModel):
    active: bool


class PTTKeyRequest(BaseModel):
    ptt_key: str


class VolumeRequest(BaseModel):
    volume: int  # 0-100


class PlanSelectionRequest(BaseModel):
    plan_id: int


class ContactSupportRequest(BaseModel):
    subject: str = "Support Request"
    message: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    remaining_games: int
    plan_id: int
    email: str


class LocalDataResponse(BaseModel):
    remaining_games: int
    first_launch: bool
    game_timer: int


# ============================================================================
# Authentication (Simple mock for development)
# ============================================================================

VALID_USERS = {
    "admin@amokk.fr": "admin",
}


def generate_mock_token(email: str) -> str:
    """Generate a mock JWT token for development"""
    import secrets
    return f"mock-jwt-token-{secrets.token_hex(16)}"


# ============================================================================
# Application State (In-memory storage for demo)
# ============================================================================

class AppState:
    """Mock application state - persisted to JSON file"""

    def __init__(self):
        self.state_file = Path(__file__).parent / "state.json"
        self.load_state()

    def load_state(self):
        """Load state from JSON file or create default"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                    self.remaining_games = data.get('remaining_games', 42)
                    self.first_launch = data.get('first_launch', True)
                    self.game_timer = data.get('game_timer', 0)
                    self.coach_active = data.get('coach_active', True)
                    self.assistant_active = data.get('assistant_active', True)
                    self.proactive_coach_active = data.get('proactive_coach_active', False)
                    self.ptt_key = data.get('ptt_key', 'v')
                    self.volume = data.get('volume', 80)
                    self.plan_id = data.get('plan_id', 1)
                    logger.info(f"✅ State loaded from {self.state_file}")
            except Exception as e:
                logger.warning(f"⚠️  Error loading state: {e}. Using defaults.")
                self._set_defaults()
        else:
            self._set_defaults()

    def _set_defaults(self):
        """Set default application state"""
        self.remaining_games = 42
        self.first_launch = True
        self.game_timer = 0
        self.coach_active = True
        self.assistant_active = True
        self.proactive_coach_active = False  # Disabled by default
        self.ptt_key = 'v'
        self.volume = 80
        self.plan_id = 1  # Default: Starter plan

    def save_state(self):
        """Save state to JSON file"""
        try:
            state_dict = {
                'remaining_games': self.remaining_games,
                'first_launch': self.first_launch,
                'game_timer': self.game_timer,
                'coach_active': self.coach_active,
                'assistant_active': self.assistant_active,
                'proactive_coach_active': self.proactive_coach_active,
                'ptt_key': self.ptt_key,
                'volume': self.volume,
                'plan_id': self.plan_id,
            }
            with open(self.state_file, 'w') as f:
                json.dump(state_dict, f, indent=2)
            logger.info(f"💾 State saved")
        except Exception as e:
            logger.error(f"❌ Error saving state: {e}")


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AMOKK Mock Backend",
    description="Local coaching API for AMOKK React frontend",
    version="1.0.0"
)

# Initialize app state
app_state = AppState()

# ============================================================================
# CORS Configuration - Allow frontend on port 8080 and Electron
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",      # Vite dev server
        "http://127.0.0.1:8080",
        "http://localhost:3000",       # Alternative dev port
        "http://127.0.0.1:3000",
        "http://localhost:5173",       # Vite default port
        "http://127.0.0.1:5173",
        "file://",                     # Electron renderer process
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", tags=["Health"])
def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "AMOKK Mock Backend is running",
        "version": "1.0.0",
        "endpoints": [
            "GET  /get_local_data",
            "PUT  /coach_toggle",
            "PUT  /assistant_toggle",
            "PUT  /mock_proactive_coach_toggle",
            "PUT  /update_ptt_key",
            "PUT  /update_volume",
            "POST /mock_select_plan",
            "POST /mock_contact_support",
            "POST /reset",
        ]
    }


# ============================================================================
# POST /login
# Authenticate user with email and password
# ============================================================================

@app.post("/login", response_model=LoginResponse, tags=["Auth"])
def login(request: LoginRequest):
    """
    Authenticate user with email and password

    Valid credentials for development:
    - email: admin@amokk.fr
    - password: admin

    Request:
        {
            "email": "admin@amokk.fr",
            "password": "admin"
        }

    Returns:
        {
            "token": "mock-jwt-token-...",
            "remaining_games": 42,
            "plan_id": 3,
            "email": "admin@amokk.fr"
        }
    """
    try:
        # Check if user exists and password is correct
        if request.email not in VALID_USERS or VALID_USERS[request.email] != request.password:
            logger.warning(f"❌ Login failed for {request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Generate token
        token = generate_mock_token(request.email)

        logger.info(f"✅ Login successful: {request.email}")

        return LoginResponse(
            token=token,
            remaining_games=app_state.remaining_games,
            plan_id=3,
            email=request.email
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# GET /get_local_data
# Retrieve current state for dashboard refresh (called every 5 seconds)
# ============================================================================

@app.get("/get_local_data", response_model=LocalDataResponse, tags=["Data"])
def get_local_data():
    """
    Retrieve all local data for dashboard refresh

    Called by frontend every 5 seconds to update:
    - remaining_games: Number of coaching sessions remaining
    - first_launch: Whether this is user's first launch
    - game_timer: Current in-game timer (seconds)

    Returns:
        {
            "remaining_games": 42,
            "first_launch": true,
            "game_timer": 0
        }
    """
    return LocalDataResponse(
        remaining_games=app_state.remaining_games,
        first_launch=app_state.first_launch,
        game_timer=app_state.game_timer,
    )


# ============================================================================
# PUT /coach_toggle
# Toggle the main coach on/off (or proactive coach)
# ============================================================================

@app.put("/coach_toggle", tags=["Config"])
def coach_toggle(request: CoachToggleRequest):
    """
    Toggle the main coach status on/off
    Also used for "Coach Proactif" toggle (same endpoint per GUIDE.md)

    Request:
        {
            "active": true
        }

    Returns:
        "Updated coach toggle to true successfully"
    """
    try:
        app_state.coach_active = request.active
        app_state.save_state()
        logger.info(f"🎤 Coach toggled: {request.active}")
        return {"success": True, "active": request.active}
    except Exception as e:
        logger.error(f"❌ Coach toggle error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PUT /assistant_toggle
# Toggle the assistant on/off
# ============================================================================

@app.put("/assistant_toggle", tags=["Config"])
def assistant_toggle(request: AssistantToggleRequest):
    """
    Toggle the assistant status on/off

    Request:
        {
            "active": false
        }

    Returns:
        "Updated assistant toggle to false successfully"
    """
    try:
        app_state.assistant_active = request.active
        app_state.save_state()
        logger.info(f"🤖 Assistant toggled: {request.active}")
        return {"success": True, "active": request.active}
    except Exception as e:
        logger.error(f"❌ Assistant toggle error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PUT /mock_proactive_coach_toggle
# Toggle the proactive coach mode
# ============================================================================

@app.put("/mock_proactive_coach_toggle", tags=["Config"])
def mock_proactive_coach_toggle(request: CoachToggleRequest):
    """
    Toggle the proactive coach mode on/off

    Request:
        {
            "active": true
        }

    Returns:
        {
            "success": true,
            "active": true/false (the new state after toggle)
        }
    """
    try:
        # Actually toggle the state instead of just setting it
        app_state.proactive_coach_active = not app_state.proactive_coach_active
        app_state.save_state()
        logger.info(f"🎯 Proactive coach toggled to: {app_state.proactive_coach_active}")
        return {"success": True, "active": app_state.proactive_coach_active}
    except Exception as e:
        logger.error(f"❌ Proactive coach toggle error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PUT /update_ptt_key
# Update Push-to-Talk key binding
# ============================================================================

@app.put("/update_ptt_key", tags=["Config"])
def update_ptt_key(request: PTTKeyRequest):
    """
    Update the Push-to-Talk key binding

    Request:
        {
            "ptt_key": "v"
        }

    Returns:
        "Updated push-to-talk key (v) successfully"
    """
    try:
        if not request.ptt_key or len(request.ptt_key) == 0:
            raise HTTPException(status_code=400, detail="PTT key cannot be empty")

        app_state.ptt_key = request.ptt_key
        app_state.save_state()
        logger.info(f"🎙️  PTT key updated: {request.ptt_key}")
        return {"success": True, "ptt_key": request.ptt_key}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ PTT key error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PUT /update_volume
# Update volume level
# ============================================================================

@app.put("/update_volume", tags=["Config"])
def update_volume(request: VolumeRequest):
    """
    Update the volume level

    Request:
        {
            "volume": 100
        }

    Returns:
        "Updated volume level to 100 successfully"
    """
    try:
        if not (0 <= request.volume <= 100):
            raise HTTPException(
                status_code=400,
                detail="Volume must be between 0 and 100"
            )

        app_state.volume = request.volume
        app_state.save_state()
        logger.info(f"🔊 Volume updated: {request.volume}%")
        return {"success": True, "volume": request.volume}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Volume error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# POST /mock_select_plan
# Mock endpoint: Select a pricing plan (Starter, Try-Hard, or Rush)
# ============================================================================

@app.post("/mock_select_plan", tags=["Config"])
def mock_select_plan(request: PlanSelectionRequest):
    """
    Select a pricing plan for the user

    Request:
        {
            "plan_id": 2
        }

    Plan IDs:
        1 = Starter (5.99€/month, 10 games)
        2 = Try-Hard (24.99€/month, 50 games)
        3 = Rush (89.99€/month, unlimited games)

    Returns:
        {
            "success": true,
            "plan_id": 2,
            "plan_name": "Try-Hard",
            "remaining_games": 50
        }
    """
    try:
        plan_names = {
            1: "Starter",
            2: "Try-Hard",
            3: "Rush"
        }
        plan_games = {
            1: 10,
            2: 50,
            3: 999999  # Unlimited (mock large number)
        }

        if request.plan_id not in plan_names:
            raise HTTPException(status_code=400, detail="Invalid plan_id. Must be 1, 2, or 3")

        plan_name = plan_names[request.plan_id]
        games_count = plan_games[request.plan_id]

        app_state.plan_id = request.plan_id
        app_state.remaining_games = games_count
        app_state.save_state()

        logger.info(f"📦 Plan selected: {plan_name} (ID: {request.plan_id})")
        return {
            "success": True,
            "plan_id": request.plan_id,
            "plan_name": plan_name,
            "remaining_games": games_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Plan selection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# POST /mock_contact_support
# Mock endpoint: Submit a support request
# ============================================================================

@app.post("/mock_contact_support", tags=["Config"])
def mock_contact_support(request: ContactSupportRequest):
    """
    Submit a support request (mock endpoint)

    Request:
        {
            "subject": "Problem with volume",
            "message": "The volume control is not working..."
        }

    Returns:
        {
            "success": true,
            "ticket_id": "AMOKK-12345",
            "message": "Your support request has been received"
        }
    """
    try:
        import secrets
        ticket_id = f"AMOKK-{secrets.token_hex(3).upper()}"

        logger.info(f"📧 Support request submitted - Ticket: {ticket_id}")
        return {
            "success": True,
            "ticket_id": ticket_id,
            "message": "Votre demande de support a été reçue. Nous vous répondrons dans les 24 heures.",
        }
    except Exception as e:
        logger.error(f"❌ Contact support error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# POST /reset (Utility for testing)
# Reset all state to defaults
# ============================================================================

@app.post("/reset", tags=["Utility"])
def reset_state():
    """
    Reset application state to defaults (useful for testing)

    Returns current state after reset
    """
    try:
        app_state._set_defaults()
        app_state.save_state()
        logger.info("🔄 State reset to defaults")
        return {
            "message": "State reset to defaults",
            "state": {
                "remaining_games": app_state.remaining_games,
                "first_launch": app_state.first_launch,
                "game_timer": app_state.game_timer,
                "coach_active": app_state.coach_active,
                "assistant_active": app_state.assistant_active,
                "ptt_key": app_state.ptt_key,
                "volume": app_state.volume,
            }
        }
    except Exception as e:
        logger.error(f"❌ Reset error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health/Status Endpoint
# ============================================================================

@app.get("/status", tags=["Health"])
def status():
    """Get full application status"""
    return {
        "status": "running",
        "state": {
            "remaining_games": app_state.remaining_games,
            "first_launch": app_state.first_launch,
            "game_timer": app_state.game_timer,
            "coach_active": app_state.coach_active,
            "assistant_active": app_state.assistant_active,
            "ptt_key": app_state.ptt_key,
            "volume": app_state.volume,
        }
    }


# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    logger.info("\n" + "="*60)
    logger.info("🚀 AMOKK Mock Backend Starting")
    logger.info("="*60)
    logger.info(f"✅ Server running on http://127.0.0.1:8000")
    logger.info(f"📚 Docs: http://127.0.0.1:8000/docs")
    logger.info("="*60)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("="*60)
    logger.info("🛑 AMOKK Mock Backend Shutting Down")
    logger.info("="*60)


if __name__ == "__main__":
    import uvicorn
    import os

    # Detect if running in development mode (from Electron)
    is_dev = os.environ.get("NODE_ENV") == "development"

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=False,  # Reload disabled for direct script execution (Electron)
        log_level="warning"
    )
    logger.info("✅ Backend stopped")
