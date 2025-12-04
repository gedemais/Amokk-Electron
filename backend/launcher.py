#!/usr/bin/env python3
"""
AMOKK Backend Launcher - Auto-installs dependencies and launches backend
"""
import subprocess
import sys
import os
from pathlib import Path

def install_dependencies():
    """Install required dependencies if needed"""
    backend_dir = Path(__file__).parent
    requirements_file = backend_dir / 'requirements.txt'

    print(f"[LAUNCHER] Backend directory: {backend_dir}")
    print(f"[LAUNCHER] Requirements file: {requirements_file}")

    if not requirements_file.exists():
        print(f"[LAUNCHER] ERROR: requirements.txt not found at {requirements_file}")
        return False

    print("[LAUNCHER] Installing dependencies...")
    try:
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file), '-q'],
            check=True
        )
        print("[LAUNCHER] ✓ Dependencies installed successfully")
        return True
    except Exception as e:
        print(f"[LAUNCHER] ERROR: Failed to install dependencies: {e}")
        return False

def launch_main():
    """Launch main.py using subprocess"""
    backend_dir = Path(__file__).parent
    main_py = backend_dir / 'main.py'

    print(f"[LAUNCHER] Attempting to launch main.py: {main_py}")

    if not main_py.exists():
        print(f"[LAUNCHER] ERROR: main.py not found at {main_py}")
        sys.exit(1)

    print("[LAUNCHER] ✓ main.py found, starting server...")
    print("[LAUNCHER] ==========================================")

    # Run main.py with current Python interpreter
    try:
        result = subprocess.run([sys.executable, str(main_py)], check=False)
        print(f"[LAUNCHER] Backend exited with code: {result.returncode}")
    except Exception as e:
        print(f"[LAUNCHER] ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    print("[LAUNCHER] Starting AMOKK Backend Launcher")
    print(f"[LAUNCHER] Python: {sys.executable}")
    print(f"[LAUNCHER] Working directory: {Path(__file__).parent}")

    # Ensure dependencies are installed
    install_dependencies()

    # Launch the backend
    launch_main()

    print("[LAUNCHER] Backend launcher exiting")
