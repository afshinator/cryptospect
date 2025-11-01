// utils/appState.ts

import { ZustandStore } from '@/constants/zustandState';
import { create } from 'zustand';

const useAppSettings = create<ZustandStore>((set) => ({
  // State 
  fontScale: 'default', // Default value
  isHydrated: false,

  // Actions
  updatefontScale: (size) => set({ fontScale: size }),
  setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
}));

export default useAppSettings;