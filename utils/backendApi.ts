// utils/backendApi.ts

import { BACKEND_API_KEY, BACKEND_BASE_URL } from '@/constants/backend';
import { logger } from '@/utils/logger';

// The interface is correct and includes usdtDominance
export interface HistoricalDominanceSnapshot {
  date: number;
  btcDominance: number;
  ethDominance: number;
  usdtDominance: number;
  othersDominance: number;
}

/**
 * Fetches historical dominance data (180 days) from your Vercel backend
 * Backend caches this data for 24 hours
 */
/**
 * Backend info response interface
 */
export interface BackendEndpoint {
  path: string;
  description: string;
  cache?: string;
  authentication?: string;
}

export interface BackendInfo {
  name?: string;
  version?: string;
  status?: string;
  health?: string;
  endpoints?: {
    [key: string]: BackendEndpoint;
  };
  diagnostics?: {
    environmentVariables?: {
      [key: string]: boolean;
    };
    cache?: {
      exists?: boolean;
      isStale?: boolean;
    };
  };
  timestamp?: string;
  [key: string]: any; // Allow for additional fields
}

/**
 * Fetches backend health and info from /api/info endpoint
 * Returns health status, available endpoints, and other backend metadata
 */
export async function fetchBackendHealthInfo(): Promise<BackendInfo | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/info`, {
      headers: {
        // 'x-api-key': BACKEND_API_KEY, // doesn't need the key, it'll fail with it.
      },
    });

    if (!response.ok) {
      logger(`⚠️ Backend /api/info returned status ${response.status}`, 'warn');
      return null;
    }

    const data: BackendInfo = await response.json();
    return data;
  } catch (e) {
    logger('⚠️ Error fetching backend info:', 'warn', undefined, e);
    return null;
  }
}

/**
 * Fetches historical dominance data (180 days) from your Vercel backend
 * Backend caches this data for 24 hours
 */
export async function fetchHistoricalDominance(): Promise<HistoricalDominanceSnapshot[]> {
  logger('⚡ Fetching historical dominance from backend...', 'log', 'debug');

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/dominance`, {
      headers: {
        'x-api-key': BACKEND_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API returned status ${response.status}`);
    }

    const rawData: any[] = await response.json();

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('❌ Backend returned empty or invalid data');
    }

    // --- CRITICAL DATA SANITIZATION / MAPPING STEP ---
    // This function ensures all dominance values are valid numbers, replacing NaN/null with 0.
    const sanitizedData: HistoricalDominanceSnapshot[] = rawData
      .map(item => {
        // Skip data points if the date is missing or invalid
        if (!item.date || isNaN(Number(item.date))) {
            return null;
        }
        
        // Helper function to force conversion to a number, defaulting to 0 if invalid (NaN, null, etc.)
        const sanitizeValue = (val: any): number => {
            const num = Number(val);
            // isFinite checks for NaN, Infinity, and normal numbers.
            return isFinite(num) ? num : 0; 
        }

        return {
          date: Number(item.date),
          btcDominance: sanitizeValue(item.btcDominance),
          ethDominance: sanitizeValue(item.ethDominance),
          usdtDominance: sanitizeValue(item.usdtDominance),
          othersDominance: sanitizeValue(item.othersDominance),
        };
      })
      .filter((item): item is HistoricalDominanceSnapshot => item !== null); // Filter out any points with invalid dates

    logger(`✅ Received and sanitized ${sanitizedData.length} historical dominance data points from backend`, 'log', 'debug');
    return sanitizedData;
  } catch (e) {
    logger('❌ Error fetching from backend:', 'error', undefined, e);
    throw e;
  }
}
 