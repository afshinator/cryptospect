// utils/currencyApi.ts

import {
  DAILY_REFRESH_INTERVAL_MS,
  DEFAULT_CURRENCY,
  EXCHANGE_RATE_API_BASE_URL,
  ExchangeRateCache,
} from '@/constants/currency';
import { EXCHANGE_RATE_CACHE_KEY } from '@/constants/misc';

// --- REFACATOR: Import utility functions instead of AsyncStorage directly ---
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';

// --- TYPE DEFINITIONS for API Response ---
interface ExchangeRateApiResponse {
  result: 'success' | 'error';
  base: string;
  time_last_update_unix: number;
  rates: { [key: string]: number };
}

/**
 * 1. Loads the cached exchange rate data from AsyncStorage using the utility function.
 */
export async function loadCachedRates(): Promise<ExchangeRateCache | null> {
  try {
    // 💡 Using getJSONObject to handle retrieval and JSON parsing
    const data = await getJSONObject<ExchangeRateCache>(EXCHANGE_RATE_CACHE_KEY);
    return data;
  } catch (e) {
    // getJSONObject already logs the error, just return null for graceful failure
    return null; 
  }
}

/**
 * 2. Fetches fresh exchange rate data from the API and persists it to AsyncStorage.
 * @throws {Error} if the API call fails or returns an error.
 */
export async function fetchAndPersistRates(): Promise<ExchangeRateCache> {
  console.log('⚡ Fetching new exchange rates from API...');
  
  try {
    const response = await fetch(EXCHANGE_RATE_API_BASE_URL);

    if (!response.ok) {
      throw new Error(`❌ API returned status ${response.status}`);
    }

    const data: ExchangeRateApiResponse = await response.json();

    if (data.result !== 'success' || !data.rates) {
        throw new Error('❌ Exchange rate API response failed or was malformed.');
    }

    const newCache: ExchangeRateCache = {
      timestamp: Date.now(),
      rates: data.rates,
      base: data.base || DEFAULT_CURRENCY.toUpperCase(),
    };

    // 💡 Using setJSONObject to handle JSON stringification and storage
    await setJSONObject(EXCHANGE_RATE_CACHE_KEY, newCache);
    console.log('✅ Successfully fetched and persisted new rates.');

    return newCache;

  } catch (e) {
    console.error('❌ Error fetching/persisting fresh exchange rates:', e);
    throw e; 
  }
}

/**
 * 3. The main query function wrapper that decides whether to use cache or re-fetch.
 */
export async function getExchangeRates(): Promise<ExchangeRateCache> {
    const cachedRates = await loadCachedRates();
    const now = Date.now();

    // Condition Check: Cache exists AND is NOT STALE
    if (cachedRates && (now - cachedRates.timestamp < DAILY_REFRESH_INTERVAL_MS)) {
        console.log('💾 Using cached exchange rates (still fresh, no refetch needed).');
        return cachedRates;
    }
    
    // Cache is missing or stale, attempt to fetch and persist new data
    try {
        const freshRates = await fetchAndPersistRates();
        return freshRates;
    } catch (error) {
        console.warn('❌ Failed to fetch fresh rates. Falling back to stale cache if available.');
        if (cachedRates) {
            // Return stale cache if fetching failed (graceful degradation)
            return cachedRates;
        }
        // If no cache and fetch failed, re-throw the original error
        throw error;
    }
}
