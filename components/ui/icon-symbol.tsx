// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
    // Exchange Rates: SF Symbol 'dollarsign.arrow.circlepath' mapped to Material Icon 'currency-exchange'
  'dollarsign.arrow.circlepath': 'currency-exchange', 
  
  // Settings: SF Symbol 'gearshape.fill' mapped to Material Icon 'settings'
  'gearshape.fill': 'settings',
  
  // More: SF Symbol 'ellipsis.circle.fill' mapped to Material Icon 'more-horiz' or 'menu'
  'ellipsis.circle.fill': 'more-horiz', 
    // Lists/Transactions Screen: SF Symbol 'list.bullet.rectangle.fill' mapped to Material Icon 'list-alt'
  'list.bullet.rectangle.fill': 'list-alt',
  
  // Crypto/Blockchain Screen: SF Symbol 'bitcoinsign.circle.fill' mapped to Material Icon 'monetization-on'
  'bitcoinsign.circle.fill': 'monetization-on', // A general currency/coin icon
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
