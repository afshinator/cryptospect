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
  currency: DEFAULT_CURRENCY, // <-- Default currency from constants/currency.ts

};

export const PREFERENCES_STORAGE_KEY = 'Settings';
export const PREFERENCES_QUERY_KEY = ['prefs'];  //  tanstack query