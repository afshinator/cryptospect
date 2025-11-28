import React, { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, ViewStyle } from 'react-native';

/**
 * Interface to explicitly type the styles object, forcing them to be ViewStyle.
 * This resolves TypeScript errors when passing the styles to ScrollView props 
 * (which are strictly typed to accept only ViewStyle).
 */
interface ScreenStyles {
  container: ViewStyle;
  content: ViewStyle;
}

/**
 * A wrapper component for full screens to ensure content is scrollable on all platforms,
 * especially on the web where a standard View does not automatically scroll.
 */
export function ScreenContainer({ children }: { children: ReactNode }) {
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      // On web, we often want the indicator hidden for a cleaner look
      showsVerticalScrollIndicator={Platform.OS !== 'web'} 
    >
      {children}
    </ScrollView>
  );
}

// Applying the ScreenStyles interface to StyleSheet.create
const styles = StyleSheet.create<ScreenStyles>({
    // The main container needs flex: 1 to ensure it takes up the full screen height
    // This is especially critical on web where ScrollView needs explicit height constraints
    container: {
        flex: 1,
    },
    // The content container ensures padding and alignment for the content inside
    content: {
        // paddingHorizontal: 16,
        // paddingBottom: 40,
        // Note: We don't set minHeight here as it can prevent scrolling on web
        // when content exceeds the viewport height
    }
});

// Example Usage (for your RatesScreen or SettingsScreen):
/*
import { ScreenContainer } from './ScreenContainer';

export function RatesScreen() {
  return (
    <ScreenContainer>
      // All your rate display components go here
      <Text>Currency List Item 1</Text>
      // ... 50 more list items that extend past the screen bottom
      <Text>Currency List Item 51</Text>
    </ScreenContainer>
  );
}
*/
