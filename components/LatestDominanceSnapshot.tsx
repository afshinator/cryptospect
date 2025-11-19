import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

// Defined Colors (Asset-specific colors) and Formatting Constant
const BTC_COLOR = "#FF9900";
const ETH_COLOR = "#627EEA";
const UI_DECIMAL_PRECISION = 2; // Fixed to 2 decimal places for card display

const formatPercentage = (value: number) => {
  return `${value.toFixed(UI_DECIMAL_PRECISION)}%`;
};

interface LatestDominanceSnapshotProps {
  latestBtcD: number;
  latestEthD: number;
  latestDate: string;
}

export default function LatestDominanceSnapshot({
  latestBtcD,
  latestEthD,
  latestDate,
}: LatestDominanceSnapshotProps) {
  return (
    <ThemedView shadow="sm" style={styles.latestValuesContainer}>
      <ThemedText type="subtitle" style={styles.latestValuesTitle}>
        Latest Snapshot ({latestDate})
      </ThemedText>
      <ThemedView style={styles.latestValuesRow}>
        <ThemedView style={styles.valueItem}>
          <ThemedText type="bodySemibold" style={{ color: BTC_COLOR }}>
            BTC.D
          </ThemedText>
          <ThemedText type="body">{formatPercentage(latestBtcD)}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.valueItem}>
          <ThemedText type="bodySemibold" style={{ color: ETH_COLOR }}>
            ETH.D
          </ThemedText>
          <ThemedText type="body">{formatPercentage(latestEthD)}</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
    latestValuesContainer: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        // Spacing added here to separate it from the Legend
        marginTop: Spacing.xl, 
    },
    latestValuesTitle: {
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    latestValuesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around', 
        paddingHorizontal: Spacing.xs, 
    },
    valueItem: {
        alignItems: 'center',
        flex: 1,
    },
});