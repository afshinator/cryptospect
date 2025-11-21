// utils/coinFilters.ts
// Filter system for analyzing coins across all lists
// Structured to allow easy addition of new filters

import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { CoinList, CoinListItem } from "@/constants/coinLists";

/**
 * Represents a list that contains a coin
 */
export interface CoinListInfo {
  listId: string;
  listName: string;
}

/**
 * Represents a coin match result with context about all lists it appears in
 */
export interface FilteredCoinMatch {
  coin: CoinListItem;
  lists: CoinListInfo[]; // All lists this coin appears in
  marketData: CoinGeckoMarketData;
}

/**
 * Filter definition - the logic for matching coins
 */
export interface CoinFilter {
  id: string;
  name: string;
  description: string;
  /**
   * Returns true if the coin matches this filter criteria
   * @param marketData - The market data for the coin
   */
  matches: (marketData: CoinGeckoMarketData) => boolean;
}

/**
 * All available filters
 */
export const AVAILABLE_FILTERS: CoinFilter[] = [
  {
    id: "discounted",
    name: "Discounted",
    description: "Coins trading >70% below ATH",
    matches: (marketData) => {
      // ath_change_percentage is negative when below ATH
      // -70% means 70% below ATH
      return (
        marketData.ath_change_percentage !== null &&
        marketData.ath_change_percentage < -70
      );
    },
  },
  {
    id: "recent_runner",
    name: "Recent Runner",
    description: "Coins with 24h price change >20%",
    matches: (marketData) => {
      return (
        marketData.price_change_percentage_24h !== null &&
        marketData.price_change_percentage_24h > 20
      );
    },
  },
];

/**
 * Get a filter by ID
 */
export function getFilterById(filterId: string): CoinFilter | undefined {
  return AVAILABLE_FILTERS.find((f) => f.id === filterId);
}

/**
 * Apply filters to all coins across all lists
 * Returns separate results for each filter, or unified results when AND logic is enabled
 * @param lists - All coin lists
 * @param marketDataMap - Map of coinId -> CoinGeckoMarketData
 * @param activeFilterIds - Array of filter IDs to apply
 * @param andFilterIds - Array of filter IDs that should use AND logic (unified results)
 * @returns Object with filterId -> FilteredCoinMatch[] mapping, or unified results
 */
export function applyFilters(
  lists: CoinList[],
  marketDataMap: Map<string, CoinGeckoMarketData>,
  activeFilterIds: string[],
  andFilterIds: string[] = []
): { [filterId: string]: FilteredCoinMatch[] } | FilteredCoinMatch[] {
  if (activeFilterIds.length === 0) {
    return {};
  }

  const filters = activeFilterIds
    .map((id) => getFilterById(id))
    .filter((f): f is CoinFilter => f !== undefined);

  if (filters.length === 0) {
    return {};
  }

  // If AND logic is enabled for any filters, return unified results
  const hasAndLogic = andFilterIds.length > 0 && andFilterIds.some(id => activeFilterIds.includes(id));
  
  if (hasAndLogic) {
    // Get filters that have AND enabled
    const andFilters = filters.filter(f => andFilterIds.includes(f.id));
    const otherFilters = filters.filter(f => !andFilterIds.includes(f.id));
    
    // Use a Map to group coins by coinId and collect all lists they appear in
    const coinMatchesMap = new Map<
      string,
      {
        coin: CoinListItem;
        marketData: CoinGeckoMarketData;
        lists: CoinListInfo[];
      }
    >();

    // Iterate through all lists and all coins
    for (const list of lists) {
      for (const coin of list.coins) {
        const marketData = marketDataMap.get(coin.coinId);
        if (!marketData) {
          continue; // Skip coins without market data
        }

        // Check if coin matches ALL AND filters
        const matchesAndFilters = andFilters.length === 0 || andFilters.every((filter) =>
          filter.matches(marketData)
        );

        // Check if coin matches ANY of the other filters (OR logic)
        const matchesOtherFilters = otherFilters.length === 0 || otherFilters.some((filter) =>
          filter.matches(marketData)
        );

        // If we have both AND and other filters, coin must match AND filters AND at least one other filter
        // If we only have AND filters, coin must match all of them
        // If we only have other filters, coin must match at least one
        const shouldInclude = 
          (andFilters.length > 0 && otherFilters.length > 0 && matchesAndFilters && matchesOtherFilters) ||
          (andFilters.length > 0 && otherFilters.length === 0 && matchesAndFilters) ||
          (andFilters.length === 0 && otherFilters.length > 0 && matchesOtherFilters);

        if (shouldInclude) {
          const existing = coinMatchesMap.get(coin.coinId);
          if (existing) {
            // Coin already found, just add this list to the lists array
            existing.lists.push({
              listId: list.id,
              listName: list.name,
            });
          } else {
            // First time seeing this coin, create new entry
            coinMatchesMap.set(coin.coinId, {
              coin,
              marketData,
              lists: [
                {
                  listId: list.id,
                  listName: list.name,
                },
              ],
            });
          }
        }
      }
    }

    // Convert map to array for unified results
    const matches: FilteredCoinMatch[] = Array.from(coinMatchesMap.values()).map(
      (entry) => ({
        coin: entry.coin,
        lists: entry.lists,
        marketData: entry.marketData,
      })
    );

    return matches;
  }

  // Default: Return separate results for each filter (OR logic)
  const results: { [filterId: string]: FilteredCoinMatch[] } = {};

  for (const filter of filters) {
    const coinMatchesMap = new Map<
      string,
      {
        coin: CoinListItem;
        marketData: CoinGeckoMarketData;
        lists: CoinListInfo[];
      }
    >();

    // Iterate through all lists and all coins
    for (const list of lists) {
      for (const coin of list.coins) {
        const marketData = marketDataMap.get(coin.coinId);
        if (!marketData) {
          continue; // Skip coins without market data
        }

        // Check if coin matches this specific filter
        if (filter.matches(marketData)) {
          const existing = coinMatchesMap.get(coin.coinId);
          if (existing) {
            // Coin already found, just add this list to the lists array
            existing.lists.push({
              listId: list.id,
              listName: list.name,
            });
          } else {
            // First time seeing this coin, create new entry
            coinMatchesMap.set(coin.coinId, {
              coin,
              marketData,
              lists: [
                {
                  listId: list.id,
                  listName: list.name,
                },
              ],
            });
          }
        }
      }
    }

    // Convert map to array for this filter
    results[filter.id] = Array.from(coinMatchesMap.values()).map(
      (entry) => ({
        coin: entry.coin,
        lists: entry.lists,
        marketData: entry.marketData,
      })
    );
  }

  return results;
}

/**
 * Create a map of coinId -> market data for efficient lookup
 */
export function createMarketDataMap(
  marketData: CoinGeckoMarketData[] | null | undefined
): Map<string, CoinGeckoMarketData> {
  const map = new Map<string, CoinGeckoMarketData>();
  if (!marketData) {
    return map;
  }

  for (const data of marketData) {
    map.set(data.id, data);
  }

  return map;
}

