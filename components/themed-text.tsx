// themed-text.tsx

import { StyleSheet, Text, type TextProps } from 'react-native';

import {
  FONT_SIZE_DEFAULT,
  FONT_SIZE_LARGE,
  FONT_SIZE_SMALL,
  FONT_SIZE_SUBTITLE,
  FONT_SIZE_TITLE,
  FONT_WEIGHT_BOLD,
  FONT_WEIGHT_SEMIBOLD,
  fontScaleFactors,
  LINE_HEIGHT_DEFAULT,
  LINE_HEIGHT_LINK,
  LINE_HEIGHT_SMALL,
  LINE_HEIGHT_TITLE
} from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppState } from '@/utils/appState';
 
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'small' | 'large';
  propScaleFactor?: number;   // eg) fontScale size 'default' is 1.0, small would be 0.8, ..., see themes.ts
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  propScaleFactor = 1.0, // if not provided, uses the zustand state value (gotten from asyncStore)
  ...rest
}: ThemedTextProps) {
  const colorKey = type === 'link' ? 'link' : 'text'; 
  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);
  
  // 1. Get global font scale size from Zustand store
  const globalFontScaleSize = useAppState((state) => state.fontScale);

  // 2. Determine the effective scale factor
  let effectiveScaleFactor: number;
  
  // Check if the user explicitly provided a scaling factor 
  if (propScaleFactor !== 1.0) {
    effectiveScaleFactor = propScaleFactor;
  } else {
    // Global scale: use the factor mapped from the Zustand state
    // Use the mapped value, falling back to 1.0 if the size from the store is unexpected
    effectiveScaleFactor = fontScaleFactors[globalFontScaleSize] || 1.0;
  }


  // Apply scaling factor to a size property
  const getScaledStyle = (baseStyle: any) => ({
    ...baseStyle,
    // Only scale if the base style defines a fontSize or lineHeight
    ...(baseStyle.fontSize !== undefined && { 
      fontSize: baseStyle.fontSize * effectiveScaleFactor 
    }),
    ...(baseStyle.lineHeight !== undefined && { 
      lineHeight: baseStyle.lineHeight * effectiveScaleFactor 
    }),
  });


  let baseStyle;
  switch (type) {
    case 'small':
      baseStyle = styles.small;
      break;
    case 'large':
      baseStyle = styles.large;
      break;
    case 'title':
      baseStyle = styles.title;
      break;
    case 'defaultSemiBold':
      baseStyle = styles.defaultSemiBold;
      break;
    case 'subtitle':
      baseStyle = styles.subtitle;
      break;
    case 'link':
      baseStyle = styles.link;
      break;
    case 'default':
    default:
      baseStyle = styles.default;
      break;
  }
  
  const finalStyle = [
    { color },
    getScaledStyle(baseStyle), 
    style,
  ];

  return (
    <Text
      style={finalStyle}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: FONT_SIZE_SMALL,
    lineHeight: LINE_HEIGHT_SMALL,
  },
  default: {
    fontSize: FONT_SIZE_DEFAULT,
    lineHeight: LINE_HEIGHT_DEFAULT,
  },
  defaultSemiBold: {
    fontSize: FONT_SIZE_DEFAULT,
    lineHeight: LINE_HEIGHT_DEFAULT,
    fontWeight: FONT_WEIGHT_SEMIBOLD,
  },
  title: {
    fontSize: FONT_SIZE_TITLE,
    fontWeight: FONT_WEIGHT_BOLD,
    lineHeight: LINE_HEIGHT_TITLE,
  },
  subtitle: {
    fontSize: FONT_SIZE_SUBTITLE,
    fontWeight: FONT_WEIGHT_BOLD,
  },
  link: {
    lineHeight: LINE_HEIGHT_LINK,
    fontSize: FONT_SIZE_DEFAULT,
  },
  large: {
    fontSize: FONT_SIZE_LARGE,
    lineHeight: LINE_HEIGHT_DEFAULT, 
  },
});