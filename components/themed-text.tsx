// components/themed-text.tsx

import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemedTextType, typographySizes } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

// 2. Define ThemeColorKey based on the keys available in your theme's color scheme
// This is required here to ensure the colorVariant prop is type-safe.
export type ThemeColorKey =
  | 'text'
  | 'textAlt'
  | 'textSubtle'
  | 'background'
  | 'tint'
  | 'icon'
  | 'tabIconDefault'
  | 'tabIconSelected'
  | 'highlightedText'
  | 'buttonPrimary'
  | 'buttonSecondary'
  | 'link'
  | 'cardBackground'
  | 'inputBackground'
  | 'border'
  | 'success'
  | 'warning'
  | 'error'
  | 'overlay';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemedTextType; // Use the imported type
  colorVariant?: ThemeColorKey; // Use the theme color key type
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  colorVariant,
  ...rest
}: ThemedTextProps) {

  // Determine the colorKey:
  const colorKey: ThemeColorKey = type === 'link' ? 'link' : (colorVariant || 'text');

  // Fetch the color from the theme based on the determined colorKey
  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  // Get the style object based on the 'type' prop from the imported map
  const sizeStyle = typographySizes[type];

  // Combine all styles into a single array
  const allStyles = [
    { color }, // Dynamic color comes first
    sizeStyle, // Typography size/weight styles
    style,     // External style prop (can be an object or an array)
  ];

  // FIXES: The React Native for Web renderer sometimes fails when applying style arrays
  // containing combined styles, leading to the "Failed to set an indexed property [0]" TypeError.
  // StyleSheet.flatten() converts the array into a single, merged style object, resolving the Web error.
  const mergedStyle = StyleSheet.flatten(allStyles);

  return (
    <Text
      style={mergedStyle}
      {...rest}
    />
  );
}

// The styles object is empty but kept for the required StyleSheet.create structure.
const styles = StyleSheet.create({});