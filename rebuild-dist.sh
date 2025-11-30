#!/bin/bash
# Quick rebuild script for npm run dist:linux

set -e

echo "🔨 Building AMOKK for Linux..."
echo "=================================="

echo "1. Compiling TypeScript..."
npm run tsc

echo ""
echo "2. Building backend with PyInstaller..."
npm run backend:pyinstaller

echo ""
echo "3. Building with electron-builder..."
npm run dist:linux

echo ""
echo "=================================="
echo "✅ Build complete!"
echo ""
echo "Test the AppImage:"
echo "  ./release/AMOKK-1.0.0.AppImage"
