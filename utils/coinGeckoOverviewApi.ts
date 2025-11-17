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
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';

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
 * @throws {Error} if the API call fails
 */
export async function fetchAndPersistCryptoOverview(): Promise<CryptoOverviewSnapshot> {
  console.log('⚡ Fetching crypto overview data from CoinGecko...');

  try {
    const response = await fetch(COINGECKO_GLOBAL_DATA_ENDPOINT);

    if (!response.ok) {
      throw new Error(`❌ CoinGecko Global API returned status ${response.status}`);
    }

    const data: CoinGeckoGlobalData = await response.json();

    if (!data.data || !data.data.market_cap_percentage) {
      throw new Error('❌ CoinGecko Global API response was empty or malformed.');
    }

    const newSnapshot: CryptoOverviewSnapshot = {
      data,
      timestamp: Date.now(),
    };

    // 💡 Using setJSONObject to handle JSON stringification and storage
    await setJSONObject(CRYPTO_OVERVIEW_CACHE_KEY, newSnapshot);
    console.log('✅ Successfully fetched and persisted crypto overview data.');

    return newSnapshot;
  } catch (e) {
    console.error('❌ Error fetching/persisting crypto overview data:', e);
    throw e;
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
    console.log('💾 Using cached crypto overview data (still fresh, no refetch needed).');
    return cachedData;
  }

  // Cache is missing or stale - attempt to fetch and persist new data
  try {
    const freshData = await fetchAndPersistCryptoOverview();
    return freshData;
  } catch (error) {
    console.warn('❌ Failed to fetch fresh crypto overview data. Falling back to stale cache if available.');
    if (cachedData) {
      // Return stale cache if fetching failed (graceful degradation)
      return cachedData;
    }
    // If no cache and fetch failed, re-throw the error
    throw error;
  }
}