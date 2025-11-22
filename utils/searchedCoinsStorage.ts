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

export interface SearchedCoinsStorage {
  [coinId: string]: CoinGeckoMarketData;
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
 * Saves a searched coin to storage
 * @param coin - The coin data to save (from search API)
 */
export async function saveSearchedCoin(coin: CoinGeckoMarketData): Promise<void> {
  try {
    const existing = await loadSearchedCoins();
    existing[coin.id] = coin;
    await setJSONObject(SEARCHED_COINS_CACHE_KEY, existing);
    console.log(`✅🔍 Saved searched coin: ${coin.name} (${coin.symbol})`);
  } catch (e) {
    console.error('❌🔍 Error saving searched coin:', e);
    throw e;
  }
}

/**
 * Gets a specific searched coin by ID
 * @param coinId - The coin ID to look up
 */
export async function getSearchedCoin(coinId: string): Promise<CoinGeckoMarketData | null> {
  try {
    const allCoins = await loadSearchedCoins();
    return allCoins[coinId] || null;
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
export async function getAllSearchedCoins(): Promise<CoinGeckoMarketData[]> {
  const storage = await loadSearchedCoins();
  return Object.values(storage);
}

