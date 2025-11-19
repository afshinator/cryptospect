import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CurrencyBanner } from "@/components/CurrencyBanner";
import { DominanceSection } from "@/components/DominanceSection";
import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}> 
      
      {/* FIXED CONTENT: Currency Banner remains at the top */}
      <CurrencyBanner lessText />

      {/* SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="large">CryptoSpect</ThemedText>
          <HelloWave />
        </ThemedView>

        {/* Dominance Section */}
        <DominanceSection showAllFour={true}/>

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
  scrollArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
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