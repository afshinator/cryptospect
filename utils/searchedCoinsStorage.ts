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

export interface SearchedCoinWithTimestamp extends CoinGeckoMarketData {
  _lastUpdated?: number; // Timestamp when this coin data was last updated
}

export interface SearchedCoinsStorage {
  [coinId: string]: SearchedCoinWithTimestamp;
}

/**
 * Loads all searched coins from AsyncStorage
 */
export async function loadSearchedCoins(): Promise<SearchedCoinsStorage> {
  try {
    const data = await getJSONObject<SearchedCoinsStorage>(SEARCHED_COINS_CACHE_KEY);
    return data || {};
  } catch (e) {
    console.error('❌🔍 Error loading searched coins:', e);
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
 * Returns the merged data and whether any new data was actually merged
 */
function mergeCoinData(existing: SearchedCoinWithTimestamp, newData: CoinGeckoMarketData): { merged: SearchedCoinWithTimestamp; hasNewData: boolean } {
  const merged: SearchedCoinWithTimestamp = { ...existing };
  let hasNewData = false;
  
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
    // Never overwrite non-null with null
    // (existing value is preserved, which is already in merged)
  });
  
  // Update timestamp if we actually merged any new data
  if (hasNewData) {
    merged._lastUpdated = Date.now();
  } else {
    // Preserve existing timestamp
    merged._lastUpdated = existing._lastUpdated;
  }
  
  return { merged, hasNewData };
}

/**
 * Saves a searched coin to storage
 * Only overwrites existing data if new data is better (has more non-null fields, especially price_change_percentage_24h)
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
      // Merge intelligently - preserve non-null values from existing
      const { merged, hasNewData } = mergeCoinData(existingCoin, coin);
      existing[normalizedId] = { ...merged, id: normalizedId };
      
      if (hasNewData) {
        const timestamp = merged._lastUpdated ? new Date(merged._lastUpdated).toISOString() : 'unknown';
        console.log(`✅🔍 Updated searched coin: ${coin.name} (${coin.symbol}) with new data at ${timestamp}`);
      } else {
        console.log(`✅🔍 Searched coin: ${coin.name} (${coin.symbol}) - no new data to merge, preserved existing`);
      }
    } else {
      // New coin, save it with timestamp
      existing[normalizedId] = { ...coin, id: normalizedId, _lastUpdated: now };
      console.log(`✅🔍 Saved new searched coin: ${coin.name} (${coin.symbol}) with ID: ${normalizedId} at ${new Date(now).toISOString()}`);
    }
    
    await setJSONObject(SEARCHED_COINS_CACHE_KEY, existing);
  } catch (e) {
    console.error('❌🔍 Error saving searched coin:', e);
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
    console.error('❌🔍 Error getting searched coin:', e);
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
      console.log(`✅🔍 Removed searched coin: ${coinId}`);
    }
  } catch (e) {
    console.error('❌🔍 Error removing searched coin:', e);
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

