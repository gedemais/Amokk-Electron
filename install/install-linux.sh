#!/bin/bash

# Install AMOKK on Linux
# This script automates the process of building the Linux AppImage
# Usage: ./install-linux.sh /path/to/destination
#
# Steps:
# 1. Builds the frontend with Vite
# 2. Compiles TypeScript for Electron main process
# 3. Creates the backend executable with PyInstaller
# 4. Packages everything with Electron Builder for Linux
# 5. Cleans the destination folder
# 6. Copies AMOKK-1.0.0.AppImage to destination
# 7. Makes AppImage executable
# 8. Ready for distribution

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
Usage: ./install-linux.sh <destination_path>

Description:
  Builds AMOKK Linux AppImage executable for distribution.
  Requires destination path as argument (mandatory).

Steps performed:
  1. Build frontend with Vite
  2. Compile Electron main process TypeScript
  3. Create backend executable with PyInstaller
  4. Package with Electron Builder for Linux (AppImage)
  5. Clean previous artifacts from destination
  6. Copy AMOKK-1.0.0.AppImage to destination
  7. Make AppImage executable
  8. Verify AppImage integrity

Example:
  ./install-linux.sh ~/Downloads

Result:
  Destination will contain:
    - AMOKK-1.0.0.AppImage          (Portable Linux executable)

Next: Distribute AppImage to users or test locally
  chmod +x AMOKK-1.0.0.AppImage
  ./AMOKK-1.0.0.AppImage
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

echo "Building Linux installation files..."
echo "Destination: $DEST"
echo ""

# Setup backend Python virtual environment
echo "Setting up Python virtual environment..."
if [ ! -d "backend/venv" ]; then
    echo "  Creating venv..."
    python3 -m venv backend/venv
fi

# Activate venv and install dependencies
echo "  Activating venv and installing dependencies..."
source backend/venv/bin/activate
pip install -r backend/requirements.txt -q

echo ""

# Step 1-4: Build with npm
echo "Step 1-4: Building application (venv active)..."
npm run dist:linux

# Deactivate venv after build
deactivate

# Step 5: Clean destination
echo "Step 5: Cleaning destination..."
rm -f "$DEST/AMOKK-"*.AppImage 2>/dev/null

# Step 6: Copy AppImage
echo "Step 6: Copying AppImage..."
if [ -f "release/AMOKK-1.0.0.AppImage" ]; then
    cp release/AMOKK-1.0.0.AppImage "$DEST/"
    echo "  Copied: AMOKK-1.0.0.AppImage"
else
    echo "Error: AMOKK-1.0.0.AppImage not found"
    cleanup_exit 1
fi

# Step 7: Make executable
echo "Step 7: Making AppImage executable..."
chmod +x "$DEST/AMOKK-1.0.0.AppImage"
echo "  Permissions updated"

# Step 8: Verify
echo "Step 8: Verifying files..."
echo ""
APPIMAGE_PATH="$DEST/AMOKK-1.0.0.AppImage"
if [ -x "$APPIMAGE_PATH" ]; then
    echo "Files ready at: $DEST"
    ls -lh "$APPIMAGE_PATH"
    echo ""
    echo "Ready for distribution or testing"
    echo "Test: $APPIMAGE_PATH"
    echo ""
    cleanup_exit 0
else
    echo "Error: AppImage not executable"
    cleanup_exit 1
fi
