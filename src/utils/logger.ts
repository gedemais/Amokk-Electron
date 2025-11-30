/**
 * Logger utility for dev/prod modes
 * In dev: verbose logs
 * In prod: minimal, professional logs
 */

const isDev = import.meta.env.DEV;

export const logger = {
  debug: (label: string, data?: any) => {
    if (isDev) {
      console.log(`🔍 [DEBUG] ${label}`, data || '');
    }
  },

  info: (label: string, data?: any) => {
    if (isDev) {
      console.log(`ℹ️  [INFO] ${label}`, data || '');
    } else {
      console.log(`${label}`);
    }
  },

  success: (label: string, data?: any) => {
    if (isDev) {
      console.log(`✅ [SUCCESS] ${label}`, data || '');
    } else {
      console.log(`✓ ${label}`);
    }
  },

  error: (label: string, error?: any) => {
    if (isDev) {
      console.error(`❌ [ERROR] ${label}`, error || '');
    } else {
      console.error(`✗ ${label}`);
    }
  },

  warn: (label: string, data?: any) => {
    if (isDev) {
      console.warn(`⚠️  [WARN] ${label}`, data || '');
    }
  },

  api: (method: string, endpoint: string, data?: any) => {
    if (isDev) {
      console.log(`📡 [API] ${method} ${endpoint}`, data || '');
    }
  },

  apiResponse: (endpoint: string, status: number, data?: any) => {
    if (isDev) {
      console.log(`📡 [RESPONSE] ${endpoint} (${status})`, data || '');
    }
  },
};
