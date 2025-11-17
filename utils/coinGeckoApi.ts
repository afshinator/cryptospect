// utils/coinGeckoApi.ts

import {
  COINGECKO_COINS_MARKETS_ENDPOINT,
  CoinGeckoMarketData,
  CryptoMarketSnapshot,
  MARKET_DATA_ORDER,
  MARKET_DATA_PER_PAGE,
  MARKET_DATA_SPARKLINE,
} from '@/constants/coinGecko';
import { SupportedCurrency } from '@/constants/currency';
import {
  CRYPTO_MARKET_CACHE_KEY,
  CRYPTO_MARKET_REFRESH_INTERVAL_MS,
} from '@/constants/misc';
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';

/**
 * 1. Loads the cached crypto market data from AsyncStorage.
 */
export async function loadCachedCryptoMarket(): Promise<CryptoMarketSnapshot | null> {
  try {
    // 💡 Using getJSONObject to handle retrieval and JSON parsing
    const data = await getJSONObject<CryptoMarketSnapshot>(CRYPTO_MARKET_CACHE_KEY);
    return data;
  } catch (e) {
    // getJSONObject already logs the error, just return null for graceful failure
    return null;
  }
}

/**
 * 2. Fetches fresh crypto market data from CoinGecko API and persists it to AsyncStorage.
 * @param currency - The currency to fetch prices in
 * @throws {Error} if the API call fails
 */
export async function fetchAndPersistCryptoMarket(
  currency: SupportedCurrency
): Promise<CryptoMarketSnapshot> {
  console.log(`⚡ Fetching crypto market data from CoinGecko for currency: ${currency}...`);

  try {
    const url = new URL(COINGECKO_COINS_MARKETS_ENDPOINT);
    url.searchParams.append('vs_currency', currency);
    url.searchParams.append('order', MARKET_DATA_ORDER);
    url.searchParams.append('per_page', MARKET_DATA_PER_PAGE.toString());
    url.searchParams.append('page', '1');
    url.searchParams.append('sparkline', MARKET_DATA_SPARKLINE.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`❌ CoinGecko API returned status ${response.status}`);
    }

    const data: CoinGeckoMarketData[] = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('❌ CoinGecko API response was empty or malformed.');
    }

    const newSnapshot: CryptoMarketSnapshot = {
      data,
      timestamp: Date.now(),
      currency,
    };

    // 💡 Using setJSONObject to handle JSON stringification and storage
    await setJSONObject(CRYPTO_MARKET_CACHE_KEY, newSnapshot);
    console.log('✅ Successfully fetched and persisted crypto market data.');

    return newSnapshot;
  } catch (e) {
    console.error('❌ Error fetching/persisting crypto market data:', e);
    throw e;
  }
}

/**
 * 3. The main query function that decides whether to use cache or re-fetch.
 * @param currency - The currency to fetch prices in
 */
export async function getCryptoMarket(
  currency: SupportedCurrency
): Promise<CryptoMarketSnapshot> {
  const cachedData = await loadCachedCryptoMarket();
  const now = Date.now();

  // Condition Check: Cache exists, is NOT STALE, AND matches the requested currency
  if (
    cachedData &&
    cachedData.currency === currency &&
    now - cachedData.timestamp < CRYPTO_MARKET_REFRESH_INTERVAL_MS
  ) {
    console.log('💾 Using cached crypto market data (still fresh, no refetch needed).');
    return cachedData;
  }

  // Cache is missing, stale, or currency changed - attempt to fetch and persist new data
  try {
    const freshData = await fetchAndPersistCryptoMarket(currency);
    return freshData;
  } catch (error) {
    console.warn('❌ Failed to fetch fresh crypto market data. Falling back to stale cache if available.');
    if (cachedData) {
      // Return stale cache if fetching failed (graceful degradation)
      return cachedData;
    }
    // If no cache and fetch failed, re-throw the error
    throw error;
  }
}