// constants/theme.ts

import { Platform, TextStyle } from "react-native";

// --- CORE DESIGN CONSTANTS: FONT SIZES, WEIGHTS, LINE HEIGHTS ---

// Base Sizes (px)
const SIZE_CAPTION = 12;
const SIZE_XSMALL = 12;
const SIZE_SMALL = 14;
const SIZE_DEFAULT = 16;
const SIZE_LARGE = 18;
const SIZE_SUBTITLE = 20;
const SIZE_TITLE = 32;
const SIZE_XLARGE = 48;

// Line Heights (px)
const LINE_HEIGHT_CAPTION = 16;
const LINE_HEIGHT_XSMALL = 18;
const LINE_HEIGHT_SMALL = 20;
const LINE_HEIGHT_DEFAULT = 24;
const LINE_HEIGHT_LARGE = 26;
const LINE_HEIGHT_TITLE = 32;
const LINE_HEIGHT_XLARGE = 52;
const LINE_HEIGHT_LINK = 30;

// Font Weights
const WEIGHT_REGULAR = '400' as const;
const WEIGHT_MEDIUM = '500' as const;
const WEIGHT_SEMIBOLD = '600' as const;
const WEIGHT_BOLD = 'bold' as const;


// --- CORE DESIGN CONSTANTS: COLORS ---

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
const VERY_LIGHT_GRAY = '#F4F4F5';
const SUBTLE_GRAY_LIGHT = '#E3E4E5';
const SUBTLE_GRAY_DARK = '#3A3F44';

// --- Dark Mode Button Colors ---
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


// --- THEME COLOR DEFINITIONS ---
export const Colors = {
  light: {
    // Core
    text: V_DARK_GRAY,
    textAlt: DEEP_CYAN,
    textSubtle: MED_GRAY,
    background: PURE_WHITE,
    tint: DEEP_CYAN,
    icon: MED_GRAY,
    tabIconDefault: MED_GRAY,
    tabIconSelected: DEEP_CYAN,
    // Expanded
    highlightedText: PURE_WHITE,
    buttonPrimary: DEEP_CYAN,
    buttonSecondary: VERY_LIGHT_GRAY,
    link: DEEP_CYAN,
    // Surfaces
    cardBackground: PURE_WHITE,
    inputBackground: PURE_WHITE,
    border: SUBTLE_GRAY_LIGHT,
    // Semantic
    success: SUCCESS_GREEN_LIGHT,
    warning: WARNING_AMBER_LIGHT,
    error: ERROR_RED_LIGHT,
    overlay: OVERLAY_BLACK_LIGHT,
  },
  dark: {
    // Core
    text: OFF_WHITE,
    textAlt: DEEP_CYAN,
    textSubtle: LIGHT_GRAY,
    background: DARK_GRAY_BLACK,
    tint: PURE_WHITE,
    icon: LIGHT_GRAY,
    tabIconDefault: LIGHT_GRAY,
    tabIconSelected: PURE_WHITE,
    // Expanded
    highlightedText: DARK_GRAY_BLACK,
    buttonPrimary: BUTTON_PRIMARY_DARK_GRAY,
    buttonSecondary: BUTTON_SECONDARY_DARK_GRAY,
    link: PURE_WHITE,
    // Surfaces
    cardBackground: CARD_BG_DARK,
    inputBackground: INPUT_BG_DARK,
    border: SUBTLE_GRAY_DARK,
    // Semantic
    success: SUCCESS_GREEN_DARK,
    warning: WARNING_GOLD_DARK,
    error: ERROR_RED_DARK,
    overlay: OVERLAY_BLACK_DARK,
  },
};


// --- TYPOGRAPHY DEFINITIONS ---

// Export the union type for component props
export type ThemedTextType = 
  | 'default' 
  | 'title' 
  | 'defaultSemiBold' 
  | 'subtitle' 
  | 'link'
  | 'xlarge'
  | 'large'
  | 'small'
  | 'xsmall'
  | 'caption';

// Export the theme size map
type TypographyStyles = {
  [key in ThemedTextType]: TextStyle;
};

export const typographySizes: TypographyStyles = {
  // Headers
  xlarge: { fontSize: SIZE_XLARGE, fontWeight: WEIGHT_BOLD, lineHeight: LINE_HEIGHT_XLARGE },
  title: { fontSize: SIZE_TITLE, fontWeight: WEIGHT_BOLD, lineHeight: LINE_HEIGHT_TITLE },
  subtitle: { fontSize: SIZE_SUBTITLE, fontWeight: WEIGHT_BOLD, lineHeight: LINE_HEIGHT_DEFAULT }, // Assuming default line height for subtitle
  
  // Body
  large: { fontSize: SIZE_LARGE, fontWeight: WEIGHT_MEDIUM, lineHeight: LINE_HEIGHT_LARGE },
  default: { fontSize: SIZE_DEFAULT, fontWeight: WEIGHT_REGULAR, lineHeight: LINE_HEIGHT_DEFAULT },
  defaultSemiBold: { fontSize: SIZE_DEFAULT, fontWeight: WEIGHT_SEMIBOLD, lineHeight: LINE_HEIGHT_DEFAULT },
  
  // Utility
  small: { fontSize: SIZE_SMALL, fontWeight: WEIGHT_REGULAR, lineHeight: LINE_HEIGHT_SMALL },
  xsmall: { fontSize: SIZE_XSMALL, fontWeight: WEIGHT_REGULAR, lineHeight: LINE_HEIGHT_XSMALL },
  caption: { fontSize: SIZE_CAPTION, fontWeight: WEIGHT_SEMIBOLD, lineHeight: LINE_HEIGHT_CAPTION },
  
  // Special
  link: { fontSize: SIZE_DEFAULT, lineHeight: LINE_HEIGHT_LINK, fontWeight: WEIGHT_REGULAR },
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

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Opacity constants for UI elements
export const Opacity = {
  gridLine: 0.3,
  dropdownItem: 0.7,
  warningBackground: 0.1,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};