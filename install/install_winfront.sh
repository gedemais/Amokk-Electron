#!/bin/bash

# Install AMOKK Frontend-Only on Windows
# This script automates the process of building the Windows installer for frontend-only deployment
# Usage: ./install_winfront.sh /path/to/destination
#
# Frontend-only mode: The backend is NOT included in the build.
# The application will connect to a separately running backend on http://localhost:8000
# (configurable via VITE_BACKEND_HOST and VITE_BACKEND_PORT in .env)
#
# Steps:
# 1. Builds the frontend with Vite
# 2. Compiles TypeScript for Electron main process
# 3. Packages frontend-only with Electron Builder for Windows
# 4. Cleans the destination folder
# 5. Copies release-frontend/win-unpacked to destination
# 6. Copies inno-setup.iss to destination (modified for frontend)
# 7. Ready for manual Inno Setup compilation

INITIAL_DIR=""
PROJECT_ROOT=""

cleanup_exit() {
    local exit_code=${1:-0}

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
Usage: ./install_winfront.sh <destination_path>

Description:
  Builds and prepares AMOKK Frontend-Only Windows installation files for Inno Setup compilation.
  Requires destination path as argument (mandatory).

  IMPORTANT: This build does NOT include the backend.
  The backend must be deployed and running separately on http://localhost:8000
  (or configured via VITE_BACKEND_HOST and VITE_BACKEND_PORT in .env)

Steps performed:
  1. Build frontend with Vite
  2. Compile Electron main process TypeScript
  3. Package frontend-only with Electron Builder for Windows
  4. Clean previous artifacts from destination
  5. Copy win-unpacked folder (frontend only, no backend)
  6. Copy inno-setup.iss Inno Setup configuration
  7. Verify files are ready

Example:
  ./install_winfront.sh /mnt/c/Users/marca/Downloads

Result:
  Destination will contain:
    - release-frontend/win-unpacked/  (AMOKK-Frontend.exe with all DLLs)
    - inno-setup.iss                  (Inno Setup configuration)

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

echo "Building Windows Frontend-Only installation files..."
echo "Destination: $DEST"
echo ""
echo "NOTE: Backend is NOT included. Must be deployed separately."
echo ""

# Step 1-3: Build with npm (frontend-only)
echo "Step 1-3: Building frontend-only application..."
npm run dist:win_front || true
echo "Build complete (wine errors are normal on WSL2)"
echo ""

# Verify build succeeded
if [ ! -d "release-frontend/win-unpacked" ]; then
    echo "Error: Build failed - release-frontend/win-unpacked not found"
    echo "Check the build output above for errors"
    cleanup_exit 1
fi

echo "✓ Build verified: release-frontend/win-unpacked exists"
echo ""

# Step 4: Clean destination
echo "Step 4: Cleaning destination..."
rm -rf "$DEST/release-frontend" 2>/dev/null
rm -f "$DEST/inno-setup-frontend.iss" 2>/dev/null

# Step 5: Copy win-unpacked
echo "Step 5: Copying frontend executable files..."
if [ -d "release-frontend/win-unpacked" ]; then
    mkdir -p "$DEST/release-frontend"
    cp -r release-frontend/win-unpacked "$DEST/release-frontend/"
    echo "  Copied: release-frontend/win-unpacked"
else
    echo "Error: release-frontend/win-unpacked not found"
    cleanup_exit 1
fi

# Step 6: Copy Inno Setup script (create frontend-specific version)
echo "Step 6: Creating frontend-specific Inno Setup configuration..."
if [ -f "inno-setup.iss" ]; then
    # Modify inno-setup.iss for frontend-only build
    sed -e 's/AppName=AMOKK/AppName=AMOKK Frontend/' \
        -e 's/AMOKK-Installer/AMOKK-Frontend-Installer/' \
        -e 's|release\\win-unpacked|release-frontend\\win-unpacked|g' \
        -e 's|{userdesktop}\\AMOKK|{userdesktop}\\AMOKK Frontend|' \
        -e 's|{group}\\AMOKK|{group}\\AMOKK Frontend|' \
        inno-setup.iss > "$DEST/inno-setup-frontend.iss"
    echo "  Created: inno-setup-frontend.iss"
else
    echo "Warning: inno-setup.iss not found, skipping..."
fi

# Step 7: Verify
echo "Step 7: Verifying files..."
echo ""
echo "Files ready at: $DEST"
ls -lh "$DEST/inno-setup-frontend.iss" 2>/dev/null && echo "  OK: inno-setup-frontend.iss"
ls -lh "$DEST/release-frontend/win-unpacked/AMOKK-Frontend.exe" 2>/dev/null && echo "  OK: AMOKK-Frontend.exe"
echo ""
echo "IMPORTANT: This is a frontend-only build."
echo "The backend must be deployed and running separately on http://localhost:8000"
echo "Configure backend URL in .env with VITE_BACKEND_HOST and VITE_BACKEND_PORT"
echo ""
echo "Next: Compile with Inno Setup Compiler on Windows"
echo ""

# Cleanup and return to initial directory
cleanup_exit 0
