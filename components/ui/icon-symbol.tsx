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
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // Exchange Rates: SF Symbol 'dollarsign.arrow.circlepath' mapped to Material Icon 'currency-exchange'
  "dollarsign.arrow.circlepath": "currency-exchange",

  // Settings: SF Symbol 'gearshape.fill' mapped to Material Icon 'settings'
  "gearshape.fill": "settings",

  // More: SF Symbol 'ellipsis.circle.fill' mapped to Material Icon 'more-horiz' or 'menu'
  "ellipsis.circle.fill": "more-horiz",
  // Lists/Transactions Screen: SF Symbol 'list.bullet.rectangle.fill' mapped to Material Icon 'list-alt'
  "list.bullet.rectangle.fill": "list-alt",

  // Crypto/Blockchain Screen: SF Symbol 'bitcoinsign.circle.fill' mapped to Material Icon 'monetization-on'
  "bitcoinsign.circle.fill": "monetization-on", // A general currency/coin icon

  // Dominance/Value/Growth: SF Symbol 'chart.line.uptrend.xyaxis' mapped to Material Icon 'trending-up'
  "chart.line.uptrend.xyaxis": "trending-up",
  // Trending Down: SF Symbol 'chart.line.downtrend.xyaxis' mapped to Material Icon 'trending-down'
  "chart.line.downtrend.xyaxis": "trending-down",

  // Dominance/Analysis: SF Symbol 'chart.bar.fill' mapped to Material Icon 'bar-chart',
  "chart.bar.fill": "bar-chart",

  // History: SF Symbol 'clock.arrow.circlepath' mapped to Material Icon 'history',
  "clock.arrow.circlepath": "history",

  // Bag/Inventory: SF Symbol 'bag.fill' mapped to Material Icon 'shopping-bag'
  "bag.fill": "shopping-bag",

  // Portfolio/Assets: SF Symbol 'briefcase.fill' mapped to Material Icon 'work',
  "briefcase.fill": "work",

  // Wallet/Stash: SF Symbol 'yensign.circle.fill' mapped to Material Icon 'account-balance-wallet',
  "yensign.circle.fill": "account-balance-wallet",

  // Checklist/Task List: SF Symbol 'checklist' mapped to Material Icon 'check-box',
  checklist: "check-box",

  // Portfolio/Allocation: SF Symbol 'chart.pie.fill' mapped to Material Icon 'pie-chart',
  "chart.pie.fill": "pie-chart",

  // General List/Index: SF Symbol 'list.bullet' mapped to Material Icon 'list',
  "list.bullet": "list",

  // Add/Create: SF Symbol 'plus.circle.fill' mapped to Material Icon 'add-circle'
  "plus.circle.fill": "add-circle",

  // Delete/Remove: SF Symbol 'trash.fill' mapped to Material Icon 'delete'
  "trash.fill": "delete",

  // Edit: SF Symbol 'pencil' mapped to Material Icon 'edit'
  pencil: "edit",

  // Close/Cancel: SF Symbol 'xmark.circle.fill' mapped to Material Icon 'cancel'
  "xmark.circle.fill": "cancel",

  // Text/Format: SF Symbol 'textformat' mapped to Material Icon 'text-fields'
  "textformat": "text-fields",
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
