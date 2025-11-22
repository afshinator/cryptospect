// utils/searchedCoinsStorage.ts

/*
SearchedCoinsStorage - Stores coins found via CoinGecko search API that aren't in the main market cache.

These coins have partial data (id, name, symbol, image, market_cap_rank) but lack full market data
(price, volume, etc.) since they come from the search endpoint, not the markets endpoint.

Functions:
    loadSearchedCoins() - Loads all searched coins from storage
    saveSearchedCoin() - Saves/updates a single searched coin
    getSearchedCoin() - Gets a specific coin by ID
    removeSearchedCoin() - Removes a coin from storage (if it's now in main cache)
*/

import { CoinGeckoMarketData } from '@/constants/coinGecko';
import { SEARCHED_COINS_CACHE_KEY } from '@/constants/misc';
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';
import { logger } from '@/utils/logger';

export interface SearchedCoinWithTimestamp extends CoinGeckoMarketData {
  _lastUpdated?: number; // Timestamp when this coin data was last updated
}

export interface SearchedCoinsStorage {
  [coinId: string]: SearchedCoinWithTimestamp;
}

/**
 * Loads all searched coins from AsyncStorage
 */
/**
 * Loads all searched coins from AsyncStorage
 * Ensures all coins have timestamps (adds current timestamp if missing for backward compatibility)
 */
export async function loadSearchedCoins(): Promise<SearchedCoinsStorage> {
  try {
    const data = await getJSONObject<SearchedCoinsStorage>(SEARCHED_COINS_CACHE_KEY);
    if (!data) return {};
    
    // Ensure all coins have timestamps (backward compatibility)
    const now = Date.now();
    let needsSave = false;
    const updated: SearchedCoinsStorage = {};
    
    for (const [coinId, coinData] of Object.entries(data)) {
      if (!coinData._lastUpdated) {
        // Add timestamp for coins missing it
        updated[coinId] = { ...coinData, _lastUpdated: now };
        needsSave = true;
        logger(`🔍 [SearchedCoins] Added missing timestamp for ${coinId}`, 'log', 'debug');
      } else {
        updated[coinId] = coinData;
      }
    }
    
    // Save if we added any missing timestamps
    if (needsSave) {
      await setJSONObject(SEARCHED_COINS_CACHE_KEY, updated);
      logger(`💾 [SearchedCoins] Saved updated coins with timestamps`, 'log', 'debug');
    }
    
    return updated;
  } catch (e) {
    logger('❌🔍 [SearchedCoins] Error loading coins:', 'error', undefined, e);
    return {};
  }
}

/**
 * Helper function to check if new data is better than existing data
 * New data is "better" if it has non-null values where existing has null
 */
function isNewDataBetter(existing: SearchedCoinWithTimestamp, newData: CoinGeckoMarketData): boolean {
  // Priority: price_change_percentage_24h is the most important field
  if (existing.price_change_percentage_24h === null && newData.price_change_percentage_24h !== null) {
    return true;
  }
  // If existing has price_change, don't overwrite with null
  if (existing.price_change_percentage_24h !== null && newData.price_change_percentage_24h === null) {
    return false;
  }
  
  // Count non-null fields (excluding _lastUpdated) - if new data has more non-null fields, it's better
  const existingNonNullCount = Object.entries(existing)
    .filter(([key, value]) => key !== '_lastUpdated' && value !== null && value !== undefined).length;
  const newNonNullCount = Object.values(newData).filter(v => v !== null && v !== undefined).length;
  
  return newNonNullCount > existingNonNullCount;
}

/**
 * Merges new data with existing data, preserving non-null values
 * CRITICAL: NEVER overwrites existing non-null values with null values
 * Returns the merged data and whether any new data was actually merged
 */
function mergeCoinData(existing: SearchedCoinWithTimestamp, newData: CoinGeckoMarketData): { merged: SearchedCoinWithTimestamp; hasNewData: boolean } {
  const merged: SearchedCoinWithTimestamp = { ...existing };
  let hasNewData = false;
  
  // Track which fields we're protecting from null overwrites
  const protectedFields: string[] = [];
  
  // Only update fields where new data is better (non-null when existing is null, or both are non-null)
  Object.keys(newData).forEach((key) => {
    if (key === '_lastUpdated') return; // Skip timestamp field
    const newValue = newData[key as keyof CoinGeckoMarketData];
    const existingValue = existing[key as keyof CoinGeckoMarketData];
    
    // Always update if existing is null/undefined and new is not
    if ((existingValue === null || existingValue === undefined) && (newValue !== null && newValue !== undefined)) {
      merged[key as keyof CoinGeckoMarketData] = newValue;
      hasNewData = true;
    }
    // Update if both are non-null (new data takes precedence)
    else if (existingValue !== null && existingValue !== undefined && newValue !== null && newValue !== undefined) {
      // Only mark as new data if the value actually changed
      if (existingValue !== newValue) {
        merged[key as keyof CoinGeckoMarketData] = newValue;
        hasNewData = true;
      }
    }
    // CRITICAL: Never overwrite non-null with null - preserve existing value
    else if (existingValue !== null && existingValue !== undefined && (newValue === null || newValue === undefined)) {
      // Keep existing value (already in merged via spread)
      protectedFields.push(key);
      // Do NOT update hasNewData - we're preserving, not adding
    }
  });
  
  // Log if we protected any fields from null overwrites
  if (protectedFields.length > 0) {
    logger(`   └─ 🛡️ Protected ${protectedFields.length} fields from null overwrite: ${protectedFields.join(', ')}`, 'log', 'debug');
  }
  
  // Update timestamp if we actually merged any new data
  if (hasNewData) {
    merged._lastUpdated = Date.now();
  } else {
    // Preserve existing timestamp - don't update if no new data was merged
    merged._lastUpdated = existing._lastUpdated || Date.now();
  }
  
  return { merged, hasNewData };
}

/**
 * Saves a searched coin to storage
 * NEVER overwrites existing non-null data with null values
 * Only updates fields where new data is non-null and existing is null, or both are non-null
 * Always preserves timestamps - only updates timestamp when new data is actually merged
 * @param coin - The coin data to save (from search API or full market data)
 */
export async function saveSearchedCoin(coin: CoinGeckoMarketData): Promise<void> {
  try {
    const existing = await loadSearchedCoins();
    // Normalize coin ID to lowercase for consistent lookup
    const normalizedId = coin.id.toLowerCase();
    const existingCoin = existing[normalizedId];
    const now = Date.now();
    
    if (existingCoin) {
      // Merge intelligently - preserve non-null values from existing, never overwrite with nulls
      const { merged, hasNewData } = mergeCoinData(existingCoin, coin);
      
      // CRITICAL: Preserve existing timestamp if no new data was merged
      // Only update timestamp when we actually merged new data
      if (!hasNewData) {
        merged._lastUpdated = existingCoin._lastUpdated || now;
      }
      
      // Ensure ID is normalized
      merged.id = normalizedId;
      
      existing[normalizedId] = merged;
      
      if (hasNewData) {
        const timestamp = merged._lastUpdated ? new Date(merged._lastUpdated).toISOString() : 'unknown';
        logger(`✅🔍 [SearchedCoins] Updated coin: ${coin.name} (${coin.symbol})`, 'log', 'debug');
        logger(`   └─ New data merged at: ${timestamp}`, 'log', 'debug');
        logger(`   └─ Preserved existing non-null fields`, 'log', 'debug');
      } else {
        const preservedTimestamp = existingCoin._lastUpdated ? new Date(existingCoin._lastUpdated).toISOString() : 'unknown';
        logger(`✅🔍 [SearchedCoins] Coin: ${coin.name} (${coin.symbol}) - no new data to merge`, 'log', 'debug');
        logger(`   └─ Preserved existing data (timestamp: ${preservedTimestamp})`, 'log', 'debug');
        logger(`   └─ Prevented overwriting with null values`, 'log', 'debug');
      }
    } else {
      // New coin, save it with timestamp
      existing[normalizedId] = { ...coin, id: normalizedId, _lastUpdated: now };
      logger(`✅🔍 [SearchedCoins] Saved new coin: ${coin.name} (${coin.symbol})`, 'log', 'debug');
      logger(`   └─ ID: ${normalizedId}`, 'log', 'debug');
      logger(`   └─ Timestamp: ${new Date(now).toISOString()}`, 'log', 'debug');
    }
    
    await setJSONObject(SEARCHED_COINS_CACHE_KEY, existing);
  } catch (e) {
    logger('❌🔍 [SearchedCoins] Error saving coin:', 'error', undefined, e);
    throw e;
  }
}

/**
 * Gets a specific searched coin by ID
 * @param coinId - The coin ID to look up (will be normalized to lowercase)
 */
export async function getSearchedCoin(coinId: string): Promise<SearchedCoinWithTimestamp | null> {
  try {
    const allCoins = await loadSearchedCoins();
    // Normalize ID to lowercase for lookup
    const normalizedId = coinId.toLowerCase();
    return allCoins[normalizedId] || null;
  } catch (e) {
    logger('❌🔍 Error getting searched coin:', 'error', undefined, e);
    return null;
  }
}

/**
 * Removes a coin from searched coins storage
 * (Useful when a coin is now available in the main market cache)
 * @param coinId - The coin ID to remove
 */
export async function removeSearchedCoin(coinId: string): Promise<void> {
  try {
    const existing = await loadSearchedCoins();
    if (existing[coinId]) {
      delete existing[coinId];
      await setJSONObject(SEARCHED_COINS_CACHE_KEY, existing);
      logger(`✅🔍 Removed searched coin: ${coinId}`, 'log', 'debug');
    }
  } catch (e) {
    logger('❌🔍 Error removing searched coin:', 'error', undefined, e);
    throw e;
  }
}

/**
 * Gets all searched coins as an array
 */
export async function getAllSearchedCoins(): Promise<SearchedCoinWithTimestamp[]> {
  const storage = await loadSearchedCoins();
  return Object.values(storage);
}

