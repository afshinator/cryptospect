// utils/coinGeckoOverviewApi.ts

import {
  COINGECKO_GLOBAL_DATA_ENDPOINT,
  CoinGeckoGlobalData,
  CryptoOverviewSnapshot,
} from '@/constants/coinGecko';
import {
  CRYPTO_OVERVIEW_CACHE_KEY,
  CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS,
} from '@/constants/misc';
import {
  OVERVIEW_DATA_MAX_RETRIES,
  OVERVIEW_DATA_BASE_RETRY_DELAY_MS,
} from '@/constants/apiConfig';
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';
import { logger } from '@/utils/logger';

/**
 * 1. Loads the cached crypto overview data from AsyncStorage.
 */
export async function loadCachedCryptoOverview(): Promise<CryptoOverviewSnapshot | null> {
  try {
    // 💡 Using getJSONObject to handle retrieval and JSON parsing
    const data = await getJSONObject<CryptoOverviewSnapshot>(CRYPTO_OVERVIEW_CACHE_KEY);
    return data;
  } catch (e) {
    // getJSONObject already logs the error, just return null for graceful failure
    return null;
  }
}

/**
 * 2. Fetches fresh crypto overview data from CoinGecko API and persists it to AsyncStorage.
 * Handles rate limits (429) gracefully by waiting and retrying.
 * @param retryCount - Number of retries attempted (for rate limiting)
 * @returns CryptoOverviewSnapshot or null if rate limited (allows graceful degradation)
 * @throws {Error} only for real errors (network failures, parsing errors, etc.)
 */
export async function fetchAndPersistCryptoOverview(
  retryCount: number = 0
): Promise<CryptoOverviewSnapshot | null> {
  logger(`⚡ [CoinGecko API] Fetching crypto overview data...`, 'log', 'debug');
  if (retryCount > 0) {
    logger(`   └─ Retry attempt ${retryCount}/${OVERVIEW_DATA_MAX_RETRIES}`, 'log', 'debug');
  }

  try {
    const response = await fetch(COINGECKO_GLOBAL_DATA_ENDPOINT);

    // Handle rate limiting (HTTP 429) - this is expected, not an error
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : OVERVIEW_DATA_BASE_RETRY_DELAY_MS;
      
      if (retryCount < OVERVIEW_DATA_MAX_RETRIES) {
        logger(`⚠️ [CoinGecko API] Rate limited on overview data. Waiting ${waitTime / 1000} seconds before retry ${retryCount + 1}/${OVERVIEW_DATA_MAX_RETRIES}...`, 'warn');
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Retry the fetch
        return fetchAndPersistCryptoOverview(retryCount + 1);
      } else {
        // Max retries reached - return null to allow graceful degradation
        logger(`⚠️ [CoinGecko API] Rate limit exceeded after ${OVERVIEW_DATA_MAX_RETRIES} retries for overview data. Will use stale cache.`, 'warn');
        return null;
      }
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      logger(`❌ [CoinGecko API] Overview data fetch failed:`, 'error');
      logger(`   └─ Status: ${response.status}`, 'error');
      logger(`   └─ Status Text: ${response.statusText}`, 'error');
      throw new Error(`CoinGecko Global API returned ${errorMessage}`);
    }

    // Parse response
    let data: CoinGeckoGlobalData;
    try {
      data = await response.json();
    } catch (parseError) {
      logger(`❌ [CoinGecko API] Failed to parse overview data response:`, 'error');
      logger(`   └─ Error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`, 'error');
      throw new Error(`Failed to parse CoinGecko Global API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Validate response structure
    if (!data.data || !data.data.market_cap_percentage) {
      logger(`❌ [CoinGecko API] Overview data response validation failed:`, 'error');
      logger(`   └─ Has data: ${!!data.data}`, 'error');
      logger(`   └─ Has market_cap_percentage: ${!!data.data?.market_cap_percentage}`, 'error');
      throw new Error('CoinGecko Global API response was empty or malformed');
    }

    const newSnapshot: CryptoOverviewSnapshot = {
      data,
      timestamp: Date.now(),
    };

    // Persist to storage
    try {
      await setJSONObject(CRYPTO_OVERVIEW_CACHE_KEY, newSnapshot);
      logger(`✅ [CoinGecko API] Successfully fetched and persisted overview data`, 'log', 'debug');
      return newSnapshot;
    } catch (storageError) {
      logger(`❌ [CoinGecko API] Failed to persist overview data to storage:`, 'error');
      logger(`   └─ Error: ${storageError instanceof Error ? storageError.message : 'Unknown storage error'}`, 'error');
      // Still return the snapshot even if storage fails - data is valid
      return newSnapshot;
    }
  } catch (e) {
    // Check if it's a network error (Failed to fetch)
    if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
      logger(`❌ [CoinGecko API] Network error fetching overview data:`, 'error');
      logger(`   └─ Error: ${e.message}`, 'error');
      logger(`   └─ This is a real network error - check internet connection`, 'error');
      throw new Error(`Network error: Failed to fetch crypto overview data. Check your internet connection.`);
    }
    
    // Check if it's already a formatted error (from our code above)
    if (e instanceof Error && (e.message.includes('HTTP') || e.message.includes('parse') || e.message.includes('malformed'))) {
      // Already formatted, just re-throw
      throw e;
    }
    
    // Generic error - format it
    logger(`❌ [CoinGecko API] Unexpected error fetching overview data:`, 'error');
    logger(`   └─ Error: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    logger(`   └─ Type: ${e instanceof Error ? e.constructor.name : typeof e}`, 'error');
    throw new Error(`Unexpected error fetching crypto overview data: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

/**
 * 3. The main query function that decides whether to use cache or re-fetch.
 */
export async function getCryptoOverview(): Promise<CryptoOverviewSnapshot> {
  const cachedData = await loadCachedCryptoOverview();
  const now = Date.now();

  // Condition Check: Cache exists and is NOT STALE
  if (
    cachedData &&
    now - cachedData.timestamp < CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS
  ) {
    logger('💾 Using cached crypto overview data (still fresh, no refetch needed).', 'log', 'debug');
    return cachedData;
  }

  // Cache is missing or stale - attempt to fetch and persist new data
  try {
    const freshData = await fetchAndPersistCryptoOverview();
    
    // If rate limited (returns null), use stale cache if available
    if (freshData === null) {
      if (cachedData) {
        logger(`⚠️ [CoinGecko API] Rate limited. Using stale overview cache (${cachedData ? 'available' : 'not available'})`, 'warn');
        return cachedData;
      }
      // No cache available and rate limited - throw error
      throw new Error('Rate limited and no cached overview data available');
    }
    
    return freshData;
  } catch (error) {
    // Real error occurred (network, parsing, validation, etc.)
    logger(`❌ [CoinGecko API] Failed to fetch fresh overview data:`, 'error');
    logger(`   └─ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    
    if (cachedData) {
      logger(`   └─ Falling back to stale cache (graceful degradation)`, 'warn');
      // Return stale cache if fetching failed (graceful degradation)
      return cachedData;
    }
    // If no cache and fetch failed, re-throw the error
    throw error;
  }
}