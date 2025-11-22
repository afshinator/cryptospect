// utils/fetchOutlierCoinData.ts

/**
 * Shared utility for fetching outlier coin data using backend-first strategy.
 * 
 * This function implements the standard fetch strategy:
 * 1. Try backend API first (/api/coins/{id})
 * 2. Fall back to CoinGecko API (/coins/{id}) if backend fails
 * 
 * Used by:
 * - CoinListItems component (when user views list with outlier coins)
 * - useStartupCoinFetch hook (background fetch after app initialization)
 */

import { CoinGeckoMarketData } from '@/constants/coinGecko';
import { SupportedCurrency } from '@/constants/currency';
import { fetchCoinDataFromBackend } from '@/utils/backendApi';
import { fetchCoinMarketData } from '@/utils/coinGeckoApi';
import { logger } from '@/utils/logger';

export interface FetchOutlierCoinResult {
  data: CoinGeckoMarketData | null;
  dataSource: 'backend' | 'coingecko' | 'none';
}

/**
 * Fetches coin data using backend-first strategy with CoinGecko fallback.
 * 
 * @param coinId - The coin ID to fetch (e.g., "fantom", "bitcoin")
 * @param currency - The currency to fetch prices in (defaults to "usd")
 * @param logContext - Optional context string for logging (e.g., "CoinListItems", "Startup Fetch")
 * @returns Promise resolving to the fetched coin data and data source, or null if both APIs fail
 */
export async function fetchOutlierCoinData(
  coinId: string,
  currency: SupportedCurrency = 'usd',
  logContext: string = 'OutlierCoinFetch'
): Promise<FetchOutlierCoinResult> {
  if (!coinId || !coinId.trim()) {
    logger(`⚠️ [${logContext}] Invalid coin ID provided: ${coinId}`, 'warn');
    return { data: null, dataSource: 'none' };
  }

  const normalizedCoinId = coinId.trim().toLowerCase();
  let dataSource: 'backend' | 'coingecko' | 'none' = 'none';

  try {
    // STEP 1: Try backend first
    logger(`🔵 [${logContext}] STEP 1: Attempting BACKEND API for ${normalizedCoinId}...`, 'log', 'info');
    let coinData = await fetchCoinDataFromBackend(normalizedCoinId, currency);

    if (coinData) {
      dataSource = 'backend';
      logger(`✅ [${logContext}] STEP 1 SUCCESS: BACKEND API returned data for ${normalizedCoinId}`, 'log', 'info');
      logger(`   └─ Name: ${coinData.name}`, 'log', 'info');
      logger(`   └─ Price change: ${coinData.price_change_percentage_24h ?? 'null'}`, 'log', 'info');
      logger(`   └─ Skipping CoinGecko (backend data available)`, 'log', 'info');
      return { data: coinData, dataSource };
    }

    // Backend returned null - log the reason (already logged by fetchCoinDataFromBackend)
    logger(`⚠️ [${logContext}] STEP 1 FAILED: Backend returned null for ${normalizedCoinId}`, 'log', 'info');
    logger(`   └─ Check logs above for failure reason (COIN_NOT_FOUND, NO_MARKET_DATA, CORS_BLOCKED, etc.)`, 'log', 'info');

    // STEP 2: Fall back to CoinGecko
    logger(`🟡 [${logContext}] STEP 2: Falling back to CoinGecko API for ${normalizedCoinId}...`, 'log', 'info');
    coinData = await fetchCoinMarketData(normalizedCoinId, currency);

    if (coinData) {
      dataSource = 'coingecko';
      logger(`✅ [${logContext}] STEP 2 SUCCESS: CoinGecko API returned data for ${normalizedCoinId}`, 'log', 'info');
      logger(`   └─ Name: ${coinData.name}`, 'log', 'info');
      logger(`   └─ Price change: ${coinData.price_change_percentage_24h ?? 'null'}`, 'log', 'info');
      return { data: coinData, dataSource };
    }

    // Both APIs failed
    logger(`❌ [${logContext}] STEP 2 FAILED: CoinGecko also returned null for ${normalizedCoinId}`, 'log', 'info');
    logger(`📊 [${logContext}] Fetch summary for ${normalizedCoinId}:`, 'log', 'info');
    logger(`   └─ Final data source: NONE`, 'log', 'info');
    logger(`   └─ Has data: false`, 'log', 'info');
    return { data: null, dataSource: 'none' };

  } catch (error) {
    // Handle backend errors that throw (not just return null)
    const failureReason = (error as any)?.failureReason || 'UNKNOWN';
    const statusCode = (error as any)?.statusCode;

    logger(`⚠️ [${logContext}] STEP 1 ERROR: Backend threw an error for ${normalizedCoinId}`, 'log', 'info');
    logger(`   └─ Failure reason: ${failureReason}`, 'log', 'info');
    if (statusCode) {
      logger(`   └─ HTTP status: ${statusCode}`, 'log', 'info');
    }
    logger(`   └─ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`, 'log', 'info');
    logger(`   └─ Error message: ${error instanceof Error ? error.message : String(error)}`, 'log', 'info');

    // Provide interpretation of failure reasons
    if (failureReason === 'COIN_NOT_FOUND') {
      logger(`   └─ Interpretation: Coin does not exist in backend database`, 'log', 'info');
    } else if (failureReason === 'NO_MARKET_DATA') {
      logger(`   └─ Interpretation: Backend returned response but missing market_data field`, 'log', 'info');
    } else if (failureReason === 'CORS_BLOCKED') {
      logger(`   └─ Interpretation: Browser blocked the request due to CORS policy (expected on web)`, 'log', 'info');
    } else if (failureReason === 'NETWORK_ERROR') {
      logger(`   └─ Interpretation: Network connection failed`, 'log', 'info');
    } else if (failureReason === 'AUTH_ERROR') {
      logger(`   └─ Interpretation: Authentication failed (invalid or missing API key)`, 'log', 'info');
    } else if (failureReason === 'RATE_LIMITED') {
      logger(`   └─ Interpretation: Backend rate limit exceeded`, 'log', 'info');
    } else if (failureReason === 'SERVER_ERROR') {
      logger(`   └─ Interpretation: Backend server error (5xx)`, 'log', 'info');
    }

    // Try CoinGecko as fallback even if backend threw an error
    try {
      logger(`🟡 [${logContext}] STEP 2: Falling back to CoinGecko API for ${normalizedCoinId}...`, 'log', 'info');
      const coinData = await fetchCoinMarketData(normalizedCoinId, currency);

      if (coinData) {
        dataSource = 'coingecko';
        logger(`✅ [${logContext}] STEP 2 SUCCESS: CoinGecko API returned data for ${normalizedCoinId}`, 'log', 'info');
        logger(`   └─ Name: ${coinData.name}`, 'log', 'info');
        logger(`   └─ Price change: ${coinData.price_change_percentage_24h ?? 'null'}`, 'log', 'info');
        return { data: coinData, dataSource };
      }

      logger(`❌ [${logContext}] STEP 2 FAILED: CoinGecko also returned null for ${normalizedCoinId}`, 'log', 'info');
    } catch (coingeckoError) {
      // Don't log as error if it's a rate limit or network/CORS issue - these are expected
      const errorMessage = coingeckoError instanceof Error ? coingeckoError.message : String(coingeckoError);
      const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429');
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error');

      if (isRateLimit) {
        logger(`⚠️🚦 [${logContext}] Rate limit hit for ${normalizedCoinId}. Will retry later.`, 'warn');
      } else if (isNetworkError) {
        logger(`⚠️ [${logContext}] Network/CORS issue for ${normalizedCoinId} (expected):`, 'warn');
        logger(`   └─ This is informational, not an error`, 'warn');
        logger(`   └─ Will retry later when network is available`, 'warn');
      } else {
        logger(`❌ [${logContext}] Failed to fetch market data for ${normalizedCoinId}:`, 'error', undefined, coingeckoError);
      }
    }

    logger(`📊 [${logContext}] Fetch summary for ${normalizedCoinId}:`, 'log', 'info');
    logger(`   └─ Final data source: NONE`, 'log', 'info');
    logger(`   └─ Has data: false`, 'log', 'info');
    return { data: null, dataSource: 'none' };
  }
}

