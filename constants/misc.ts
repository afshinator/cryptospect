// constants/misc.ts

import { DEFAULT_CURRENCY, SupportedCurrency } from "./currency";

// Re-export API config constants for backward compatibility
export {
  CRYPTO_MARKET_REFRESH_INTERVAL_MS,
  CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS,
} from "./apiConfig";

export type LightDarkMode = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';

export interface UserPreferences {
  fontScale: number;
  lightDarkMode: LightDarkMode;
  currency: SupportedCurrency;
  defaultImportExportDirectory?: string; // Default directory path for CSV import/export
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontScale: 1.0,
  lightDarkMode: 'system',
  currency: DEFAULT_CURRENCY,
  defaultImportExportDirectory: undefined, // No default, user must set
};

// User Preferences
export const PREFERENCES_STORAGE_KEY = 'Settings';
export const PREFERENCES_QUERY_KEY = ['prefs'];

// Crypto Market Data (CoinGecko /coins/markets)
export const CRYPTO_MARKET_CACHE_KEY = 'CryptoMarketSnapshot';
export const CRYPTO_MARKET_QUERY_KEY = ['cryptoMarket'];
// Refresh interval moved to constants/apiConfig.ts

// Crypto Overview Data (CoinGecko /global)
export const CRYPTO_OVERVIEW_CACHE_KEY = 'CryptoOverviewSnapshot';
export const CRYPTO_OVERVIEW_QUERY_KEY = ['cryptoOverview'];
// Refresh interval moved to constants/apiConfig.ts

// Backend Historical Dominance (180 days from Vercel backend)
export const BACKEND_DOMINANCE_QUERY_KEY = ['backendDominance'];

// Coin Lists
export const COIN_LISTS_STORAGE_KEY = 'CoinLists';
export const COIN_LISTS_QUERY_KEY = ['coinLists'];

// Exchange Rates
export const EXCHANGE_RATE_CACHE_KEY = 'ExchangeRates';
export const EXCHANGE_RATES_QUERY_KEY = ['exchangeRates'];

// Stablecoin Data
export const STABLECOIN_DATA_CACHE_KEY = 'StablecoinData';
export const STABLECOIN_DATA_QUERY_KEY = ['stablecoinData'];

// Saved Outlier Coins (coins not in main market cache, fetched from backend/CoinGecko)
export const SAVED_OUTLIER_COINS_CACHE_KEY = 'SavedOutlierCoins';
export const SAVED_OUTLIER_COINS_QUERY_KEY = ['savedOutlierCoins'];