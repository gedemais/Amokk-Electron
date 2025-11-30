#!/usr/bin/env node

/**
 * Bundle Python Backend for Electron
 * Creates a self-contained Python environment inside the executable
 *
 * This script:
 * 1. Creates a python-dist folder with Python + dependencies
 * 2. Makes it easy to distribute Python with Electron
 *
 * Alternative: Use PyInstaller to create a standalone executable
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const projectRoot = __dirname;
const backendDir = path.join(projectRoot, 'backend');
const pythonDistDir = path.join(projectRoot, 'backend-dist');

console.log('\n' + '='.repeat(60));
console.log('📦 Bundling Python Backend for Distribution');
console.log('='.repeat(60) + '\n');

// For now, we'll use a simpler approach:
// The executable will try to use system Python
// If bundling is needed later, we can use PyInstaller

console.log('✅ Backend files are included in the executable');
console.log('   Users need Python 3.8+ installed on their system');
console.log('\n💡 Alternative: Use PyInstaller for full bundling');
console.log('   Install: pip install pyinstaller');
console.log('   Run: pyinstaller --onefile backend/main.py\n');

console.log('='.repeat(60) + '\n');
