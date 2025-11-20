// constants/coinLists.ts

import { CoinGeckoMarketData } from "./coinGecko";
import { SupportedCurrency } from "./currency";

// Coin item within a list (includes user notes + full API data)
export type CoinListItem = {
  coinId: string; // e.g., 'bitcoin'
  symbol: string; // e.g., 'BTC'
  name: string; // e.g., 'Bitcoin'
  notes: string; // User-created notes
  apiData?: CoinGeckoMarketData; // Full API response (optional, can be refreshed)
  addedAt: number; // Timestamp when added to list
  vsCurrency: SupportedCurrency; // From list of supported currencies in currency.ts
};

// A list of coins
export type CoinList = {
  id: string;
  name: string;
  coins: CoinListItem[];
  createdAt: number;
  updatedAt: number;
  notes: string; // User-created notes
};
