// components/SectionContainer.tsx

import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SectionContainerProps {
  children: ReactNode;
  style?: ViewStyle;
  marginBottom?: number;
}

/**
 * A reusable container component with consistent styling:
 * - Padding
 * - Border radius
 * - Border (using theme colors)
 * - Optional margin bottom
 * 
 * Used for sections like LatestDominancePercentages, settings sections, etc.
 */
export function SectionContainer({ 
  children, 
  style,
  marginBottom = Spacing.lg,
}: SectionContainerProps) {
  const borderColor = useThemeColor({}, 'border');

  return (
    <ThemedView 
      style={[
        styles.container,
        { borderColor, marginBottom },
        style,
      ]}
    >
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

