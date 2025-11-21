// constants/backend.ts

import Constants from 'expo-constants';

/**
 * Get backend API key from environment variables
 * For Expo, use EXPO_PUBLIC_ prefix for client-side variables
 * Falls back to Constants.expoConfig.extra for native builds
 */
function getBackendApiKey(): string {
  // Try process.env first (works for web and when set via app.config.js)
  const envKey = process.env.EXPO_PUBLIC_BACKEND_API_KEY || process.env.BACKEND_API_KEY;
  if (envKey) {
    return envKey;
  }

  // Fallback to Constants.expoConfig.extra (for native builds)
  const extraKey = Constants.expoConfig?.extra?.backendApiKey;
  if (extraKey) {
    return extraKey;
  }

  // No fallback - require environment variable to be set
  throw new Error(
    'BACKEND_API_KEY is not set. Please create a .env file with EXPO_PUBLIC_BACKEND_API_KEY=your_key'
  );
}

/**
 * Get backend base URL from environment variables
 * For Expo, use EXPO_PUBLIC_ prefix for client-side variables
 * Falls back to Constants.expoConfig.extra for native builds
 */
function getBackendBaseUrl(): string {
  // Try process.env first (works for web and when set via app.config.js)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || process.env.BACKEND_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fallback to Constants.expoConfig.extra (for native builds)
  const extraUrl = Constants.expoConfig?.extra?.backendBaseUrl;
  if (extraUrl) {
    return extraUrl;
  }

  // No fallback - require environment variable to be set
  throw new Error(
    'BACKEND_BASE_URL is not set. Please create a .env file with EXPO_PUBLIC_BACKEND_BASE_URL=your_backend_url'
  );
}

export const BACKEND_BASE_URL = getBackendBaseUrl();
export const BACKEND_API_KEY = getBackendApiKey();  