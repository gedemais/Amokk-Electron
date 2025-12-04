/**
 * Environment Variable Loader
 * Loads .env file and sets environment variables
 * Supports both development and production environments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find the .env file
function findEnvFile() {
  // Try multiple locations
  const locations = [
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '.env'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.env'),
  ];

  for (const location of locations) {
    if (fs.existsSync(location)) {
      return location;
    }
  }

  return null;
}

// Parse .env file
function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const env = {};

    for (const line of lines) {
      // Skip comments and empty lines
      if (!line || line.startsWith('#') || line.startsWith(';')) {
        continue;
      }

      // Parse key=value
      const [key, ...valueParts] = line.split('=');
      const trimmedKey = key.trim();
      let value = valueParts.join('=').trim();

      // Skip invalid entries
      if (!trimmedKey) {
        continue;
      }

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[trimmedKey] = value;
    }

    return env;
  } catch (error) {
    console.warn(`[ENV-LOADER] Failed to parse .env file: ${error.message}`);
    return {};
  }
}

// Load environment variables
function loadEnv() {
  const envFile = findEnvFile();

  if (!envFile) {
    console.log('[ENV-LOADER] No .env file found, using system environment variables');
    return;
  }

  console.log(`[ENV-LOADER] Loading environment from: ${envFile}`);

  const parsed = parseEnvFile(envFile);

  // Apply parsed variables to process.env
  // Only override if not already set (respect existing env vars)
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  console.log(`[ENV-LOADER] Loaded ${Object.keys(parsed).length} environment variables`);

  return parsed;
}

// Export
export default {
  loadEnv,
  findEnvFile,
  parseEnvFile,
};
