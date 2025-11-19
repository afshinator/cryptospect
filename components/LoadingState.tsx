// components/LoadingState.tsx

import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

interface LoadingStateProps {
  message?: string;
}

/**
 * Reusable loading state component.
 */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  const loadingTintColor = useThemeColor({}, "tint");

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color={loadingTintColor} />
      <ThemedText type="body" style={{ marginTop: Spacing.md }}>
        {message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    minHeight: 300,
  },
});

