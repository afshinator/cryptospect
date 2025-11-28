// stores/prefsStore.ts

import { SupportedCurrency } from '@/constants/currency';
import { DEFAULT_PREFS, PREFS_STORAGE_KEY } from '@/constants/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PrefsState {
  theme: string;
  fontScale: number;
  lightDarkMode: 'system' | 'light' | 'dark';
  currency: SupportedCurrency;
  compactMode: boolean;
  
  // Actions
  setTheme: (theme: string) => void;
  setFontScale: (fontScale: number) => void;
  setLightDarkMode: (mode: 'system' | 'light' | 'dark') => void;
  setCurrency: (currency: SupportedCurrency) => void;
  setCompactMode: (compactMode: boolean) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      // Initial state
      theme: DEFAULT_PREFS.theme,
      fontScale: DEFAULT_PREFS.fontScale,
      lightDarkMode: DEFAULT_PREFS.lightDarkMode,
      currency: DEFAULT_PREFS.currency,
      compactMode: DEFAULT_PREFS.compactMode,

      // Actions
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
      setLightDarkMode: (lightDarkMode) => set({ lightDarkMode }),
      setCurrency: (currency) => set({ currency }),
      setCompactMode: (compactMode) => set({ compactMode }),
    }),
    {
      name: PREFS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

