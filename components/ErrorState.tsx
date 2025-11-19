// components/ErrorState.tsx

import React from "react";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

interface ErrorStateProps {
  title: string;
  message?: string;
}

/**
 * Reusable error state component.
 */
export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" variant="error" style={{ textAlign: "center" }}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText type="small" variant="secondary" style={{ marginTop: Spacing.sm }}>
          {message}
        </ThemedText>
      )}
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

