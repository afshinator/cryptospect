import { StyleSheet } from "react-native";

import { CurrencyBanner } from "@/components/CurrencyBanner";
import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { Spacing } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView>
      <ThemedView>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="large">Welcome!</ThemedText>
          <HelloWave />
        </ThemedView>

        <Collapsible title="Exchange Rates" isOpen>
          <CurrencyBanner lessText />
        </Collapsible>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
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
