// constants/stores.ts

import { DEFAULT_CURRENCY } from './currency';

// AsyncStorage keys
export const PREFS_STORAGE_KEY = 'prefs';

// Default preference values
export const DEFAULT_PREFS = {
  theme: 'default',
  fontScale: 1.0,
  lightDarkMode: 'system' as const,
  currency: DEFAULT_CURRENCY,
  compactMode: false,
} as const;

