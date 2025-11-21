// components/list-detail/StablecoinBadge.tsx
// Stablecoin badge component for list detail screen with platform-specific positioning

import { Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";

interface StablecoinBadgeProps {
  backgroundColor: string;
  opacity?: number; // Optional opacity for mobile absolute positioning
  rotation?: number; // Optional rotation in degrees (clockwise) for mobile badge
}

export function StablecoinBadge({ backgroundColor, opacity = 1, rotation = 0 }: StablecoinBadgeProps) {
  return (
    <ThemedView style={[
      styles.badge, 
      { 
        backgroundColor, 
        opacity,
        transform: rotation !== 0 ? [{ rotate: `${rotation}deg` }] : undefined,
      }
    ]}>
      <IconSymbol name="dollarsign.circle.fill" size={14} color="#FFFFFF" />
      <ThemedText type="xsmall" style={styles.badgeText}>
        Stablecoin
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

