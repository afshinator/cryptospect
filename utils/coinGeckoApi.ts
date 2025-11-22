// utils/coinGeckoApi.ts

import {
  COINGECKO_COIN_BY_ID_BASE_ENDPOINT,
  COINGECKO_COINS_MARKETS_ENDPOINT,
  COINGECKO_SEARCH_ENDPOINT,
  CoinGeckoMarketData,
  CoinGeckoSearchResponse,
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
import {
  MARKET_DATA_DELAY_BETWEEN_PAGES_MS,
  MARKET_DATA_LONG_DELAY_MS,
  MARKET_DATA_PAGES_BEFORE_LONG_DELAY,
  MARKET_DATA_MAX_RETRIES,
  MARKET_DATA_BASE_RETRY_DELAY_MS,
} from '@/constants/apiConfig';
import { Platform } from 'react-native';
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';

// Use constants from apiConfig
const DELAY_BETWEEN_PAGES_MS = MARKET_DATA_DELAY_BETWEEN_PAGES_MS;
const DELAY_AFTER_EVERY_N_PAGES_MS = MARKET_DATA_LONG_DELAY_MS;
const PAGES_BEFORE_LONG_DELAY = MARKET_DATA_PAGES_BEFORE_LONG_DELAY;
const MAX_RETRIES = MARKET_DATA_MAX_RETRIES;
const BASE_RETRY_DELAY_MS = MARKET_DATA_BASE_RETRY_DELAY_MS;

/**
 * Logs rate limit information from response headers
 */
function logRateLimitInfo(response: Response, page: number): void {
  const limit = response.headers.get('x-ratelimit-limit');
  const remaining = response.headers.get('x-ratelimit-remaining');
  const retryAfter = response.headers.get('retry-after');
  
  // Check if any rate limit info is available
  if (limit || remaining || retryAfter) {
    console.log(`📊 [CoinGecko API] Rate Limit Info (Page ${page}):`);
    if (limit) console.log(`   └─ Limit: ${limit}`);
    if (remaining) console.log(`   └─ Remaining: ${remaining}`);
    if (retryAfter) console.log(`   └─ ⚠️ Retry-After: ${retryAfter} seconds`);
    
    // Warn if getting close to limit
    if (remaining && limit) {
      const remainingNum = parseInt(remaining);
      const limitNum = parseInt(limit);
      const percentRemaining = (remainingNum / limitNum) * 100;
      
      if (percentRemaining < 20) {
        console.warn(`   └─ ⚠️ WARNING: Only ${percentRemaining.toFixed(0)}% of rate limit remaining!`);
      }
    }
  } else {
    console.log(`📊 [CoinGecko API] Rate Limit Info (Page ${page}): No rate-limiting info received`);
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
  console.log(`⚡ [CoinGecko API] Starting market data fetch:`);
  console.log(`   └─ Currency: ${currency}`);
  console.log(`   └─ Pages to fetch: ${MARKET_DATA_PAGES_TO_FETCH}`);
  console.log(`   └─ Delay between pages: ${DELAY_BETWEEN_PAGES_MS}ms`);

  // Load existing cached data to preserve it if new fetch fails or is incomplete
  const existingData = await loadCachedCryptoMarket();
  const existingCoinCount = existingData?.data?.length || 0;
  
  if (existingData) {
    console.log(`💾 [CoinGecko API] Preserving existing cache (${existingCoinCount} coins) until new data is validated`);
  }

  try {
    const allData: CoinGeckoMarketData[] = [];
    let pagesFetched = 0;
    let fetchFailed = false;

    // Fetch pages sequentially to avoid rate limiting
    for (let page = 1; page <= MARKET_DATA_PAGES_TO_FETCH; page++) {
      console.log(`📄 [CoinGecko API] Fetching page ${page}/${MARKET_DATA_PAGES_TO_FETCH}...`);
      
      try {
        const pageData = await fetchCryptoMarketPage(currency, page);
        
        if (pageData.length === 0) {
          console.log(`   └─ ⚠️ Page ${page} returned no data. Stopping pagination.`);
          break; // No more data available
        }
        
        allData.push(...pageData);
        pagesFetched++;
        console.log(`   └─ ✅ Page ${page} fetched: ${pageData.length} coins (total: ${allData.length})`);
        
        // Delay between pages to respect rate limits
        if (page < MARKET_DATA_PAGES_TO_FETCH) {
          // After every N pages, use a longer delay
          if (pagesFetched % PAGES_BEFORE_LONG_DELAY === 0) {
            console.log(`   └─ ⏸️  Fetched ${PAGES_BEFORE_LONG_DELAY} pages. Waiting ${DELAY_AFTER_EVERY_N_PAGES_MS}ms before next page...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_AFTER_EVERY_N_PAGES_MS));
          } else {
            console.log(`   └─ ⏸️  Waiting ${DELAY_BETWEEN_PAGES_MS}ms before next page...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PAGES_MS));
          }
        }
      } catch (error) {
        console.error(`   └─ ❌ Error fetching page ${page}:`, error);
        fetchFailed = true;
        
        // If we have some data, continue with what we have
        if (allData.length > 0) {
          console.warn(`   └─ ⚠️ Continuing with partial data (${allData.length} coins from ${pagesFetched} pages)`);
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
      console.warn(`⚠️ [CoinGecko API] New data is incomplete:`);
      console.warn(`   └─ New data: ${allData.length} coins from ${pagesFetched}/${MARKET_DATA_PAGES_TO_FETCH} pages`);
      console.warn(`   └─ Existing cache: ${existingCoinCount} coins`);
      console.warn(`   └─ Preserving existing data.`);
      if (existingData) {
        return existingData;
      }
      // If no existing data, use what we have (better than nothing)
      console.warn(`   └─ ⚠️ No existing cache available. Using partial data (${allData.length} coins).`);
    }

    const newSnapshot: CryptoMarketSnapshot = {
      data: allData,
      timestamp: Date.now(),
      currency,
    };

    // Only persist if data is complete or better than existing
    if (isComplete || isBetterThanExisting) {
      await setJSONObject(CRYPTO_MARKET_CACHE_KEY, newSnapshot);
      console.log(`✅ [CoinGecko API] Successfully fetched and persisted market data:`);
      console.log(`   └─ Total coins: ${allData.length}`);
      console.log(`   └─ Pages fetched: ${pagesFetched}/${MARKET_DATA_PAGES_TO_FETCH}`);
    } else {
      console.warn(`⚠️ [CoinGecko API] Not persisting incomplete data. Existing cache preserved.`);
      if (existingData) {
        return existingData;
      }
    }

    return newSnapshot;
  } catch (e) {
    console.error('❌ [CoinGecko API] Error fetching/persisting market data:', e);
    
    // If we have existing data, preserve it and return it instead of throwing
    if (existingData) {
      console.warn(`   └─ 💾 Fetch failed. Preserving existing cache (${existingCoinCount} coins) as fallback.`);
      return existingData;
    }
    
    // Only throw if there's no existing data to fall back to
    throw e;
  }
}

/**
 * Fetches full market data for a specific coin using CoinGecko's /coins/{id} endpoint.
 * This endpoint provides comprehensive market data that the search endpoint doesn't include.
 * @param coinId - The CoinGecko coin ID (e.g., "bitcoin", "ethereum")
 * @param currency - The currency to fetch prices in (defaults to "usd")
 * @returns Full market data for the coin, mapped to CoinGeckoMarketData format
 * @throws {Error} if the API call fails
 */
export async function fetchCoinMarketData(
  coinId: string,
  currency: SupportedCurrency = "usd"
): Promise<CoinGeckoMarketData | null> {
  if (!coinId || !coinId.trim()) {
    return null;
  }

  const url = new URL(`${COINGECKO_COIN_BY_ID_BASE_ENDPOINT}/${coinId.trim()}`);
  // Optimize response: only get market_data, skip localization, tickers, community_data, developer_data
  url.searchParams.append('localization', 'false');
  url.searchParams.append('tickers', 'false');
  url.searchParams.append('market_data', 'true');
  url.searchParams.append('community_data', 'false');
  url.searchParams.append('developer_data', 'false');
  url.searchParams.append('sparkline', 'false');

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        console.warn(`⚠️ [CoinGecko API] Rate limit exceeded for ${coinId}:`);
        console.warn(`   └─ Retry after: ${retrySeconds} seconds`);
        // Return null instead of throwing - this allows the UI to continue showing partial data
        return null;
      }
      if (response.status === 404) {
        console.warn(`⚠️ [CoinGecko API] Coin not found: ${coinId}`);
        return null;
      }
      throw new Error(`❌ CoinGecko API returned status ${response.status} for coin ${coinId}`);
    }

    const data: any = await response.json();

    if (!data || !data.market_data) {
      console.warn(`⚠️ [CoinGecko API] No market data available for coin: ${coinId}`);
      console.warn(`   └─ Has data: ${!!data}`);
      console.warn(`   └─ Has market_data: ${!!data?.market_data}`);
      console.warn(`   └─ Data keys: ${data ? Object.keys(data).join(', ') : 'none'}`);
      return null;
    }

    const marketData = data.market_data;
    const currentPrice = marketData.current_price?.[currency] ?? null;
    const marketCap = marketData.market_cap?.[currency] ?? null;
    const totalVolume = marketData.total_volume?.[currency] ?? null;
    const high24h = marketData.high_24h?.[currency] ?? null;
    const low24h = marketData.low_24h?.[currency] ?? null;
    const priceChange24h = marketData.price_change_24h?.[currency] ?? null;
    let priceChangePercentage24h = marketData.price_change_percentage_24h?.[currency] ?? null;
    
    // Fallback: Calculate 24h percentage change from price_change_24h and current_price if not provided
    if (priceChangePercentage24h === null && priceChange24h !== null && currentPrice !== null && currentPrice !== 0) {
      // price_change_24h = current_price - price_24h_ago
      // So: price_24h_ago = current_price - price_change_24h
      const price24hAgo = currentPrice - priceChange24h;
      if (price24hAgo !== 0) {
        priceChangePercentage24h = (priceChange24h / price24hAgo) * 100;
        console.log(`📊 [CoinGecko API] Calculated 24h % change for ${coinId}:`);
        console.log(`   └─ Current price: ${currentPrice}`);
        console.log(`   └─ Price change 24h: ${priceChange24h}`);
        console.log(`   └─ Price 24h ago: ${price24hAgo}`);
        console.log(`   └─ Calculated %: ${priceChangePercentage24h.toFixed(2)}%`);
      }
    }
    
    console.log(`📊 [CoinGecko API] Market data extracted for ${coinId}:`);
    console.log(`   └─ Currency: ${currency}`);
    console.log(`   └─ Current price: ${currentPrice}`);
    console.log(`   └─ 24h change: ${priceChangePercentage24h !== null && priceChangePercentage24h !== undefined ? `${priceChangePercentage24h.toFixed(2)}%` : 'N/A'}`);
    const marketCapChange24h = marketData.market_cap_change_24h?.[currency] ?? null;
    const marketCapChangePercentage24h = marketData.market_cap_change_percentage_24h?.[currency] ?? null;

    // Map to CoinGeckoMarketData format
    const mappedData: CoinGeckoMarketData = {
      id: data.id || coinId,
      symbol: data.symbol || '',
      name: data.name || '',
      image: data.image?.large || data.image?.small || data.image?.thumb || '',
      current_price: currentPrice,
      market_cap: marketCap,
      market_cap_rank: marketData.market_cap_rank ?? null,
      fully_diluted_valuation: marketData.fully_diluted_valuation?.[currency] ?? null,
      total_volume: totalVolume,
      high_24h: high24h,
      low_24h: low24h,
      price_change_24h: priceChange24h,
      price_change_percentage_24h: priceChangePercentage24h,
      market_cap_change_24h: marketCapChange24h,
      market_cap_change_percentage_24h: marketCapChangePercentage24h,
      circulating_supply: marketData.circulating_supply ?? null,
      total_supply: marketData.total_supply ?? null,
      max_supply: marketData.max_supply ?? null,
      ath: marketData.ath?.[currency] ?? null,
      ath_change_percentage: marketData.ath_change_percentage?.[currency] ?? null,
      ath_date: marketData.ath_date?.[currency] ?? null,
      atl: marketData.atl?.[currency] ?? null,
      atl_change_percentage: marketData.atl_change_percentage?.[currency] ?? null,
      atl_date: marketData.atl_date?.[currency] ?? null,
      roi: marketData.roi ?? null,
      last_updated: marketData.last_updated ?? null,
    };

    return mappedData;
  } catch (error) {
    // Check if it's a network error (Failed to fetch)
    // On web, this is often a CORS error which is expected when making direct API calls
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // On web, CORS errors are expected - don't log as error
      if (Platform.OS === 'web') {
        console.warn(`⚠️ [CoinGecko API] Network/CORS error for ${coinId} (expected on web):`);
        console.warn(`   └─ This is informational, not an error`);
        console.warn(`   └─ Direct API calls from browser may be blocked by CORS policy`);
        // Return null to allow graceful degradation
        return null;
      } else {
        // On mobile, "Failed to fetch" is a real network error
        console.error(`❌ [CoinGecko API] Network error fetching market data for coin ${coinId}:`);
        console.error(`   └─ Error: ${error.message}`);
        console.error(`   └─ This is a real network error - check internet connection`);
        throw new Error(`Network error: Failed to fetch market data for ${coinId}. Check your internet connection.`);
      }
    }
    
    // Check if it's already a formatted error (from our code above)
    if (error instanceof Error && (error.message.includes('HTTP') || error.message.includes('parse') || error.message.includes('malformed'))) {
      // Already formatted, just re-throw
      throw error;
    }
    
    // Generic error - format it
    console.error(`❌ [CoinGecko API] Unexpected error fetching market data for coin ${coinId}:`);
    console.error(`   └─ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`   └─ Type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    throw new Error(`Unexpected error fetching market data for ${coinId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Searches for coins using CoinGecko's search API.
 * Maps search results to CoinGeckoMarketData format for compatibility.
 * @param query - The search query (coin name or symbol)
 * @returns Array of coins matching the search query, mapped to CoinGeckoMarketData format
 * @throws {Error} if the API call fails
 */
export async function searchCoins(query: string): Promise<CoinGeckoMarketData[]> {
  if (!query || !query.trim()) {
    return [];
  }

  const url = new URL(COINGECKO_SEARCH_ENDPOINT);
  url.searchParams.append('query', query.trim());

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('❌ CoinGecko API rate limit exceeded. Please try again later.');
      }
      throw new Error(`❌ CoinGecko API returned status ${response.status}`);
    }

    const data: CoinGeckoSearchResponse = await response.json();

    if (!data || !Array.isArray(data.coins)) {
      return [];
    }

    // Map search results to CoinGeckoMarketData format
    // Search results have limited fields, so we set most market data fields to null
    const mappedResults: CoinGeckoMarketData[] = data.coins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.large || coin.thumb || '',
      current_price: null,
      market_cap: null,
      market_cap_rank: coin.market_cap_rank,
      fully_diluted_valuation: null,
      total_volume: null,
      high_24h: null,
      low_24h: null,
      price_change_24h: null,
      price_change_percentage_24h: null,
      market_cap_change_24h: null,
      market_cap_change_percentage_24h: null,
      circulating_supply: null,
      total_supply: null,
      max_supply: null,
      ath: null,
      ath_change_percentage: null,
      ath_date: null,
      atl: null,
      atl_change_percentage: null,
      atl_date: null,
      roi: null,
      last_updated: null,
    }));

    return mappedResults;
  } catch (error) {
    console.error('❌ [CoinGecko API] Error searching coins:', error);
    throw error;
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
    console.log(`💾 [CoinGecko API] Using cached market data:`);
    console.log(`   └─ Coins: ${cachedData.data?.length || 0}`);
    console.log(`   └─ Status: Still fresh, no refetch needed`);
    return cachedData;
  }

  // Cache is missing, stale, or currency changed - attempt to fetch and persist new data
  const cacheStatus = !cachedData ? 'missing' : cachedData.currency !== currency ? 'currency mismatch' : 'stale';
  console.log(`🔄 [CoinGecko API] Cache ${cacheStatus}. Fetching fresh data...`);
  
  try {
    const freshData = await fetchAndPersistCryptoMarket(currency);
    return freshData;
  } catch (error) {
    console.warn('❌ [CoinGecko API] Failed to fetch fresh data. Falling back to stale cache if available.');
    if (cachedData) {
      console.log(`   └─ 💾 Using stale cache (${cachedData.data?.length || 0} coins) as fallback`);
      // Return stale cache if fetching failed (graceful degradation)
      return cachedData;
    }
    // If no cache and fetch failed, re-throw the error
    throw error;
  }
}