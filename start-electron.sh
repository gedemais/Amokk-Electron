#!/bin/bash

# AMOKK Electron App - Development Launcher
# Builds frontend and starts Electron with backend

set -e

echo "=========================================="
echo "🚀 AMOKK Electron Development Launcher"
echo "=========================================="
echo ""

# Build React frontend
echo "🔨 Building React frontend..."
npm run build

# Compile Electron main process
echo "📦 Compiling Electron main process..."
npx tsc -p tsconfig.electron.json

# Start Electron
echo "🎬 Starting Electron app..."
npx electron .

echo ""
echo "=========================================="
echo "✅ Done"
echo "=========================================="
