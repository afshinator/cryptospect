// utils/backendApi.ts

import { BACKEND_API_KEY, BACKEND_BASE_URL } from '@/constants/backend';
import { CoinGeckoMarketData } from '@/constants/coinGecko';
import { SupportedCurrency } from '@/constants/currency';
import { logger } from '@/utils/logger';
import { Platform } from 'react-native';

// The interface is correct and includes usdtDominance
export interface HistoricalDominanceSnapshot {
  date: number;
  btcDominance: number;
  ethDominance: number;
  usdtDominance: number;
  othersDominance: number;
}

/**
 * Fetches historical dominance data (180 days) from your Vercel backend
 * Backend caches this data for 24 hours
 */
/**
 * Backend info response interface
 */
export interface BackendEndpoint {
  path: string;
  description: string;
  cache?: string;
  authentication?: string;
}

export interface BackendInfo {
  name?: string;
  version?: string;
  status?: string;
  health?: string;
  endpoints?: {
    [key: string]: BackendEndpoint;
  };
  diagnostics?: {
    environmentVariables?: {
      [key: string]: boolean;
    };
    cache?: {
      exists?: boolean;
      isStale?: boolean;
    };
  };
  timestamp?: string;
  [key: string]: any; // Allow for additional fields
}

/**
 * Fetches backend health and info from /api/info endpoint
 * Returns health status, available endpoints, and other backend metadata
 */
export async function fetchBackendHealthInfo(): Promise<BackendInfo | null> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/info`, {
      headers: {
        // 'x-api-key': BACKEND_API_KEY, // doesn't need the key, it'll fail with it.
      },
    });

    if (!response.ok) {
      logger(`⚠️ Backend /api/info returned status ${response.status}`, 'warn');
      return null;
    }

    const data: BackendInfo = await response.json();
    return data;
  } catch (e) {
    logger('⚠️ Error fetching backend info:', 'warn', undefined, e);
    return null;
  }
}

/**
 * Fetches historical dominance data (180 days) from your Vercel backend
 * Backend caches this data for 24 hours
 */
export async function fetchHistoricalDominance(): Promise<HistoricalDominanceSnapshot[]> {
  logger('⚡ Fetching historical dominance from backend...', 'log', 'debug');

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/dominance`, {
      headers: {
        'x-api-key': BACKEND_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API returned status ${response.status}`);
    }

    const rawData: any[] = await response.json();

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('❌ Backend returned empty or invalid data');
    }

    // --- CRITICAL DATA SANITIZATION / MAPPING STEP ---
    // This function ensures all dominance values are valid numbers, replacing NaN/null with 0.
    const sanitizedData: HistoricalDominanceSnapshot[] = rawData
      .map(item => {
        // Skip data points if the date is missing or invalid
        if (!item.date || isNaN(Number(item.date))) {
            return null;
        }
        
        // Helper function to force conversion to a number, defaulting to 0 if invalid (NaN, null, etc.)
        const sanitizeValue = (val: any): number => {
            const num = Number(val);
            // isFinite checks for NaN, Infinity, and normal numbers.
            return isFinite(num) ? num : 0; 
        }

        return {
          date: Number(item.date),
          btcDominance: sanitizeValue(item.btcDominance),
          ethDominance: sanitizeValue(item.ethDominance),
          usdtDominance: sanitizeValue(item.usdtDominance),
          othersDominance: sanitizeValue(item.othersDominance),
        };
      })
      .filter((item): item is HistoricalDominanceSnapshot => item !== null); // Filter out any points with invalid dates

    logger(`✅ Received and sanitized ${sanitizedData.length} historical dominance data points from backend`, 'log', 'debug');
    return sanitizedData;
  } catch (e) {
    logger('❌ Error fetching from backend:', 'error', undefined, e);
    throw e;
  }
}

/**
 * Fetches full market data for a specific coin from the backend /api/coins/{id} endpoint.
 * This is preferred over CoinGecko's direct API to avoid rate limits.
 * @param coinId - The CoinGecko coin ID (e.g., "bitcoin", "ethereum")
 * @param currency - The currency to fetch prices in (defaults to "usd")
 * @returns Full market data for the coin, mapped to CoinGeckoMarketData format, or null if not found/failed
 */
export async function fetchCoinDataFromBackend(
  coinId: string,
  currency: SupportedCurrency = "usd"
): Promise<CoinGeckoMarketData | null> {
  if (!coinId || !coinId.trim()) {
    logger(`⚠️ [Backend API] Invalid coinId: ${coinId}`, 'log', 'info');
    return null;
  }

  const url = `${BACKEND_BASE_URL}/api/coins/${coinId.trim()}`;
  logger(`⚡ [Backend API] Starting fetch for ${coinId}...`, 'log', 'info');
  logger(`   └─ URL: ${url}`, 'log', 'info');
  logger(`   └─ Currency: ${currency}`, 'log', 'info');
  logger(`   └─ Has API key: ${!!BACKEND_API_KEY}`, 'log', 'info');

  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'x-api-key': BACKEND_API_KEY,
      },
    });
    const duration = Date.now() - startTime;
    
    logger(`📡 [Backend API] Response received for ${coinId}:`, 'log', 'info');
    logger(`   └─ Status: ${response.status} ${response.statusText}`, 'log', 'info');
    logger(`   └─ Duration: ${duration}ms`, 'log', 'info');
    logger(`   └─ OK: ${response.ok}`, 'log', 'info');

    if (!response.ok) {
      let failureReason = '';
      if (response.status === 404) {
        failureReason = 'COIN_NOT_FOUND';
        logger(`⚠️ [Backend API] Coin not found (404) for ${coinId}`, 'log', 'info');
        logger(`   └─ Reason: Coin does not exist in backend database`, 'log', 'info');
        logger(`   └─ This is expected if the coin ID is invalid or not supported`, 'log', 'info');
      } else if (response.status === 429) {
        failureReason = 'RATE_LIMITED';
        logger(`⚠️🚦 [Backend API] Rate limit exceeded (429) for ${coinId}`, 'log', 'info');
        logger(`   └─ Reason: Too many requests to backend API`, 'log', 'info');
      } else if (response.status === 401 || response.status === 403) {
        failureReason = 'AUTH_ERROR';
        logger(`⚠️ [Backend API] Authentication error (${response.status}) for ${coinId}`, 'log', 'info');
        logger(`   └─ Reason: Invalid or missing API key`, 'log', 'info');
      } else if (response.status >= 500) {
        failureReason = 'SERVER_ERROR';
        logger(`⚠️ [Backend API] Server error (${response.status}) for ${coinId}`, 'log', 'info');
        logger(`   └─ Reason: Backend server error`, 'log', 'info');
      } else {
        failureReason = 'HTTP_ERROR';
        logger(`⚠️ [Backend API] HTTP error (${response.status}) for ${coinId}`, 'log', 'info');
        logger(`   └─ Reason: Unexpected HTTP status code`, 'log', 'info');
      }
      logger(`   └─ Status text: ${response.statusText}`, 'log', 'info');
      // Try to get error body if available
      try {
        const errorBody = await response.text();
        if (errorBody) {
          logger(`   └─ Error body: ${errorBody.substring(0, 200)}`, 'log', 'info');
        }
      } catch (e) {
        // Ignore error reading body
      }
      // Store failure reason in a way that can be passed back (we'll use a custom error)
      const error = new Error(`Backend API failed: ${failureReason}`);
      (error as any).failureReason = failureReason;
      (error as any).statusCode = response.status;
      throw error; // Throw instead of returning null so we can catch it and log the reason
    }

    const data: any = await response.json();

    // Debug: Log the raw backend response
    // logger(`📊 [Backend API] Raw response for ${coinId}:`, 'log', 'info');
    // logger(`   └─ Response type: ${typeof data}`, 'log', 'info');
    // logger(`   └─ Has data: ${!!data}`, 'log', 'info');
    // logger(`   └─ Data keys: ${data ? Object.keys(data).join(', ') : 'none'}`, 'log', 'info');
    // logger(`   └─ Has market_data: ${!!data?.market_data}`, 'log', 'info');
    // if (data?.market_data) {
    //   logger(`   └─ market_data keys: ${Object.keys(data.market_data).join(', ')}`, 'log', 'info');
    // }
    // logger(`   └─ Full response:`, 'log', 'info', data);

    if (!data || !data.market_data) {
      logger(`⚠️ [Backend API] No market data in response for ${coinId}`, 'log', 'info');
      logger(`   └─ Reason: Response missing market_data field`, 'log', 'info');
      logger(`   └─ Has data: ${!!data}`, 'log', 'info');
      logger(`   └─ Has market_data: ${!!data?.market_data}`, 'log', 'info');
      if (data) {
        logger(`   └─ Response keys: ${Object.keys(data).join(', ')}`, 'log', 'info');
      }
      const error = new Error(`Backend API: No market data available`);
      (error as any).failureReason = 'NO_MARKET_DATA';
      throw error; // Throw instead of returning null
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
      const price24hAgo = currentPrice - priceChange24h;
      if (price24hAgo !== 0) {
        priceChangePercentage24h = (priceChange24h / price24hAgo) * 100;
      }
    }

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

    // Debug: Log the mapped data
    logger(`✅ [Backend API] Successfully fetched coin data for ${coinId}`, 'log', 'info');
    logger(`   └─ Data source: BACKEND API`, 'log', 'info');
    logger(`   └─ Name: ${mappedData.name}`, 'log', 'info');
    logger(`   └─ Symbol: ${mappedData.symbol}`, 'log', 'info');
    logger(`   └─ Current price: ${mappedData.current_price}`, 'log', 'info');
    logger(`   └─ 24h change: ${mappedData.price_change_percentage_24h}`, 'log', 'info');
    logger(`   └─ Market cap: ${mappedData.market_cap}`, 'log', 'info');
    logger(`   └─ Full mapped data:`, 'log', 'info', mappedData);
    
    return mappedData;
  } catch (error) {
    const failureReason = (error as any)?.failureReason || 'UNKNOWN_ERROR';
    const statusCode = (error as any)?.statusCode;
    
    logger(`❌ [Backend API] Exception caught for ${coinId}:`, 'log', 'info');
    logger(`   └─ Failure reason: ${failureReason}`, 'log', 'info');
    if (statusCode) {
      logger(`   └─ HTTP status: ${statusCode}`, 'log', 'info');
    }
    logger(`   └─ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`, 'log', 'info');
    logger(`   └─ Error message: ${error instanceof Error ? error.message : String(error)}`, 'log', 'info');
    
    // Check if it's a network error (Failed to fetch)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // On web, CORS errors are expected - don't log as error
      if (Platform.OS === 'web') {
        logger(`   └─ This is a CORS/network error (expected on web)`, 'log', 'info');
        logger(`   └─ Direct API calls from browser may be blocked by CORS policy`, 'log', 'info');
        logger(`   └─ Failure reason: CORS_BLOCKED`, 'log', 'info');
        return null;
      } else {
        // On mobile, "Failed to fetch" is a real network error
        logger(`   └─ This is a network error (mobile)`, 'log', 'info');
        logger(`   └─ Failure reason: NETWORK_ERROR`, 'log', 'info');
        return null;
      }
    }
    
    // If we have a failure reason from our code, it's already been logged above
    if (failureReason === 'UNKNOWN_ERROR') {
      logger(`   └─ Full error:`, 'log', 'info', error);
    }
    return null;
  }
}
 