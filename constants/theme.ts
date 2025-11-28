// constants/theme.ts

import { Platform } from "react-native";

// --- Core Tints ---
const DEEP_CYAN = '#0a7ea4';
const PURE_WHITE = '#fff';

// --- General Neutrals ---
const V_DARK_GRAY = '#11181C';
const DARK_GRAY_BLACK = '#151718';
const OFF_WHITE = '#ECEDEE';
const MED_GRAY = '#687076';
const LIGHT_GRAY = '#9BA1A6';

// --- Surfaces/Containers ---
const CARD_BG_DARK = '#1C2023';
const INPUT_BG_DARK = '#2A2E31';

// --- Borders/Separators ---
const VERY_LIGHT_GRAY = '#F4F4F5'; // For light mode secondary button
const SUBTLE_GRAY_LIGHT = '#E3E4E5';
const SUBTLE_GRAY_DARK = '#3A3F44';

// --- Dark Mode Button Colors (Based on existing theme) ---
const BUTTON_PRIMARY_DARK_GRAY = '#3F4448';
const BUTTON_SECONDARY_DARK_GRAY = '#2B3034';

// --- Semantic Colors ---
const SUCCESS_GREEN_LIGHT = '#28A745';
const WARNING_AMBER_LIGHT = '#FFC107';
const ERROR_RED_LIGHT = '#DC3545';
const SUCCESS_GREEN_DARK = '#2ECC71';
const WARNING_GOLD_DARK = '#FFD700';
const ERROR_RED_DARK = '#F76D6D';

// --- Overlays ---
const OVERLAY_BLACK_LIGHT = 'rgba(0, 0, 0, 0.4)';
const OVERLAY_BLACK_DARK = 'rgba(0, 0, 0, 0.7)';

export const Colors = {
  light: {
    // --- Core Colors ---
    text: V_DARK_GRAY,
    background: PURE_WHITE,
    tint: DEEP_CYAN,
    icon: MED_GRAY,
    tabIconDefault: MED_GRAY,
    tabIconSelected: DEEP_CYAN,

    // --- Expanded Colors (Light Mode) ---
    highlightedText: PURE_WHITE,
    buttonPrimary: DEEP_CYAN,
    buttonSecondary: VERY_LIGHT_GRAY,
    link: DEEP_CYAN,

    // Surfaces/Containers
    cardBackground: PURE_WHITE,
    inputBackground: PURE_WHITE,
    border: SUBTLE_GRAY_LIGHT,
    
    // Semantic/System
    success: SUCCESS_GREEN_LIGHT,
    warning: WARNING_AMBER_LIGHT,
    error: ERROR_RED_LIGHT,
    overlay: OVERLAY_BLACK_LIGHT,
  },
  dark: {
    // --- Core Colors ---
    text: OFF_WHITE,
    background: DARK_GRAY_BLACK,
    tint: PURE_WHITE,
    icon: LIGHT_GRAY,
    tabIconDefault: LIGHT_GRAY,
    tabIconSelected: PURE_WHITE,

    // --- Expanded Colors (Dark Mode) ---
    highlightedText: DARK_GRAY_BLACK,
    buttonPrimary: BUTTON_PRIMARY_DARK_GRAY,
    buttonSecondary: BUTTON_SECONDARY_DARK_GRAY,
    link: PURE_WHITE,

    // Surfaces/Containers
    cardBackground: CARD_BG_DARK,
    inputBackground: INPUT_BG_DARK,
    border: SUBTLE_GRAY_DARK,

    // Semantic/System
    success: SUCCESS_GREEN_DARK,
    warning: WARNING_GOLD_DARK,
    error: ERROR_RED_DARK,
    overlay: OVERLAY_BLACK_DARK,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});