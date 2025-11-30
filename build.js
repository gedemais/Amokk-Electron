#!/usr/bin/env node

/**
 * Build script for AMOKK Electron app
 * Compiles TypeScript, builds React app, and packages with electron-builder
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

function run(command, description) {
  console.log(`\n🔨 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} complete`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function build() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Building AMOKK Electron App');
  console.log('='.repeat(60));

  try {
    // 1. Ensure dist-electron directory exists
    const distElectronDir = path.join(__dirname, 'dist-electron');
    if (!fs.existsSync(distElectronDir)) {
      fs.mkdirSync(distElectronDir, { recursive: true });
    }

    // 2. Build React app
    run('npm run build', 'Building React frontend');

    // 3. Compile TypeScript (Electron main process)
    run('npx tsc -p tsconfig.electron.json', 'Compiling Electron main process');

    // 4. Package with electron-builder
    if (!isDev) {
      run('electron-builder', 'Building executable');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Build complete!');
    console.log('='.repeat(60) + '\n');

    if (!isDev) {
      console.log('📦 Executables created in ./release');
    }
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

build();
