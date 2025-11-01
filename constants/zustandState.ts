import { fontScaleSize } from "./misc";

interface AppState {
  fontScale: fontScaleSize;
  isHydrated: boolean; // Flag to indicate if state has been loaded from storage
}

interface AppActions {
  updatefontScale: (size: fontScaleSize) => void;
  setHydrated: (hydrated: boolean) => void;
}


export type ZustandStore = AppState & AppActions;