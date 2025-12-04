#!/usr/bin/env python3
"""
Build standalone executable of AMOKK backend using PyInstaller
This creates a single .exe (Windows) or binary (Mac/Linux) that includes:
- Python runtime
- FastAPI
- Uvicorn
- All dependencies

Usage:
    pip install pyinstaller
    python backend/build-exe.py

Output:
    backend/dist/main.exe (Windows)
    backend/dist/main (Linux/Mac)
"""

import subprocess
import sys
import os
from pathlib import Path

def build_executable():
    backend_dir = Path(__file__).parent
    project_root = backend_dir.parent

    print("\n" + "="*60)
    print("🔨 Building Backend Executable with PyInstaller")
    print("="*60 + "\n")

    # Check if PyInstaller is installed, auto-install if missing
    try:
        import PyInstaller
        print(f"✅ PyInstaller found: {PyInstaller.__file__}")
    except ImportError:
        print("⏳ PyInstaller not found, installing...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'pyinstaller', '-q'], check=True)
            print("✅ PyInstaller installed successfully\n")
        except subprocess.CalledProcessError:
            print("❌ Failed to install PyInstaller!")
            print("   Install it manually with: pip install pyinstaller\n")
            return False

    # Build command
    cmd = [
        'pyinstaller',
        '--onefile',                    # Single executable
        '--hidden-import=fastapi',      # Include FastAPI
        '--hidden-import=uvicorn',      # Include Uvicorn
        '--hidden-import=pydantic',     # Include Pydantic
        '--hidden-import=python_multipart',
        '--name', 'AMOKK-Backend',      # Executable name
        '--distpath', str(backend_dir / 'dist'),
        '--workpath', str(backend_dir / 'build'),
        '--specpath', str(backend_dir),
        str(backend_dir / 'main.py'),   # Input file
    ]

    print(f"Running: {' '.join(cmd)}\n")

    try:
        result = subprocess.run(cmd, check=True)

        # Rename AMOKK-Backend to AMOKK-Backend.exe for Windows compatibility
        # (even when compiled on Linux/Mac for Windows target)
        exe_no_ext = backend_dir / 'dist' / 'AMOKK-Backend'
        exe_with_ext = backend_dir / 'dist' / 'AMOKK-Backend.exe'

        if exe_no_ext.exists():
            if exe_with_ext.exists():
                exe_no_ext.unlink()  # Remove the non-exe version
            else:
                print("\n[RENAME] Adding .exe extension for Windows compatibility...")
                exe_no_ext.rename(exe_with_ext)
                print(f"[RENAME] ✓ Renamed to: {exe_with_ext.name}")

        exe = exe_with_ext

        print("\n" + "="*60)
        print("✅ Build successful!")
        print("="*60)
        print(f"\nExecutable location:")
        print(f"  {exe}\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Build failed: {e}\n")
        return False

if __name__ == '__main__':
    success = build_executable()
    sys.exit(0 if success else 1)
