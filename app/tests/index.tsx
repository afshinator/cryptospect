// app/tests/index.tsx

import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BorderRadius, Spacing, typographySizes } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Link } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function TestsIndexScreen() {
  const borderColor = useThemeColor({}, 'border');

  // FIXES: Explicitly flatten the style for TouchableOpacity/Link
  // This is required here because the style array is created in the render function
  // and passed to a component wrapped by 'Link asChild', which is sensitive to style arrays on web.
  const linkItemStyle = StyleSheet.flatten([styles.testItem, { borderColor: borderColor }]);

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Component Tests
        </ThemedText>
        <ThemedText style={styles.description} colorVariant="textSubtle">
          Visual test pages for components. Use these to verify component behavior and styling.
        </ThemedText>

        <ThemedView style={styles.testList}>
          <Link href="/tests/themed-text-demo" asChild>
            <TouchableOpacity style={linkItemStyle}>
              <ThemedView style={styles.testItemContent}>
                <ThemedText type="subtitle" style={styles.testItemTitle}>
                  ThemedText Component
                </ThemedText>
                <ThemedText colorVariant="textSubtle" style={styles.testItemDescription}>
                  View all ThemedText type variants, color variants, and prop combinations
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </Link>
        </ThemedView>
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.md + Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  description: {
    marginBottom: Spacing.xl,
  },
  testList: {
    gap: Spacing.sm + Spacing.xs,
  },
  testItem: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  testItemContent: {
    padding: Spacing.md,
  },
  testItemTitle: {
    marginBottom: Spacing.xs,
  },
  testItemDescription: {
    fontSize: typographySizes.small.fontSize,
  },
});