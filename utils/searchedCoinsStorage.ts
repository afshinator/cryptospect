// utils/searchedCoinsStorage.ts

/*
SavedOutlierCoinsStorage - Stores coins that aren't in the main CryptoMarketSnapshot cache.

These are "outlier" coins that users have in their lists but aren't in the top ~1250 coins
that are fetched in the main market data. They can come from:
1. CoinGecko search API (partial data: id, name, symbol, image, market_cap_rank)
2. Backend API /api/coins/{id} (full market data)
3. CoinGecko API /coins/{id} (full market data, fallback if backend fails)

The storage intelligently merges data, preserving non-null values and never overwriting
existing data with nulls. Each coin has a timestamp (_lastUpdated) to track when it was last fetched.

Functions:
    loadSavedOutlierCoins() - Loads all saved outlier coins from storage
    saveSavedOutlierCoin() - Saves/updates a single outlier coin
    getSavedOutlierCoin() - Gets a specific coin by ID
    removeSavedOutlierCoin() - Removes a coin from storage
    getAllSavedOutlierCoins() - Returns all coins as an array
*/

import { CoinGeckoMarketData } from '@/constants/coinGecko';
import { SAVED_OUTLIER_COINS_CACHE_KEY } from '@/constants/misc';
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';
import { logger } from '@/utils/logger';

export interface SavedOutlierCoinWithTimestamp extends CoinGeckoMarketData {
  _lastUpdated?: number; // Timestamp when this coin data was last updated
}

export interface SavedOutlierCoinsStorage {
  [coinId: string]: SavedOutlierCoinWithTimestamp;
}

// Legacy type aliases for backward compatibility during migration
export type SearchedCoinWithTimestamp = SavedOutlierCoinWithTimestamp;
export type SearchedCoinsStorage = SavedOutlierCoinsStorage;

/**
 * Loads all saved outlier coins from AsyncStorage
 * Ensures all coins have timestamps (adds current timestamp if missing for backward compatibility)
 */
export async function loadSavedOutlierCoins(): Promise<SavedOutlierCoinsStorage> {
  try {
    const data = await getJSONObject<SavedOutlierCoinsStorage>(SAVED_OUTLIER_COINS_CACHE_KEY);
    if (!data) return {};
    
    // Ensure all coins have timestamps (backward compatibility)
    const now = Date.now();
    let needsSave = false;
    const updated: SavedOutlierCoinsStorage = {};
    
    for (const [coinId, coinData] of Object.entries(data)) {
      if (!coinData._lastUpdated) {
        // Add timestamp for coins missing it
        updated[coinId] = { ...coinData, _lastUpdated: now };
        needsSave = true;
        logger(`🔍 [SavedOutlierCoins] Added missing timestamp for ${coinId}`, 'log', 'debug');
      } else {
        updated[coinId] = coinData;
      }
    }
    
    // Save if we added any missing timestamps
    if (needsSave) {
      await setJSONObject(SAVED_OUTLIER_COINS_CACHE_KEY, updated);
      logger(`💾 [SavedOutlierCoins] Saved updated coins with timestamps`, 'log', 'debug');
    }
    
    return updated;
  } catch (e) {
    logger('❌🔍 [SavedOutlierCoins] Error loading coins:', 'error', undefined, e);
    return {};
  }
}

// Legacy function alias for backward compatibility
export const loadSearchedCoins = loadSavedOutlierCoins;

/**
 * Helper function to check if new data is better than existing data
 * New data is "better" if it has non-null values where existing has null
 */
function isNewDataBetter(existing: SavedOutlierCoinWithTimestamp, newData: CoinGeckoMarketData): boolean {
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
function mergeCoinData(existing: SavedOutlierCoinWithTimestamp, newData: CoinGeckoMarketData): { merged: SavedOutlierCoinWithTimestamp; hasNewData: boolean } {
  const merged: SavedOutlierCoinWithTimestamp = { ...existing };
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
 * Saves a saved outlier coin to storage
 * NEVER overwrites existing non-null data with null values
 * Only updates fields where new data is non-null and existing is null, or both are non-null
 * Always preserves timestamps - only updates timestamp when new data is actually merged
 * @param coin - The coin data to save (from search API, backend API, or CoinGecko API)
 */
export async function saveSavedOutlierCoin(coin: CoinGeckoMarketData): Promise<void> {
  try {
    const existing = await loadSavedOutlierCoins();
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
        logger(`✅🔍 [SavedOutlierCoins] Updated coin: ${coin.name} (${coin.symbol})`, 'log', 'debug');
        logger(`   └─ New data merged at: ${timestamp}`, 'log', 'debug');
        logger(`   └─ Preserved existing non-null fields`, 'log', 'debug');
      } else {
        const preservedTimestamp = existingCoin._lastUpdated ? new Date(existingCoin._lastUpdated).toISOString() : 'unknown';
        logger(`✅🔍 [SavedOutlierCoins] Coin: ${coin.name} (${coin.symbol}) - no new data to merge`, 'log', 'debug');
        logger(`   └─ Preserved existing data (timestamp: ${preservedTimestamp})`, 'log', 'debug');
        logger(`   └─ Prevented overwriting with null values`, 'log', 'debug');
      }
    } else {
      // New coin, save it with timestamp
      existing[normalizedId] = { ...coin, id: normalizedId, _lastUpdated: now };
      logger(`✅🔍 [SavedOutlierCoins] Saved new coin: ${coin.name} (${coin.symbol})`, 'log', 'debug');
      logger(`   └─ ID: ${normalizedId}`, 'log', 'debug');
      logger(`   └─ Timestamp: ${new Date(now).toISOString()}`, 'log', 'debug');
    }
    
    await setJSONObject(SAVED_OUTLIER_COINS_CACHE_KEY, existing);
  } catch (e) {
    logger('❌🔍 [SavedOutlierCoins] Error saving coin:', 'error', undefined, e);
    throw e;
  }
}

// Legacy function alias for backward compatibility
export const saveSearchedCoin = saveSavedOutlierCoin;

/**
 * Gets a specific saved outlier coin by ID
 * @param coinId - The coin ID to look up (will be normalized to lowercase)
 */
export async function getSavedOutlierCoin(coinId: string): Promise<SavedOutlierCoinWithTimestamp | null> {
  try {
    const allCoins = await loadSavedOutlierCoins();
    // Normalize ID to lowercase for lookup
    const normalizedId = coinId.toLowerCase();
    return allCoins[normalizedId] || null;
  } catch (e) {
    logger('❌🔍 Error getting saved outlier coin:', 'error', undefined, e);
    return null;
  }
}

// Legacy function alias for backward compatibility
export const getSearchedCoin = getSavedOutlierCoin;

/**
 * Removes a coin from saved outlier coins storage
 * (Useful when a coin is now available in the main market cache)
 * @param coinId - The coin ID to remove
 */
export async function removeSavedOutlierCoin(coinId: string): Promise<void> {
  try {
    const existing = await loadSavedOutlierCoins();
    const normalizedId = coinId.toLowerCase();
    if (existing[normalizedId]) {
      delete existing[normalizedId];
      await setJSONObject(SAVED_OUTLIER_COINS_CACHE_KEY, existing);
      logger(`✅🔍 Removed saved outlier coin: ${normalizedId}`, 'log', 'debug');
    }
  } catch (e) {
    logger('❌🔍 Error removing saved outlier coin:', 'error', undefined, e);
    throw e;
  }
}

// Legacy function alias for backward compatibility
export const removeSearchedCoin = removeSavedOutlierCoin;

/**
 * Gets all saved outlier coins as an array
 */
export async function getAllSavedOutlierCoins(): Promise<SavedOutlierCoinWithTimestamp[]> {
  const storage = await loadSavedOutlierCoins();
  return Object.values(storage);
}

// Legacy function alias for backward compatibility
export const getAllSearchedCoins = getAllSavedOutlierCoins;
