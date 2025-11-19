// components/DominanceSection.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useTextWrappingDetection } from "@/hooks/use-text-wrapping-detection";
import { calculateDominance, formatDominance, getDominanceLabel } from "@/utils/cryptoDominance";
import { StyleSheet, useColorScheme, View } from "react-native";

interface DominanceSectionProps {
  // Optional: Override data from hook with external data
  btcDominance?: number;
  ethDominance?: number;
  stablecoinsDominance?: number;
  othersDominance?: number;
  date?: string; // Formatted date string
  // Show all 4 numbers (BTC, ETH, Stablecoins, Others) vs just BTC and ETH
  showAllFour?: boolean;
}

export function DominanceSection({
  btcDominance,
  ethDominance,
  stablecoinsDominance,
  othersDominance,
  date,
  showAllFour = false,
}: DominanceSectionProps = {}) {
  const { cryptoOverview, isCryptoOverviewPending } = useAppInitialization();
  const colorScheme = useColorScheme();
  
  // Use external data if provided, otherwise calculate from hook
  const dominance = btcDominance !== undefined && ethDominance !== undefined
    ? {
        btc: btcDominance,
        eth: ethDominance,
        stablecoins: stablecoinsDominance ?? 0,
        others: othersDominance ?? 0,
      }
    : calculateDominance(cryptoOverview);

  // Get theme colors for BTC and ETH
  const btcColor = colorScheme === "dark" ? Colors.dark.btc : Colors.light.btc;
  const ethColor = colorScheme === "dark" ? Colors.dark.eth : Colors.light.eth;

  // Use the reusable hook for text wrapping detection
  // It will automatically re-measure when font scale changes
  const { useTwoRows, hasMeasured, handleLayout: handleRowLayout } = useTextWrappingDetection({
    enabled: showAllFour,
    expectedSingleRowHeight: 80,
    dependencies: [
      dominance?.btc,
      dominance?.eth,
      dominance?.stablecoins,
      dominance?.others,
    ],
  });

  // Format timestamp
  const getLastUpdated = () => {
    if (date) return date;
    if (!cryptoOverview?.timestamp) return null;
    const timestamp = new Date(cryptoOverview.timestamp);
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">
          Market Dominance
        </ThemedText>
        {getLastUpdated() && (
          <ThemedText type="xsmall" variant="secondary">
            Updated: {getLastUpdated()}
          </ThemedText>
        )}
      </View>
      
      {isCryptoOverviewPending && !dominance ? (
        <ThemedText type="small" variant="secondary">
          Loading dominance data...
        </ThemedText>
      ) : dominance ? (
        showAllFour ? (
          // First render in single row to measure, then switch to two rows if needed
          !hasMeasured ? (
            // Measurement render - single row to detect wrapping
            <View style={styles.row} onLayout={handleRowLayout}>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('btc')}
                </ThemedText>
                <ThemedText type="title" style={{ color: btcColor }}>
                  {formatDominance(dominance.btc)}
                </ThemedText>
              </View>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('eth')}
                </ThemedText>
                <ThemedText type="title" style={{ color: ethColor }}>
                  {formatDominance(dominance.eth)}
                </ThemedText>
              </View>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('stablecoins')}
                </ThemedText>
                <ThemedText type="title">
                  {formatDominance(dominance.stablecoins)}
                </ThemedText>
              </View>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('others')}
                </ThemedText>
                <ThemedText type="title">
                  {formatDominance(dominance.others)}
                </ThemedText>
              </View>
            </View>
          ) : useTwoRows ? (
            // Show all 4 in a 2x2 grid (two rows)
            <View style={styles.twoRowGrid}>
              <View style={styles.twoRowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('btc')}
                </ThemedText>
                <ThemedText type="title" style={{ color: btcColor }}>
                  {formatDominance(dominance.btc)}
                </ThemedText>
              </View>
              <View style={styles.twoRowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('eth')}
                </ThemedText>
                <ThemedText type="title" style={{ color: ethColor }}>
                  {formatDominance(dominance.eth)}
                </ThemedText>
              </View>
              <View style={styles.twoRowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('stablecoins')}
                </ThemedText>
                <ThemedText type="title">
                  {formatDominance(dominance.stablecoins)}
                </ThemedText>
              </View>
              <View style={styles.twoRowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('others')}
                </ThemedText>
                <ThemedText type="title">
                  {formatDominance(dominance.others)}
                </ThemedText>
              </View>
            </View>
          ) : (
            // Show all 4 on one line (wide screen)
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('btc')}
                </ThemedText>
                <ThemedText type="title" style={{ color: btcColor }}>
                  {formatDominance(dominance.btc)}
                </ThemedText>
              </View>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('eth')}
                </ThemedText>
                <ThemedText type="title" style={{ color: ethColor }}>
                  {formatDominance(dominance.eth)}
                </ThemedText>
              </View>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('stablecoins')}
                </ThemedText>
                <ThemedText type="title">
                  {formatDominance(dominance.stablecoins)}
                </ThemedText>
              </View>
              <View style={styles.rowItem}>
                <ThemedText type="small" variant="secondary">
                  {getDominanceLabel('others')}
                </ThemedText>
                <ThemedText type="title">
                  {formatDominance(dominance.others)}
                </ThemedText>
              </View>
            </View>
          )
        ) : (
          // Show only BTC and ETH in grid
          <View style={styles.grid}>
            <ThemedView style={styles.card}>
              <ThemedText type="small" variant="secondary">
                {getDominanceLabel('btc')}
              </ThemedText>
              <ThemedText type="title" style={{ color: btcColor }}>
                {formatDominance(dominance.btc)}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.card}>
              <ThemedText type="small" variant="secondary">
                {getDominanceLabel('eth')}
              </ThemedText>
              <ThemedText type="title" style={{ color: ethColor }}>
                {formatDominance(dominance.eth)}
              </ThemedText>
            </ThemedView>
          </View>
        )
      ) : (
        <ThemedText type="small" variant="secondary">
          Unable to load dominance data
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  rowItem: {
    flex: 1,
    minWidth: '20%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  twoRowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  twoRowItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});