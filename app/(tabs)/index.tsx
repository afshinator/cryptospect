import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CurrencyBanner } from "@/components/CurrencyBanner";
import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function HomeScreen() {
  return (
    // 1. Apply flex: 1 to SafeAreaView so it occupies the full screen height
    <SafeAreaView style={{ flex: 1 }}> 
      
      {/* 2. FIXED CONTENT: Currency Banner remains at the top */}
      <CurrencyBanner lessText />

      {/* 3. SCROLLABLE CONTENT: ScrollView takes up all remaining space (flex: 1) */}
      <ScrollView 
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedView style={styles.titleContainer}>

          <ThemedText type="large">Welcome!</ThemedText>
          <HelloWave />
        </ThemedView>

        <ThemedView style={styles.placeholder}>
          <ThemedText type="bodySemibold">Content Area</ThemedText>
          <ThemedText type="body">
            This ScrollView now fills the rest of the screen.
            Scrolling is automatically enabled when content overflows.
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Style for the ScrollView itself, allowing it to grow
  scrollArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  // Optional: Style for the content *inside* the ScrollView
  contentContainer: {
    paddingVertical: Spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  placeholder: {
    // Example large block to demonstrate scrolling capability
    height: 800, 
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'gray',
    gap: Spacing.sm,
  },
  stepContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});