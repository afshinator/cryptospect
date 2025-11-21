// components/dominance/DominanceNumberDisplay.tsx

import { ThemedText } from "@/components/themed-text";
import { formatDominance, getDominanceLabel } from "@/utils/cryptoDominance";
import { View, ViewStyle } from "react-native";

interface DominanceNumberDisplayProps {
  type: 'btc' | 'eth' | 'stablecoins' | 'others';
  value: number;
  color?: string;
  containerStyle?: ViewStyle;
}

export function DominanceNumberDisplay({
  type,
  value,
  color,
  containerStyle,
}: DominanceNumberDisplayProps) {
  return (
    <View style={containerStyle}>
      <ThemedText type="small" variant="secondary">
        {getDominanceLabel(type)}
      </ThemedText>
      <ThemedText type="title" style={color ? { color } : undefined}>
        {formatDominance(value)}
      </ThemedText>
    </View>
  );
}

