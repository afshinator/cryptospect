import { COINGECKO_BASE_URL } from "@/constants/coinGecko";
import {
  CRYPTO_DOMINANCE_HISTORY_CACHE_KEY,
  CRYPTO_DOMINANCE_HISTORY_REFRESH_INTERVAL_MS,
} from "@/constants/misc";
import { getJSONObject, setJSONObject } from "@/utils/asyncStorage"; // AsyncStorage utilities

// 💡 CONSTANT: Define the look-back period (4 weeks) at the top of the file
const HISTORICAL_DAYS = 28;

// --- TYPE DEFINITIONS for CoinGecko API Response Structures ---
type MarketCapPoint = [number, number];

interface CoinGeckoMarketChartResponse {
  market_caps: MarketCapPoint[];
}
interface CoinGeckoGlobalChartResponse {
  market_cap: MarketCapPoint[];
}

// --- OUTPUT TYPE DEFINITION ---
export interface HistoricalDominanceSnapshot {
  date: number; // UNIX timestamp (in milliseconds)
  btcDominance: number; // BTC.D %
  ethDominance: number; // ETH.D %
  othersDominance: number; // OTHERS.D %
}

// 💡 CACHE TYPE: Wrapper for cached data, including a timestamp
export type HistoricalDominanceCache = {
  data: HistoricalDominanceSnapshot[] | null;
  timestamp: number;
};

// --- CORE FETCH/CALCULATION LOGIC (Network function) ---

async function fetchRawHistoricalData(): Promise<
  HistoricalDominanceSnapshot[] | null
> {
  const base = COINGECKO_BASE_URL;

  try {
    // Execute the three concurrent API calls for Total, BTC, and ETH Market Cap
    const [globalResponse, btcResponse, ethResponse] = await Promise.all([
      fetch(`${base}/global/market_cap_chart?days=${HISTORICAL_DAYS}`).then(
        (res) => res.json()
      ),
      fetch(
        `${base}/coins/bitcoin/market_chart?vs_currency=usd&days=${HISTORICAL_DAYS}`
      ).then((res) => res.json()),
      fetch(
        `${base}/coins/ethereum/market_chart?vs_currency=usd&days=${HISTORICAL_DAYS}`
      ).then((res) => res.json()),
    ]);

    const globalData: CoinGeckoGlobalChartResponse = globalResponse;
    const btcData: CoinGeckoMarketChartResponse = btcResponse;
    const ethData: CoinGeckoMarketChartResponse = ethResponse;

    if (
      !globalData?.market_cap ||
      !btcData?.market_caps ||
      !ethData?.market_caps
    ) {
      throw new Error(
        "Historical dominance API response missing core data or malformed."
      );
    }

    // Convert raw data arrays to Maps for quick alignment by timestamp
    const tmcMap = new Map<number, number>(
      globalData.market_cap.map(([ts, val]) => [ts, val])
    );
    const btcMap = new Map<number, number>(
      btcData.market_caps.map(([ts, val]) => [ts, val])
    );
    const ethMap = new Map<number, number>(
      ethData.market_caps.map(([ts, val]) => [ts, val])
    );

    const history: HistoricalDominanceSnapshot[] = [];

    // Calculate dominance for each aligned timestamp
    for (const [timestampMs, btcCap] of btcData.market_caps) {
      const tmc = tmcMap.get(timestampMs);
      const ethCap = ethMap.get(timestampMs);

      if (tmc && ethCap !== undefined) {
        const btcDominance = (btcCap / tmc) * 100;
        const ethDominance = (ethCap / tmc) * 100;
        const othersDominance = Math.max(0, 100 - btcDominance - ethDominance);

        history.push({
          date: timestampMs,
          btcDominance: Number(btcDominance.toFixed(2)),
          ethDominance: Number(ethDominance.toFixed(2)),
          othersDominance: Number(othersDominance.toFixed(2)),
        });
      }
    }
    // Sort oldest to newest
    return history.sort((a, b) => a.date - b.date);
  } catch (e) {
    console.error("❌ Error fetching raw historical data:", e);
    throw e; // Re-throw the error for the caller to handle
  }
}

// --- PERSISTENCE LOGIC WRAPPERS ---

/**
 * 1. Loads the cached historical dominance data from AsyncStorage.
 */
export async function loadCachedHistoricalDominance(): Promise<HistoricalDominanceCache | null> {
  try {
    const data = await getJSONObject<HistoricalDominanceCache>(
      CRYPTO_DOMINANCE_HISTORY_CACHE_KEY
    );
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * 2. Fetches fresh historical data from CoinGecko, processes it, and persists the result.
 */
export async function fetchAndPersistHistoricalDominance(): Promise<HistoricalDominanceCache> {
  console.log("⚡ Fetching historical dominance data from CoinGecko...");

  // Attempt to fetch fresh data
  let rawData: HistoricalDominanceSnapshot[] | null = null;
  try {
    rawData = await fetchRawHistoricalData();
  } catch (e) {
    // Log the fetch failure, but proceed to update the timestamp below
    console.warn(
      "❌ Network fetch failed, proceeding to update cache timestamp."
    );
  }

  const newCache: HistoricalDominanceCache = {
    // Save the new data, or null if the network failed
    data: rawData,
    timestamp: Date.now(),
  };

  // Persist the new state (even if 'data' is null)
  await setJSONObject(CRYPTO_DOMINANCE_HISTORY_CACHE_KEY, newCache);

  if (rawData) {
    console.log(
      "✅ Successfully fetched and persisted historical dominance data."
    );
  } else {
    console.warn(
      "⚠️ Historical dominance data not fetched, but cache timestamp updated."
    );
  }

  return newCache;
}

/**
 * 3. The main query function that decides whether to use disk cache or re-fetch.
 * This is the function that your useQuery hook must call.
 */
export async function getHistoricalDominanceData(): Promise<
  HistoricalDominanceSnapshot[] | null
> {
  const cachedData = await loadCachedHistoricalDominance();
  const now = Date.now();

  // Condition Check: Cache exists, has data, AND is NOT STALE
  if (
    cachedData?.data &&
    now - cachedData.timestamp < CRYPTO_DOMINANCE_HISTORY_REFRESH_INTERVAL_MS
  ) {
    console.log("💾 Using cached historical dominance data (still fresh).");
    return cachedData.data;
  }

  // Cache is missing, stale, or fetchAndPersistRates failed last time
  try {
    const freshCache = await fetchAndPersistHistoricalDominance();
    return freshCache.data;
  } catch (error) {
    // If the new fetch failed, fall back to returning stale cache if available
    console.warn(
      "❌ Failed to fetch fresh historical dominance data. Falling back to stale cache if available."
    );
    if (cachedData?.data) {
      return cachedData.data;
    }
    // If no cache and fetch failed, re-throw the error
    throw error;
  }
}
