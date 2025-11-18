// constants/misc.ts

import { DEFAULT_CURRENCY, SupportedCurrency } from "./currency";

export type LightDarkMode = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';

export interface UserPreferences {
  fontScale: number;
  lightDarkMode: LightDarkMode;
  currency: SupportedCurrency;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  fontScale: 1.0,
  lightDarkMode: 'system',
  currency: DEFAULT_CURRENCY,
};

// User Preferences
export const PREFERENCES_STORAGE_KEY = 'Settings';
export const PREFERENCES_QUERY_KEY = ['prefs'];

// Crypto Market Data (CoinGecko /coins/markets)
export const CRYPTO_MARKET_CACHE_KEY = 'CryptoMarketSnapshot';
export const CRYPTO_MARKET_QUERY_KEY = ['cryptoMarket'];
export const CRYPTO_MARKET_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Crypto Overview Data (CoinGecko /global)
export const CRYPTO_OVERVIEW_CACHE_KEY = 'CryptoOverviewSnapshot';
export const CRYPTO_OVERVIEW_QUERY_KEY = ['cryptoOverview'];
export const CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Crypto historical dominance constants
export const CRYPTO_DOMINANCE_HISTORY_CACHE_KEY = 'DominanceHistorySnapshot';
export const CRYPTO_DOMINANCE_HISTORY_QUERY_KEY = ["dominanceHistory"];
export const CRYPTO_DOMINANCE_HISTORY_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;