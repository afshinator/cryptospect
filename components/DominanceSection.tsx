// components/DominanceSection.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { calculateDominance, formatDominance, getDominanceLabel } from "@/utils/cryptoDominance";
import { StyleSheet, View } from "react-native";

export function DominanceSection() {
  const { cryptoOverview, isCryptoOverviewPending } = useAppInitialization();
  const dominance = calculateDominance(cryptoOverview);

  // Format timestamp
  const getLastUpdated = () => {
    if (!cryptoOverview?.timestamp) return null;
    const date = new Date(cryptoOverview.timestamp);
    return date.toLocaleTimeString([], { 
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
      
      {isCryptoOverviewPending ? (
        <ThemedText type="small" variant="secondary">
          Loading dominance data...
        </ThemedText>
      ) : dominance ? (
        <View style={styles.grid}>
          <ThemedView style={styles.card}>
            <ThemedText type="small" variant="secondary">
              {getDominanceLabel('btc')}
            </ThemedText>
            <ThemedText type="title">
              {formatDominance(dominance.btc)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="small" variant="secondary">
              {getDominanceLabel('eth')}
            </ThemedText>
            <ThemedText type="title">
              {formatDominance(dominance.eth)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="small" variant="secondary">
              {getDominanceLabel('stablecoins')}
            </ThemedText>
            <ThemedText type="title">
              {formatDominance(dominance.stablecoins)}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="small" variant="secondary">
              {getDominanceLabel('others')}
            </ThemedText>
            <ThemedText type="title">
              {formatDominance(dominance.others)}
            </ThemedText>
          </ThemedView>
        </View>
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
});