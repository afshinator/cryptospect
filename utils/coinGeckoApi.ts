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

// --- Constants ---
const DELAY_BETWEEN_PAGES_MS = 1200; // 1.2 seconds between requests (safer for free tier)
const DELAY_AFTER_EVERY_N_PAGES_MS = 10000; // 10 seconds delay after every N pages
const PAGES_BEFORE_LONG_DELAY = 3; // Number of pages to fetch before applying longer delay
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 60000; // 60 seconds base retry delay

/**
 * Logs rate limit information from response headers
 */
function logRateLimitInfo(response: Response, page: number): void {
  const limit = response.headers.get('x-ratelimit-limit');
  const remaining = response.headers.get('x-ratelimit-remaining');
  const retryAfter = response.headers.get('retry-after');
  
  // Check if any rate limit info is available
  if (limit || remaining || retryAfter) {
    console.log(`📊 Rate Limit Info (Page ${page}):`);
    
    if (limit) {
      console.log(`   Limit: ${limit}`);
    }
    
    if (remaining) {
      console.log(`   Remaining: ${remaining}`);
    }
    
    if (retryAfter) {
      console.log(`   ⚠️ Retry-After: ${retryAfter} seconds`);
    }
    
    // Warn if getting close to limit
    if (remaining && limit) {
      const remainingNum = parseInt(remaining);
      const limitNum = parseInt(limit);
      const percentRemaining = (remainingNum / limitNum) * 100;
      
      if (percentRemaining < 20) {
        console.warn(`   ⚠️ WARNING: Only ${percentRemaining.toFixed(0)}% of rate limit remaining!`);
      }
    }
  } else {
    console.log(`📊 Rate Limit Info (Page ${page}): No rate-limiting info received from API`);
  }
}

/**
 * 1. Loads the cached crypto market data from AsyncStorage.
 */
export async function loadCachedCryptoMarket(): Promise<CryptoMarketSnapshot | null> {
  try {
    const data = await getJSONObject<CryptoMarketSnapshot>(CRYPTO_MARKET_CACHE_KEY);
    return data;
  } catch (e) {
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

  // Log rate limit info for all responses
  logRateLimitInfo(response, page);

  // Handle rate limiting (HTTP 429)
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : BASE_RETRY_DELAY_MS;
    
    if (retryCount < MAX_RETRIES) {
      console.warn(`⚠️ Rate limited on page ${page}. Waiting ${waitTime / 1000} seconds before retry ${retryCount + 1}/${MAX_RETRIES}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchCryptoMarketPage(currency, page, retryCount + 1);
    } else {
      throw new Error(`❌ CoinGecko API rate limit exceeded after ${MAX_RETRIES} retries for page ${page}`);
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
 * Preserves old data until new data is complete and validated.
 * @param currency - The currency to fetch prices in
 * @throws {Error} if the API call fails
 */
export async function fetchAndPersistCryptoMarket(
  currency: SupportedCurrency
): Promise<CryptoMarketSnapshot> {
  console.log(`⚡ Fetching crypto market data from CoinGecko for currency: ${currency} (${MARKET_DATA_PAGES_TO_FETCH} pages)...`);
  console.log(`⏱️  Using ${DELAY_BETWEEN_PAGES_MS}ms delay between requests to respect rate limits`);

  // Load existing cached data to preserve it if new fetch fails or is incomplete
  const existingData = await loadCachedCryptoMarket();
  const existingCoinCount = existingData?.data?.length || 0;
  
  if (existingData) {
    console.log(`💾 Preserving existing cache (${existingCoinCount} coins) until new data is validated...`);
  }

  try {
    const allData: CoinGeckoMarketData[] = [];
    let pagesFetched = 0;
    let fetchFailed = false;

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
        pagesFetched++;
        console.log(`✅ Page ${page} fetched: ${pageData.length} coins (total: ${allData.length})`);
        
        // Delay between pages to respect rate limits
        if (page < MARKET_DATA_PAGES_TO_FETCH) {
          // After every N pages, use a longer delay
          if (pagesFetched % PAGES_BEFORE_LONG_DELAY === 0) {
            console.log(`⏸️  Fetched ${PAGES_BEFORE_LONG_DELAY} pages. Waiting ${DELAY_AFTER_EVERY_N_PAGES_MS}ms before next page...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_AFTER_EVERY_N_PAGES_MS));
          } else {
            console.log(`⏸️  Waiting ${DELAY_BETWEEN_PAGES_MS}ms before next page...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PAGES_MS));
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching page ${page}:`, error);
        fetchFailed = true;
        
        // If we have some data, continue with what we have
        if (allData.length > 0) {
          console.warn(`⚠️ Continuing with partial data (${allData.length} coins from ${pagesFetched} pages)`);
          break;
        }
        // If first page fails, throw the error
        throw error;
      }
    }

    if (allData.length === 0) {
      throw new Error('❌ CoinGecko API returned no data for any page.');
    }

    // Validate new data: only persist if it's complete (all pages fetched) OR better than existing
    const isComplete = pagesFetched === MARKET_DATA_PAGES_TO_FETCH && !fetchFailed;
    const isBetterThanExisting = allData.length >= existingCoinCount;
    
    if (!isComplete && !isBetterThanExisting) {
      console.warn(`⚠️ New data is incomplete (${allData.length} coins from ${pagesFetched}/${MARKET_DATA_PAGES_TO_FETCH} pages) and has fewer coins than existing cache (${existingCoinCount}). Preserving existing data.`);
      if (existingData) {
        return existingData;
      }
      // If no existing data, use what we have (better than nothing)
      console.warn(`⚠️ No existing cache available. Using partial data (${allData.length} coins).`);
    }

    const newSnapshot: CryptoMarketSnapshot = {
      data: allData,
      timestamp: Date.now(),
      currency,
    };

    // Only persist if data is complete or better than existing
    if (isComplete || isBetterThanExisting) {
      await setJSONObject(CRYPTO_MARKET_CACHE_KEY, newSnapshot);
      console.log(`✅ Successfully fetched and persisted crypto market data (${allData.length} coins from ${pagesFetched} pages).`);
    } else {
      console.warn(`⚠️ Not persisting incomplete data. Existing cache preserved.`);
      if (existingData) {
        return existingData;
      }
    }

    return newSnapshot;
  } catch (e) {
    console.error('❌ Error fetching/persisting crypto market data:', e);
    
    // If we have existing data, preserve it and return it instead of throwing
    if (existingData) {
      console.warn(`💾 Fetch failed. Preserving existing cache (${existingCoinCount} coins) as fallback.`);
      return existingData;
    }
    
    // Only throw if there's no existing data to fall back to
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
    console.log(`💾 Using cached crypto market data (${cachedData.data?.length || 0} coins, still fresh, no refetch needed).`);
    return cachedData;
  }

  // Cache is missing, stale, or currency changed - attempt to fetch and persist new data
  console.log(`🔄 Cache ${!cachedData ? 'missing' : cachedData.currency !== currency ? 'currency mismatch' : 'stale'}. Fetching fresh data...`);
  
  try {
    const freshData = await fetchAndPersistCryptoMarket(currency);
    return freshData;
  } catch (error) {
    console.warn('❌ Failed to fetch fresh crypto market data. Falling back to stale cache if available.');
    if (cachedData) {
      console.log(`💾 Using stale cache (${cachedData.data?.length || 0} coins) as fallback`);
      // Return stale cache if fetching failed (graceful degradation)
      return cachedData;
    }
    // If no cache and fetch failed, re-throw the error
    throw error;
  }
}