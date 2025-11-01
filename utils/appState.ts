// utils/appState.ts
import { ASYNC_STORAGE_KEYS, fontScaleSize } from '@/constants/misc';
import { ZustandStore } from '@/constants/zustandState';
import { create } from 'zustand';
import { getItem, setItem } from './asyncStorage';


export const useAppState = create<ZustandStore>((set) => ({
  // State 
  fontScale: 'default',
  isHydrated: false,

  // Actions
  updatefontScale: (size) => set({ fontScale: size }),
  setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
}));

export const initializeAppStateFromStorage = async() => {
  const {
    updatefontScale,
    setHydrated,
    fontScale: defaultFontScale,
  } = useAppState.getState();

  try {
    // 1. Fetch all items concurrently
    const values = await Promise.all(
      ASYNC_STORAGE_KEYS.map((key) => getItem(key))
    );

    // 2. Map values back to their original keys
    const storedState: Record<string, string | null> = {};
    ASYNC_STORAGE_KEYS.forEach((key, index) => {
      storedState[key] = values[index];
    });


    // 3. Process each key to check for existence, initialize if needed, and update Zustand

    // So far the only state we have is the fontscale
    let fontScaleValue = storedState["fontScale"];
    // const defaultFontScale is now retrieved from useAppSettings.getState()

    if (fontScaleValue === null) {
      fontScaleValue = defaultFontScale;    // Key is missing: set to default value retrieved from the store

      // Persist the default value back to AsyncStorage
      await setItem("fontScale", defaultFontScale);
      console.log(
        `🗃️ AsyncStorage: Initialized missing key 'fontScale' with default value: ${defaultFontScale}`
      );
    }

    if (fontScaleValue) {
      updatefontScale(fontScaleValue as fontScaleSize);
      console.log(`🗃️ Initialized Font Scaling: ${fontScaleValue}`);
    }

    setHydrated(true);
  } catch (error) {
    console.error("🗃️🚨 Failed to initialize app state from AsyncStorage:", error);
    // Ensure hydration completes even on error
    setHydrated(true);
  }

}
