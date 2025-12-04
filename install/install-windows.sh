#!/bin/bash

# Install AMOKK on Windows
# This script automates the process of building the Windows installer
# Usage: ./install-windows.sh /path/to/destination
#
# Steps:
# 1. Builds the frontend with Vite
# 2. Compiles TypeScript for Electron main process
# 3. Creates the backend executable with PyInstaller
# 4. Packages everything with Electron Builder for Windows
# 5. Cleans the destination folder
# 6. Copies release/win-unpacked to destination
# 7. Copies inno-setup.iss to destination
# 8. Ready for manual Inno Setup compilation

INITIAL_DIR=""
PROJECT_ROOT=""

cleanup_exit() {
    local exit_code=${1:-0}

    # Deactivate venv if active
    if [ -n "$VIRTUAL_ENV" ]; then
        deactivate 2>/dev/null || true
    fi

    # Return to initial directory
    if [ -n "$INITIAL_DIR" ] && [ -d "$INITIAL_DIR" ]; then
        cd "$INITIAL_DIR"
    fi

    if [ $exit_code -ne 0 ]; then
        echo "Build cancelled. Returned to: $(pwd)"
    fi

    exit $exit_code
}

# Setup trap to call cleanup on exit/interrupt
trap 'cleanup_exit 130' INT TERM

usage() {
    cat << EOF
Usage: ./install-windows.sh <destination_path>

Description:
  Builds and prepares AMOKK Windows installation files for Inno Setup compilation.
  Requires destination path as argument (mandatory).

Steps performed:
  1. Build frontend with Vite
  2. Compile Electron main process TypeScript
  3. Create backend executable with PyInstaller
  4. Package with Electron Builder for Windows
  5. Clean previous artifacts from destination
  6. Copy win-unpacked folder with all dependencies
  7. Copy inno-setup.iss Inno Setup configuration
  8. Verify files are ready

Example:
  ./install-windows.sh /mnt/c/Users/marca/Downloads

Result:
  Destination will contain:
    - release/win-unpacked/         (AMOKK.exe with all DLLs)
    - inno-setup.iss                (Inno Setup configuration)

Next: Use Inno Setup Compiler to compile inno-setup.iss
EOF
}

# Show usage if no argument or help requested
if [ -z "$1" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    usage
    if [ -z "$1" ]; then
        cleanup_exit 1
    else
        cleanup_exit 0
    fi
fi

DEST="$1"

# Save initial directory and change to project root
INITIAL_DIR="$(pwd)"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT" || cleanup_exit 1

# Verify destination exists
if [ ! -d "$DEST" ]; then
    echo "Error: Destination directory not found: $DEST"
    cleanup_exit 1
fi

echo "Building Windows installation files..."
echo "Destination: $DEST"
echo ""

# Setup backend Python virtual environment
echo "Setting up Python virtual environment..."
if [ ! -d "backend/venv" ]; then
    echo "  Creating venv..."
    python3 -m venv backend/venv || python -m venv backend/venv
fi

# Activate venv and install dependencies
echo "  Activating venv and installing dependencies..."
source backend/venv/bin/activate 2>/dev/null || . backend/venv/Scripts/activate 2>/dev/null
pip install -r backend/requirements.txt -q

echo ""

# Step 1-4: Build with npm
echo "Step 1-4: Building application (venv active)..."
npm run dist:win || true

# Deactivate venv after build
deactivate 2>/dev/null || true

# Step 5: Clean destination
echo "Step 5: Cleaning destination..."
rm -rf "$DEST/release" 2>/dev/null
rm -f "$DEST/inno-setup.iss" 2>/dev/null

# Step 6: Copy win-unpacked
echo "Step 6: Copying executable files..."
if [ -d "release/win-unpacked" ]; then
    mkdir -p "$DEST/release"
    cp -r release/win-unpacked "$DEST/release/"
    echo "  Copied: release/win-unpacked"
else
    echo "Error: release/win-unpacked not found"
    cleanup_exit 1
fi

# Step 7: Copy Inno Setup script
echo "Step 7: Copying Inno Setup configuration..."
if [ -f "inno-setup.iss" ]; then
    cp inno-setup.iss "$DEST/"
    echo "  Copied: inno-setup.iss"
else
    echo "Error: inno-setup.iss not found"
    cleanup_exit 1
fi

# Step 8: Verify
echo "Step 8: Verifying files..."
echo ""
echo "Files ready at: $DEST"
ls -lh "$DEST/inno-setup.iss" 2>/dev/null && echo "  OK: inno-setup.iss"
ls -lh "$DEST/release/win-unpacked/AMOKK.exe" 2>/dev/null && echo "  OK: AMOKK.exe"
echo ""
echo "Next: Compile with Inno Setup Compiler on Windows"
echo ""

# Cleanup and return to initial directory
cleanup_exit 0
