// utils/stablecoinStorage.ts

/*
StablecoinData interface - Stores individual stablecoin information (symbol, name, market cap, price, etc.)

StablecoinSnapshot interface - Complete snapshot with:
    timestamp - When the data was saved
    totalMarketCap - Total crypto market cap
    totalMarketCapPercentage - Stablecoin dominance percentage
    foundStablecoins - Array of symbols found
    missingStablecoins - Array of symbols not found
    stablecoins - Full array of all stablecoin data from CryptoMarketSnapshot
    calculationMethod - Whether using 'market_data' or 'overview_data' 

Functions:
    loadCachedStablecoinData() - Loads data from storage
    saveStablecoinData() - Saves data to storage
    extractAndSaveStablecoinData() - Extracts stablecoins from CryptoMarketSnapshot and saves
    getStablecoinData() - Convenience function to get latest data
*/

import { CoinGeckoMarketData } from '@/constants/coinGecko';
import { STABLECOIN_DATA_CACHE_KEY } from '@/constants/misc';
import { getJSONObject, setJSONObject } from '@/utils/asyncStorage';

export interface StablecoinData {
  symbol: string;
  name: string;
  id: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  last_updated: string | null;
}

export interface StablecoinSnapshot {
  timestamp: number;
  totalMarketCap: number;
  totalMarketCapPercentage: number;
  foundStablecoins: string[];
  missingStablecoins: string[];
  stablecoins: StablecoinData[];
  calculationMethod: 'market_data' | 'overview_data';
}

/**
 * Loads cached stablecoin data from AsyncStorage
 */
export async function loadCachedStablecoinData(): Promise<StablecoinSnapshot | null> {
  try {
    const data = await getJSONObject<StablecoinSnapshot>(STABLECOIN_DATA_CACHE_KEY);
    return data;
  } catch (e) {
    console.error('❌💲 Error loading cached stablecoin data:', e);
    return null;
  }
}

/**
 * Saves stablecoin data to AsyncStorage
 */
export async function saveStablecoinData(data: StablecoinSnapshot): Promise<void> {
  try {
    await setJSONObject(STABLECOIN_DATA_CACHE_KEY, data);
    console.log('✅💲 Successfully saved stablecoin data');
  } catch (e) {
    console.error('❌💲 Error saving stablecoin data:', e);
    throw e;
  }
}

/**
 * Extracts and saves stablecoin data from CryptoMarketSnapshot
 * @param cryptoMarket - The market snapshot containing coin data
 * @param totalMarketCap - Total market cap in USD from overview data
 * @param foundStablecoins - Array of stablecoin symbols found
 * @param missingStablecoins - Array of stablecoin symbols not found
 * @param calculationMethod - Whether using market data or overview data
 */
export async function extractAndSaveStablecoinData(
  cryptoMarket: { data: CoinGeckoMarketData[] | null } | null | undefined,
  totalMarketCap: number,
  totalMarketCapPercentage: number,
  foundStablecoins: string[],
  missingStablecoins: string[],
  calculationMethod: 'market_data' | 'overview_data'
): Promise<void> {
  const stablecoins: StablecoinData[] = [];

  if (cryptoMarket?.data) {
    const stablecoinSymbolsLower = new Set(foundStablecoins.map(s => s.toLowerCase()));

    for (const coin of cryptoMarket.data) {
      if (coin.symbol && stablecoinSymbolsLower.has(coin.symbol.toLowerCase())) {
        stablecoins.push({
          symbol: coin.symbol,
          name: coin.name,
          id: coin.id,
          image: coin.image,
          current_price: coin.current_price,
          market_cap: coin.market_cap,
          market_cap_rank: coin.market_cap_rank,
          total_volume: coin.total_volume,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          market_cap_change_percentage_24h: coin.market_cap_change_percentage_24h,
          circulating_supply: coin.circulating_supply,
          total_supply: coin.total_supply,
          last_updated: coin.last_updated,
        });
      }
    }
  }

  const snapshot: StablecoinSnapshot = {
    timestamp: Date.now(),
    totalMarketCap,
    totalMarketCapPercentage,
    foundStablecoins,
    missingStablecoins,
    stablecoins,
    calculationMethod,
  };

  await saveStablecoinData(snapshot);
}

/**
 * Gets the latest stablecoin data
 */
export async function getStablecoinData(): Promise<StablecoinSnapshot | null> {
  return loadCachedStablecoinData();
}

