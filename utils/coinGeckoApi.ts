// utils/coinGeckoApi.ts

import {
  MARKET_DATA_BASE_RETRY_DELAY_MS,
  MARKET_DATA_DELAY_BETWEEN_PAGES_MS,
  MARKET_DATA_LONG_DELAY_MS,
  MARKET_DATA_MAX_RETRIES,
  MARKET_DATA_PAGES_BEFORE_LONG_DELAY,
} from '@/constants/apiConfig';
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
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';
import { logger } from '@/utils/logger';
import { Platform } from 'react-native';

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
    logger(`📊 [CoinGecko API] Rate Limit Info (Page ${page}):`, 'log', 'debug');
    if (limit) logger(`   └─ Limit: ${limit}`, 'log', 'debug');
    if (remaining) logger(`   └─ Remaining: ${remaining}`, 'log', 'debug');
    if (retryAfter) logger(`   └─ ⚠️ Retry-After: ${retryAfter} seconds`, 'log', 'debug');
    
    // Warn if getting close to limit
    if (remaining && limit) {
      const remainingNum = parseInt(remaining);
      const limitNum = parseInt(limit);
      const percentRemaining = (remainingNum / limitNum) * 100;
      
      if (percentRemaining < 20) {
        logger(`   └─ ⚠️ WARNING: Only ${percentRemaining.toFixed(0)}% of rate limit remaining!`, 'warn');
      }
    }
  } else {
    logger(`📊 [CoinGecko API] Rate Limit Info (Page ${page}): No rate-limiting info received`, 'log');
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

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (fetchError) {
    // Check if the fetch error is related to 429 rate limiting
    const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
    const errorString = String(fetchError);
    const isRateLimit = 
      errorMessage.includes('429') || 
      errorMessage.includes('Too Many Requests') ||
      errorString.includes('429') ||
      errorString.includes('Too Many Requests');
    
    if (isRateLimit) {
      logger(`⚠️🚦 Rate limited on page ${page} (fetch failed with 429). Waiting before retry ${retryCount + 1}/${MAX_RETRIES}...`, 'warn');
      const waitTime = BASE_RETRY_DELAY_MS;
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchCryptoMarketPage(currency, page, retryCount + 1);
      } else {
        logger(`⚠️🚦 CoinGecko API rate limit exceeded after ${MAX_RETRIES} retries for page ${page}`, 'warn');
        throw new Error(`CoinGecko API rate limit exceeded after ${MAX_RETRIES} retries for page ${page}`);
      }
    }
    // Re-throw if it's not a rate limit error
    throw fetchError;
  }

  // Log rate limit info for all responses
  logRateLimitInfo(response, page);

  // Handle rate limiting (HTTP 429)
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : BASE_RETRY_DELAY_MS;
    
    if (retryCount < MAX_RETRIES) {
      logger(`⚠️🚦 Rate limited on page ${page}. Waiting ${waitTime / 1000} seconds before retry ${retryCount + 1}/${MAX_RETRIES}...`, 'warn');
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return fetchCryptoMarketPage(currency, page, retryCount + 1);
    } else {
      logger(`⚠️🚦 CoinGecko API rate limit exceeded after ${MAX_RETRIES} retries for page ${page}`, 'warn');
      throw new Error(`CoinGecko API rate limit exceeded after ${MAX_RETRIES} retries for page ${page}`);
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
  logger(`⚡ [CoinGecko API] Starting market data fetch:`, 'log', 'debug');
  logger(`   └─ Currency: ${currency}`, 'log', 'debug');
  logger(`   └─ Pages to fetch: ${MARKET_DATA_PAGES_TO_FETCH}`, 'log', 'debug');
  logger(`   └─ Delay between pages: ${DELAY_BETWEEN_PAGES_MS}ms`, 'log', 'debug');

  // Load existing cached data to preserve it if new fetch fails or is incomplete
  const existingData = await loadCachedCryptoMarket();
  const existingCoinCount = existingData?.data?.length || 0;
  const now = Date.now();
  
  if (existingData) {
    logger(`💾 [CoinGecko API] Preserving existing cache (${existingCoinCount} coins) until new data is validated`, 'log', 'debug');
  }

  // Determine which pages need refreshing based on per-page timestamps
  const pagesToFetch: number[] = [];
  const existingPageTimestamps = existingData?.pageTimestamps || {};
  
  for (let page = 1; page <= MARKET_DATA_PAGES_TO_FETCH; page++) {
    const pageTimestamp = existingPageTimestamps[page];
    const pageAge = pageTimestamp ? now - pageTimestamp : Infinity;
    const isStale = !pageTimestamp || pageAge >= CRYPTO_MARKET_REFRESH_INTERVAL_MS;
    
    if (isStale) {
      pagesToFetch.push(page);
      if (pageTimestamp) {
        logger(`   └─ Page ${page}: Stale (${Math.round(pageAge / 1000)}s old, threshold: ${CRYPTO_MARKET_REFRESH_INTERVAL_MS / 1000}s)`, 'log', 'debug');
      } else {
        logger(`   └─ Page ${page}: No timestamp (needs initial fetch)`, 'log', 'debug');
      }
    } else {
      logger(`   └─ Page ${page}: Fresh (${Math.round(pageAge / 1000)}s old, ${Math.round((CRYPTO_MARKET_REFRESH_INTERVAL_MS - pageAge) / 1000)}s remaining)`, 'log', 'debug');
    }
  }
  
  if (pagesToFetch.length === 0) {
    logger(`✅ [CoinGecko API] All pages are fresh, no fetch needed`, 'log', 'debug');
    if (existingData) {
      return existingData;
    }
    // If no existing data but no pages to fetch, something's wrong - fetch all pages
    pagesToFetch.push(...Array.from({length: MARKET_DATA_PAGES_TO_FETCH}, (_, i) => i + 1));
    logger(`   └─ ⚠️ No existing data found, fetching all pages`, 'warn');
  } else {
    logger(`🔄 [CoinGecko API] Pages to fetch: ${pagesToFetch.join(', ')} (${pagesToFetch.length}/${MARKET_DATA_PAGES_TO_FETCH})`, 'log', 'info');
  }

  try {
    const allData: CoinGeckoMarketData[] = [];
    const successfulPages: number[] = []; // Track which pages were successfully fetched
    const newPageTimestamps: { [page: number]: number } = { ...existingPageTimestamps }; // Start with existing timestamps
    let pagesFetched = 0;
    let fetchFailed = false;

    // Fetch only pages that need refreshing
    for (const page of pagesToFetch) {
      logger(`📄 [CoinGecko API] Fetching page ${page}/${MARKET_DATA_PAGES_TO_FETCH}...`, 'log', 'debug');
      
      try {
        const pageData = await fetchCryptoMarketPage(currency, page);
        
        if (pageData.length === 0) {
          logger(`   └─ ⚠️ Page ${page} returned no data. Stopping pagination.`, 'log', 'debug');
          // Don't break - continue with remaining pages, but mark this page as failed
          fetchFailed = true;
          continue;
        }
        
        allData.push(...pageData);
        successfulPages.push(page);
        newPageTimestamps[page] = now; // Update timestamp for successfully fetched page
        pagesFetched++;
        logger(`   └─ ✅ Page ${page} fetched: ${pageData.length} coins (total: ${allData.length})`, 'log', 'debug');
        logger(`   └─ 📅 Page ${page} timestamp updated: ${new Date(now).toISOString()}`, 'log', 'debug');
        
        // Delay between pages to respect rate limits
        const currentIndex = pagesToFetch.indexOf(page);
        if (currentIndex < pagesToFetch.length - 1) {
          // After every N pages, use a longer delay
          if (pagesFetched % PAGES_BEFORE_LONG_DELAY === 0) {
            logger(`   └─ ⏸️  Fetched ${PAGES_BEFORE_LONG_DELAY} pages. Waiting ${DELAY_AFTER_EVERY_N_PAGES_MS}ms before next page...`, 'log', 'debug');
            await new Promise(resolve => setTimeout(resolve, DELAY_AFTER_EVERY_N_PAGES_MS));
          } else {
            logger(`   └─ ⏸️  Waiting ${DELAY_BETWEEN_PAGES_MS}ms before next page...`, 'log', 'debug');
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PAGES_MS));
          }
        }
      } catch (error) {
        // Check if it's a rate limit error - log as warning, not error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = String(error);
        // Check for 429 in error message, stack trace, or if it's a network error that might be rate limiting
        // On web, "Failed to fetch" errors from CoinGecko API could be rate limiting (browser shows 429 in network tab)
        const isRateLimit = 
          errorMessage.includes('rate limit') || 
          errorMessage.includes('429') || 
          errorMessage.includes('Too Many Requests') ||
          errorString.includes('429') ||
          errorString.includes('Too Many Requests') ||
          (error instanceof TypeError && errorMessage.includes('Failed to fetch') && Platform.OS === 'web');
        
        if (isRateLimit) {
          logger(`   └─ ⚠️🚦 Rate limit error fetching page ${page} (likely 429):`, 'warn', undefined, error);
        } else {
          logger(`   └─ ❌ Error fetching page ${page}:`, 'error', undefined, error);
        }
        fetchFailed = true;
        
        // Continue to next page even if this one failed (we'll merge with existing data)
        // Don't update timestamp for failed pages - they'll be retried next time
        logger(`   └─ ⚠️ Page ${page} failed, keeping old timestamp (if exists) for retry`, 'warn');
        
        // If we have some data, continue with remaining pages
        if (allData.length > 0 || pagesToFetch.length > 1) {
          logger(`   └─ ⚠️ Continuing with remaining pages...`, 'warn');
          continue;
        }
        // If this is the only page and it fails, throw the error
        throw error;
      }
    }

    if (allData.length === 0 && (!existingData || !existingData.data || existingData.data.length === 0)) {
      throw new Error('❌ CoinGecko API returned no data for any page and no existing cache available.');
    }

    // Determine which pages failed (were in pagesToFetch but not in successfulPages)
    const failedPages = pagesToFetch.filter(p => !successfulPages.includes(p));
    const allPages = Array.from({length: MARKET_DATA_PAGES_TO_FETCH}, (_, i) => i + 1);
    const pagesNotAttempted = allPages.filter(p => !pagesToFetch.includes(p));
    
    // If we have existing data, merge new pages with old pages
    if (existingData && existingData.data && existingData.data.length > 0) {
      logger(`🔄 [CoinGecko API] Merging successfully fetched pages with existing cache:`, 'log', 'info');
      logger(`   └─ Successfully fetched pages: ${successfulPages.length > 0 ? successfulPages.join(', ') : 'none'} (${allData.length} coins)`, 'log', 'info');
      if (failedPages.length > 0) {
        logger(`   └─ Failed pages (will retry when stale): ${failedPages.join(', ')}`, 'log', 'info');
      }
      if (pagesNotAttempted.length > 0) {
        logger(`   └─ Pages not attempted (still fresh): ${pagesNotAttempted.join(', ')}`, 'log', 'info');
      }
      
      // Create a Set of coin IDs from successfully fetched pages (for fast lookup)
      const newCoinIds = new Set(allData.map(coin => coin.id.toLowerCase()));
      
      // Keep coins from existing cache that are NOT in the successfully fetched pages
      // This preserves data from failed pages and pages not attempted
      const existingCoinsFromOtherPages = existingData.data.filter(
        coin => !newCoinIds.has(coin.id.toLowerCase())
      );
      
      // Merge: new data from successful pages + old data from other pages
      const mergedData = [...allData, ...existingCoinsFromOtherPages];
      
      // Sort by market_cap_rank to maintain proper order
      mergedData.sort((a, b) => {
        const rankA = a.market_cap_rank ?? Infinity;
        const rankB = b.market_cap_rank ?? Infinity;
        return rankA - rankB;
      });
      
      logger(`   └─ Merged result: ${mergedData.length} coins (${allData.length} new + ${existingCoinsFromOtherPages.length} from cache)`, 'log', 'info');
      
      // Calculate overall timestamp (oldest page timestamp, or now if all pages are fresh)
      const allPageTimestamps = Object.values(newPageTimestamps);
      const oldestPageTimestamp = allPageTimestamps.length > 0 ? Math.min(...allPageTimestamps) : now;
      
      const mergedSnapshot: CryptoMarketSnapshot = {
        data: mergedData,
        timestamp: oldestPageTimestamp, // Overall timestamp is oldest page timestamp
        currency,
        pageTimestamps: newPageTimestamps, // Per-page timestamps for granular refresh
      };
      
      // Always persist merged data (it's at least as good as what we had)
      await setJSONObject(CRYPTO_MARKET_CACHE_KEY, mergedSnapshot);
      logger(`✅ [CoinGecko API] Successfully merged and persisted market data:`, 'log', 'info');
      logger(`   └─ Total coins: ${mergedData.length}`, 'log', 'info');
      logger(`   └─ Pages updated: ${successfulPages.length > 0 ? successfulPages.join(', ') : 'none'}`, 'log', 'info');
      if (failedPages.length > 0) {
        const failedPageAges = failedPages.map(p => {
          const ts = existingPageTimestamps[p];
          return ts ? `${p}(${Math.round((now - ts) / 1000)}s old)` : `${p}(never)`;
        });
        logger(`   └─ Failed pages (retry when stale): ${failedPageAges.join(', ')}`, 'log', 'info');
      }
      if (pagesNotAttempted.length > 0) {
        const notAttemptedAges = pagesNotAttempted.map(p => {
          const ts = existingPageTimestamps[p];
          return ts ? `${p}(${Math.round((now - ts) / 1000)}s old, ${Math.round((CRYPTO_MARKET_REFRESH_INTERVAL_MS - (now - ts)) / 1000)}s remaining)` : `${p}(never)`;
        });
        logger(`   └─ Pages not attempted (still fresh): ${notAttemptedAges.join(', ')}`, 'log', 'info');
      }
      logger(`   └─ Overall timestamp: ${new Date(oldestPageTimestamp).toISOString()} (${Math.round((now - oldestPageTimestamp) / 1000)}s old)`, 'log', 'info');
      
      return mergedSnapshot;
    }

    // If no existing data, use the fetched data as-is
    // Calculate overall timestamp (oldest page timestamp, or now if all pages are fresh)
    const allPageTimestamps = Object.values(newPageTimestamps);
    const oldestPageTimestamp = allPageTimestamps.length > 0 ? Math.min(...allPageTimestamps) : now;
    
    const newSnapshot: CryptoMarketSnapshot = {
      data: allData,
      timestamp: oldestPageTimestamp,
      currency,
      pageTimestamps: newPageTimestamps, // Per-page timestamps for granular refresh
    };

    // Persist the data
    await setJSONObject(CRYPTO_MARKET_CACHE_KEY, newSnapshot);
    logger(`✅ [CoinGecko API] Successfully fetched and persisted market data:`, 'log', 'debug');
    logger(`   └─ Total coins: ${allData.length}`, 'log', 'debug');
    logger(`   └─ Pages fetched: ${successfulPages.length}/${pagesToFetch.length} attempted`, 'log', 'debug');
    logger(`   └─ Overall timestamp: ${new Date(oldestPageTimestamp).toISOString()}`, 'log', 'debug');

    return newSnapshot;
  } catch (e) {
    // Check if it's a rate limit error - log as warning, not error
    const errorMessage = e instanceof Error ? e.message : String(e);
    const errorString = String(e);
    // On web, "Failed to fetch" errors from CoinGecko API could be rate limiting (browser shows 429 in network tab)
    const isRateLimit = 
      errorMessage.includes('rate limit') || 
      errorMessage.includes('429') || 
      errorMessage.includes('Too Many Requests') ||
      errorString.includes('429') ||
      errorString.includes('Too Many Requests') ||
      (e instanceof TypeError && errorMessage.includes('Failed to fetch') && Platform.OS === 'web');
    
    if (isRateLimit) {
      logger('⚠️🚦 [CoinGecko API] Rate limit error fetching/persisting market data (likely 429):', 'warn', undefined, e);
    } else {
      logger('❌ [CoinGecko API] Error fetching/persisting market data:', 'error', undefined, e);
    }
    
    // If we have existing data, preserve it and return it instead of throwing
    if (existingData) {
      logger(`   └─ 💾 Fetch failed. Preserving existing cache (${existingCoinCount} coins) as fallback.`, 'warn');
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
        logger(`⚠️🚦 [CoinGecko API] Rate limit exceeded for ${coinId}:`, 'warn');
        logger(`   └─ Retry after: ${retrySeconds} seconds`, 'warn');
        // Return null instead of throwing - this allows the UI to continue showing partial data
        return null;
      }
      if (response.status === 404) {
        logger(`⚠️ [CoinGecko API] Coin not found: ${coinId}`, 'warn');
        return null;
      }
      throw new Error(`❌ CoinGecko API returned status ${response.status} for coin ${coinId}`);
    }

    const data: any = await response.json();

    if (!data || !data.market_data) {
      logger(`⚠️ [CoinGecko API] No market data available for coin: ${coinId}`, 'warn');
      logger(`   └─ Has data: ${!!data}`, 'warn');
      logger(`   └─ Has market_data: ${!!data?.market_data}`, 'warn');
      logger(`   └─ Data keys: ${data ? Object.keys(data).join(', ') : 'none'}`, 'warn');
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
        logger(`📊 [CoinGecko API] Calculated 24h % change for ${coinId}:`, 'log', 'debug');
        logger(`   └─ Current price: ${currentPrice}`, 'log', 'debug');
        logger(`   └─ Price change 24h: ${priceChange24h}`, 'log', 'debug');
        logger(`   └─ Price 24h ago: ${price24hAgo}`, 'log', 'debug');
        logger(`   └─ Calculated %: ${priceChangePercentage24h.toFixed(2)}%`, 'log', 'debug');
      }
    }
    
    logger(`✅ [CoinGecko API] Successfully fetched coin data for ${coinId}`, 'log', 'info');
    logger(`   └─ Data source: COINGECKO API`, 'log', 'info');
    logger(`   └─ Name: ${data.name || coinId}`, 'log', 'info');
    logger(`   └─ Symbol: ${data.symbol || ''}`, 'log', 'info');
    logger(`   └─ Current price: ${currentPrice}`, 'log', 'info');
    logger(`   └─ 24h change: ${priceChangePercentage24h !== null && priceChangePercentage24h !== undefined ? `${priceChangePercentage24h.toFixed(2)}%` : 'N/A'}`, 'log', 'info');
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
        logger(`⚠️ [CoinGecko API] Network/CORS error for ${coinId} (expected on web):`, 'warn');
        logger(`   └─ This is informational, not an error`, 'warn');
        logger(`   └─ Direct API calls from browser may be blocked by CORS policy`, 'warn');
        // Return null to allow graceful degradation
        return null;
      } else {
        // On mobile, "Failed to fetch" is a real network error
        logger(`❌ [CoinGecko API] Network error fetching market data for coin ${coinId}:`, 'error');
        logger(`   └─ Error: ${error.message}`, 'error');
        logger(`   └─ This is a real network error - check internet connection`, 'error');
        throw new Error(`Network error: Failed to fetch market data for ${coinId}. Check your internet connection.`);
      }
    }
    
    // Check if it's already a formatted error (from our code above)
    if (error instanceof Error && (error.message.includes('HTTP') || error.message.includes('parse') || error.message.includes('malformed'))) {
      // Already formatted, just re-throw
      throw error;
    }
    
    // Generic error - format it
    logger(`❌ [CoinGecko API] Unexpected error fetching market data for coin ${coinId}:`, 'error');
    logger(`   └─ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    logger(`   └─ Type: ${error instanceof Error ? error.constructor.name : typeof error}`, 'error');
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
        logger(`⚠️🚦 [CoinGecko API] Rate limit exceeded on search. Please try again later.`, 'warn');
        throw new Error('CoinGecko API rate limit exceeded. Please try again later.');
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
    // Check if it's a rate limit error - log as warning, not error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429');
    
    if (isRateLimit) {
      logger('⚠️🚦 [CoinGecko API] Rate limit error searching coins:', 'warn', undefined, error);
    } else {
      logger('❌ [CoinGecko API] Error searching coins:', 'error', undefined, error);
    }
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

  // Check if we have per-page timestamps (new format) or just overall timestamp (legacy format)
  const hasPerPageTimestamps = cachedData?.pageTimestamps && Object.keys(cachedData.pageTimestamps).length > 0;
  
  if (cachedData && cachedData.currency === currency) {
    if (hasPerPageTimestamps) {
      // New format: Check if any pages are stale
      const stalePages: number[] = [];
      for (let page = 1; page <= MARKET_DATA_PAGES_TO_FETCH; page++) {
        const pageTimestamp = cachedData.pageTimestamps![page];
        if (!pageTimestamp || (now - pageTimestamp) >= CRYPTO_MARKET_REFRESH_INTERVAL_MS) {
          stalePages.push(page);
        }
      }
      
      if (stalePages.length === 0) {
        logger(`💾 [CoinGecko API] Using cached market data:`, 'log', 'debug');
        logger(`   └─ Coins: ${cachedData.data?.length || 0}`, 'log', 'debug');
        logger(`   └─ Status: All pages fresh, no refetch needed`, 'log', 'debug');
        return cachedData;
      } else {
        logger(`🔄 [CoinGecko API] Some pages are stale (${stalePages.join(', ')}). Fetching only stale pages...`, 'log', 'debug');
        // Will fetch only stale pages in fetchAndPersistCryptoMarket
      }
    } else {
      // Legacy format: Check overall timestamp
      if (now - cachedData.timestamp < CRYPTO_MARKET_REFRESH_INTERVAL_MS) {
        logger(`💾 [CoinGecko API] Using cached market data:`, 'log', 'debug');
        logger(`   └─ Coins: ${cachedData.data?.length || 0}`, 'log', 'debug');
        logger(`   └─ Status: Still fresh (legacy format), no refetch needed`, 'log', 'debug');
        return cachedData;
      } else {
        logger(`🔄 [CoinGecko API] Cache stale (legacy format). Migrating to per-page timestamps...`, 'log', 'debug');
        // Will fetch all pages and migrate to per-page format
      }
    }
  }

  // Cache is missing, stale, or currency changed - attempt to fetch and persist new data
  const cacheStatus = !cachedData ? 'missing' : cachedData.currency !== currency ? 'currency mismatch' : hasPerPageTimestamps ? 'some pages stale' : 'stale';
  logger(`🔄 [CoinGecko API] Cache ${cacheStatus}. Fetching fresh data...`, 'log', 'debug');
  
  try {
    const freshData = await fetchAndPersistCryptoMarket(currency);
    return freshData;
  } catch (error) {
    // Check if it's a rate limit error - log as warning, not error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429');
    
    if (isRateLimit) {
      logger('⚠️🚦 [CoinGecko API] Rate limited. Falling back to stale cache if available.', 'warn');
    } else {
      logger('❌ [CoinGecko API] Failed to fetch fresh data. Falling back to stale cache if available.', 'warn');
    }
    if (cachedData) {
      logger(`   └─ 💾 Using stale cache (${cachedData.data?.length || 0} coins) as fallback`, 'log', 'debug');
      // Return stale cache if fetching failed (graceful degradation)
      return cachedData;
    }
    // If no cache and fetch failed, re-throw the error
    throw error;
  }
}