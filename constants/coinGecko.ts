// constants/coinGecko.ts

import { SupportedCurrency } from "./currency";

// API Constants
export const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

// Endpoint Paths (relative to the base URL)
export const COINGECKO_GLOBAL_PATH = "/global";
export const COINGECKO_SIMPLE_PRICE_PATH = "/simple/price";
export const COINGECKO_COINS_MARKETS_PATH = "/coins/markets"; // Use the path only

// Endpoint for global market data (Full URL is now easy to construct)
export const COINGECKO_GLOBAL_DATA_ENDPOINT = `${COINGECKO_BASE_URL}${COINGECKO_GLOBAL_PATH}`;

// Endpoint for market data, used for getting icon URLs and current prices
export const COINGECKO_COINS_MARKETS_ENDPOINT = `${COINGECKO_BASE_URL}${COINGECKO_COINS_MARKETS_PATH}`;

// API Parameters for /coins/markets
export const MARKET_DATA_PER_PAGE = 250; // Free tier max
export const MARKET_DATA_PAGES_TO_FETCH = 5; // Number of pages to fetch (1 pages = 250 coins)
export const MARKET_DATA_ORDER = 'market_cap_desc';
export const MARKET_DATA_SPARKLINE = false;


// CoinGecko API response type for coins/markets endpoint
export type CoinGeckoMarketData = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  market_cap_change_24h: number | null;
  market_cap_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  ath_date: string | null;
  atl: number | null;
  atl_change_percentage: number | null;
  atl_date: string | null;
  roi: any | null;
  last_updated: string | null;
};

export type CryptoMarketSnapshot = {
  data: CoinGeckoMarketData[] | null;
  timestamp: number;
  currency: SupportedCurrency;
};

// CoinGecko API response type for /global endpoint
export type CoinGeckoGlobalData = {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
    market_cap_percentage: { [key: string]: number };
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
};

export type CryptoOverviewSnapshot = {
  data: CoinGeckoGlobalData | null;
  timestamp: number;
};