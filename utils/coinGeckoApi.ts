// utils/coinGeckoApi.ts

import {
  COINGECKO_COINS_MARKETS_ENDPOINT,
  CoinGeckoMarketData,
  CryptoMarketSnapshot,
  MARKET_DATA_ORDER,
  MARKET_DATA_PAGES_TO_FETCH,
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
 * Fetches a single page of crypto market data from CoinGecko API.
 * @param currency - The currency to fetch prices in
 * @param page - The page number to fetch (1-indexed)
 * @param retryCount - Number of retries attempted (for rate limiting)
 * @returns The market data array for that page
 * @throws {Error} if the API call fails after retries
 */
async function fetchCryptoMarketPage(
  currency: SupportedCurrency,
  page: number,
  retryCount: number = 0
): Promise<CoinGeckoMarketData[]> {
  const url = new URL(COINGECKO_COINS_MARKETS_ENDPOINT);
  url.searchParams.append('vs_currency', currency);
  url.searchParams.append('order', MARKET_DATA_ORDER);
  url.searchParams.append('per_page', MARKET_DATA_PER_PAGE.toString());
  url.searchParams.append('page', page.toString());
  url.searchParams.append('sparkline', MARKET_DATA_SPARKLINE.toString());

  const response = await fetch(url.toString());

  // Handle rate limiting (HTTP 429)
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default to 60 seconds
    
    if (retryCount < 3) {
      console.warn(`⚠️ Rate limited on page ${page}. Waiting ${waitTime / 1000} seconds before retry ${retryCount + 1}/3...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchCryptoMarketPage(currency, page, retryCount + 1);
    } else {
      throw new Error(`❌ CoinGecko API rate limit exceeded after 3 retries for page ${page}`);
    }
  }

  if (!response.ok) {
    throw new Error(`❌ CoinGecko API returned status ${response.status} for page ${page}`);
  }

  const data: CoinGeckoMarketData[] = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(`❌ CoinGecko API response was malformed for page ${page}`);
  }

  return data;
}

/**
 * 2. Fetches fresh crypto market data from CoinGecko API (multiple pages) and persists it to AsyncStorage.
 * @param currency - The currency to fetch prices in
 * @throws {Error} if the API call fails
 */
export async function fetchAndPersistCryptoMarket(
  currency: SupportedCurrency
): Promise<CryptoMarketSnapshot> {
  console.log(`⚡ Fetching crypto market data from CoinGecko for currency: ${currency} (${MARKET_DATA_PAGES_TO_FETCH} pages)...`);

  try {
    const allData: CoinGeckoMarketData[] = [];

    // Fetch pages sequentially to avoid rate limiting
    for (let page = 1; page <= MARKET_DATA_PAGES_TO_FETCH; page++) {
      console.log(`📄 Fetching page ${page}/${MARKET_DATA_PAGES_TO_FETCH}...`);
      
      try {
        const pageData = await fetchCryptoMarketPage(currency, page);
        
        if (pageData.length === 0) {
          console.log(`⚠️ Page ${page} returned no data. Stopping pagination.`);
          break; // No more data available
        }
        
        allData.push(...pageData);
        console.log(`✅ Page ${page} fetched: ${pageData.length} coins (total: ${allData.length})`);
        
        // Small delay between pages to be respectful of rate limits
        if (page < MARKET_DATA_PAGES_TO_FETCH) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between pages
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error);
        // If we have some data, continue with what we have
        if (allData.length > 0) {
          console.warn(`⚠️ Continuing with partial data (${allData.length} coins from ${page - 1} pages)`);
          break;
        }
        // If first page fails, throw the error
        throw error;
      }
    }

    if (allData.length === 0) {
      throw new Error('❌ CoinGecko API returned no data for any page.');
    }

    const newSnapshot: CryptoMarketSnapshot = {
      data: allData,
      timestamp: Date.now(),
      currency,
    };

    // 💡 Using setJSONObject to handle JSON stringification and storage
    await setJSONObject(CRYPTO_MARKET_CACHE_KEY, newSnapshot);
    console.log(`✅ Successfully fetched and persisted crypto market data (${allData.length} coins from ${MARKET_DATA_PAGES_TO_FETCH} pages).`);

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