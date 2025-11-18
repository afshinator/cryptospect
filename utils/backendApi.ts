// utils/backendApi.ts

import { BACKEND_API_KEY, BACKEND_BASE_URL } from '@/constants/backend';

export interface HistoricalDominanceSnapshot {
  date: number;
  btcDominance: number;
  ethDominance: number;
  othersDominance: number;
}

/**
 * Fetches historical dominance data (180 days) from your Vercel backend
 * Backend caches this data for 24 hours
 */
export async function fetchHistoricalDominance(): Promise<HistoricalDominanceSnapshot[]> {
  console.log('⚡ Fetching historical dominance from backend...');

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/dominance`, {
      headers: {
        'x-api-key': BACKEND_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API returned status ${response.status}`);
    }

    const data: HistoricalDominanceSnapshot[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Backend returned empty or invalid data');
    }

    console.log(`✅ Received ${data.length} historical dominance data points from backend`);
    return data;
  } catch (e) {
    console.error('❌ Error fetching from backend:', e);
    throw e;
  }
}