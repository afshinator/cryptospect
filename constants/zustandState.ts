import { CurrencyCode } from "./currency";
import { fontScaleSize } from "./misc";

interface AppState {
  fontScale: fontScaleSize;
  currency: CurrencyCode;
  isHydrated: boolean; // Flag to indicate if state has been loaded from storage
}

interface AppActions {
  updatefontScale: (size: fontScaleSize) => void;
  updateCurrency: (newVal: CurrencyCode) => void;
  setHydrated: (hydrated: boolean) => void;
}

export type ZustandStore = AppState & AppActions;
