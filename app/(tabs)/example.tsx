import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, getShadow, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

/**
 * Example usage of the enhanced theme system
 */
export default function ExampleScreen() {
  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        {/* Typography sizes */}
        <ThemedText type="xlarge">Extra Large Title</ThemedText>
        <ThemedText type="large">Large Title</ThemedText>
        <ThemedText type="title">Title</ThemedText>
        <ThemedText type="subtitle">Subtitle</ThemedText>
        <ThemedText type="body">Body text (default)</ThemedText>
        <ThemedText type="bodySemibold">Body Semibold</ThemedText>
        <ThemedText type="small">Small text</ThemedText>
        <ThemedText type="xsmall">Extra small text</ThemedText>
        <ThemedText type="caption">Caption text</ThemedText>

        {/* Color variants */}
        <ThemedText variant="default">Default text color</ThemedText>
        <ThemedText variant="secondary">Secondary text color</ThemedText>
        <ThemedText variant="link">Link text color</ThemedText>
        <ThemedText variant="error">Error message</ThemedText>
        <ThemedText variant="success">Success message</ThemedText>
        <ThemedText variant="warning">Warning message</ThemedText>

        {/* Combining type and variant */}
        <ThemedText type="title" variant="error">
          Error Title
        </ThemedText>
        <ThemedText type="small" variant="secondary">
          Small secondary text
        </ThemedText>

        {/* Secondary background with shadow */}
        <ThemedView variant="secondary" shadow="md" style={styles.card}>
          <ThemedText type="subtitle">Card with Medium Shadow</ThemedText>
          <ThemedText variant="secondary">
            This is a card with secondary background and shadow
          </ThemedText>
        </ThemedView>

        {/* Different shadow sizes */}
        <ThemedView shadow="sm" style={styles.card}>
          <ThemedText type="bodySemibold">Small Shadow</ThemedText>
        </ThemedView>

        <ThemedView shadow="lg" style={styles.card}>
          <ThemedText type="bodySemibold">Large Shadow</ThemedText>
        </ThemedView>

        <ThemedView shadow="xl" style={styles.card}>
          <ThemedText type="bodySemibold">Extra Large Shadow</ThemedText>
        </ThemedView>

        {/* Using spacing constants */}
        <ThemedView style={styles.spacedContainer}>
          <ThemedText>Using theme spacing constants</ThemedText>
        </ThemedView>

        {/* Using getShadow helper in custom styles */}
        <ThemedView style={styles.customShadowCard}>
          <ThemedText>
            Card with custom shadow applied via StyleSheet
          </ThemedText>
        </ThemedView>

        {/* Manual color override (when needed) */}
        <ThemedText lightColor="#ff0000" darkColor="#ff6666">
          Custom colored text
        </ThemedText>
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  spacedContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  customShadowCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...getShadow("lg"),
  },
});
