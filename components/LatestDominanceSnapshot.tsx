import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

// Defined Colors (Asset-specific colors - repeated here for component self-containment)
const BTC_COLOR = "#FF9900"; // Orange
const ETH_COLOR = "#627EEA"; // Blue

interface LatestDominanceSnapshotProps {
  latestBtcD: number;
  latestEthD: number;
  latestDate: string;
}

// Helper function to format percentages with consistent spacing
const formatPercentage = (value: number) => {
  // Using 2 decimal places here for the snapshot card
  return isFinite(value) ? `${value.toFixed(2)}%` : 'N/A';
};

export default function LatestDominanceSnapshot({
  latestBtcD,
  latestEthD,
  latestDate,
}: LatestDominanceSnapshotProps) {
  return (
    <ThemedView style={styles.card}>
      <ThemedText type="small" variant="secondary" style={styles.dateLabel}>
        Snapshot as of: {latestDate}
      </ThemedText>

      <ThemedView style={styles.row}>
        {/* BTC Dominance */}
        <ThemedView style={styles.item}>
          <ThemedText type="subtitle" style={[styles.value, { color: BTC_COLOR }]}>
            {formatPercentage(latestBtcD)}
          </ThemedText>
          <ThemedText type="bodySemibold" style={styles.label}>
            Bitcoin Dominance
          </ThemedText>
        </ThemedView>

        {/* ETH Dominance */}
        <ThemedView style={styles.item}>
          <ThemedText type="subtitle" style={[styles.value, { color: ETH_COLOR }]}>
            {formatPercentage(latestEthD)}
          </ThemedText>
          <ThemedText type="bodySemibold" style={styles.label}>
            Ethereum Dominance
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    // Correcting a common pattern that causes the error if it involves inline styles
    // If 'transform-origin' or similar were used in an inline style (e.g., in `ThemedView` style prop), it would cause this.
    // However, since only `StyleSheet.create` is used here, the error might be internal to the themed components.
    // For now, ensuring this component's styles are clean.
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    // Using shadow properties common in themes, ensuring correct keys (e.g., shadowOpacity, not shadow-opacity)
    shadowColor: Colors.light.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateLabel: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
 
});