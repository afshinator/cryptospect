/**
 * Enhanced theme system with comprehensive colors, typography, and spacing
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#666';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#fff',
    backgroundSecondary: '#f5f5f5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    link: '#0a7ea4',
    error: '#dc2626',
    success: '#16a34a',
    warning: '#ea580c',
    border: '#e5e7eb',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    backgroundSecondary: '#1f2324',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    link: '#60a5fa',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#fb923c',
    border: '#374151',
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

export const Typography = {
  // Extra large text
  xlarge: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: 'bold' as const,
  },
  // Large text (main titles)
  large: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold' as const,
  },
  // Title text
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold' as const,
  },
  // Subtitle
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  // Default body text
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'normal' as const,
  },
  // Body semibold
  bodySemibold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  // Small text
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'normal' as const,
  },
  // Extra small text
  xsmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'normal' as const,
  },
  // Caption text
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 'normal' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Shadow system for both iOS and Android.
 * * NOTE: For Web, the 'boxShadow' string property is provided to resolve
 * the deprecation warning and use standard CSS shadows.
 */

type ShadowProps = {
  // Deprecated iOS/Web shadow properties, now optional:
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  
  elevation: number; // Android shadow property
  boxShadow: string; // Web shadow property (CSS)
};

export const Shadows: Record<string, ShadowProps> = {
  none: {
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0,
    // shadowRadius: 0,
    elevation: 0,
    boxShadow: 'none',
  },
  sm: {
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.18,
    // shadowRadius: 1.0,
    elevation: 2,
    // CSS equivalent: offset-x | offset-y | blur-radius | color
    boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.18)',
  },
  md: {
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.20,
    // shadowRadius: 3.0,
    elevation: 4,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.20)',
  },
  lg: {
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.22,
    // shadowRadius: 5.0,
    elevation: 8,
    boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.22)',
  },
  xl: {
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.25,
    // shadowRadius: 8.0,
    elevation: 12,
    boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.25)',
  },
} as const;

/**
 * Helper function to get platform-specific shadow styles
 * Usage: ...getShadow('md')
 * * This returns the full set of properties. React Native Web will automatically
 * use 'boxShadow' on the web, while native platforms will use 'shadow*' and 'elevation'.
 */
export const getShadow = (size: keyof typeof Shadows) => {
  return Shadows[size];
};

// Type for theme preference (to be used when implementing user preference)
export type ThemePreference = 'light' | 'dark' | 'system';
