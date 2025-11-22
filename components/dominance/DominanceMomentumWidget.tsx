// components/DominanceMomentumWidget.tsx
/*
What It Measures:
The metric calculates the percentage change in the BTC-to-ETH dominance ratio over the past 7 days.

Interpretation:
  Positive Momentum: Risk-off environment, favoring BTC dominance.
  Negative Momentum: Altcoin Season precursor - shift toward large-cap altcoins.
  Neutral Momentum: Stable dominance ratio.
*/

import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet } from "react-native";

import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BACKEND_DOMINANCE_QUERY_KEY } from "@/constants/misc";
import { Spacing } from "@/constants/theme";
import {
  calculateAll7DayRatioChanges,
  useCalculatePercentageChange
} from "@/hooks/use-dominance-calculations";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  fetchHistoricalDominance,
  HistoricalDominanceSnapshot,
} from "@/utils/backendApi";

// Timing
const STALE_TIME_HOURS = 24;
const STALE_TIME_MS = STALE_TIME_HOURS * 60 * 60 * 1000;

interface DominanceMomentumWidgetProps {
  extendedInfo?: boolean;
}

export function DominanceMomentumWidget({ extendedInfo = false }: DominanceMomentumWidgetProps) {
  const { data: historicalDominance, isPending } = useQuery<
    HistoricalDominanceSnapshot[]
  >({
    queryKey: BACKEND_DOMINANCE_QUERY_KEY,
    queryFn: fetchHistoricalDominance,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  // Calculate the current change using the hook
  const { currentChange } = useCalculatePercentageChange(
    historicalDominance,
    successColor,
    errorColor
  );

  // Calculate all 7-day ratio changes statistics
  const stats = calculateAll7DayRatioChanges(historicalDominance);

  // Determine interpretation
  const isPositive = currentChange > 0;
  const interpretation =
    currentChange > 0
      ? "Risk-off environment, favoring BTC dominance"
      : currentChange < 0
      ? "Altcoin Season precursor - shift toward large-cap altcoins"
      : "Neutral - stable dominance ratio";

  if (isPending) {
    return (
      <SectionContainer marginBottom={Spacing.md}>
        <ActivityIndicator size="small" />
        <ThemedText type="body" variant="secondary" style={styles.loadingText}>
          Loading momentum data...
        </ThemedText>
      </SectionContainer>
    );
  }

  if (!historicalDominance || historicalDominance.length < 7) {
    return null; // Not enough data
  }

  const changeColor = isPositive ? successColor : errorColor;
  const sign = currentChange > 0 ? "+" : "";

  return (
    <SectionContainer marginBottom={Spacing.md}>
      <ThemedText type="subtitle" style={styles.title}>
        Dominance Momentum
      </ThemedText>
      
      {/* Current 7-Day Change - Two Column Layout */}
      <ThemedView style={styles.twoColumnContainer}>
        <ThemedView style={styles.leftColumn}>
          <ThemedText
            type="title"
            style={[styles.value, { color: changeColor }]}
          >
            {sign}
            {currentChange.toFixed(2)}%
          </ThemedText>
          <ThemedText type="small" variant="secondary" style={styles.label}>
            7-Day Change
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.separator} />
        <ThemedView style={styles.rightColumn}>
          <ThemedText type="bodySemibold" style={styles.interpretation}>
            {interpretation}
          </ThemedText>
          <ThemedText type="small" style={styles.description}>
            {isPositive
              ? "BTC/ETH ratio accelerating toward BTC"
              : "BTC/ETH ratio accelerating toward ETH"}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Extended Statistics Section - Only shown when extendedInfo is true */}
      {extendedInfo && stats.count > 0 && (
        <ThemedView style={styles.statsSection}>
          <ThemedText type="body" variant="secondary" style={styles.statsTitle}>
            180-Day Statistics ({stats.count} valid periods)
          </ThemedText>
          <ThemedView style={styles.statsGrid}>
            <ThemedView style={styles.statItem}>
              <ThemedText type="small" variant="secondary" style={styles.statLabel}>
                Minimum
              </ThemedText>
              <ThemedText type="body" style={[styles.statValue, { color: errorColor }]}>
                {stats.min < 0 ? '' : '+'}{stats.min.toFixed(2)}%
              </ThemedText>
              {stats.minDate && (
                <ThemedText type="xsmall" style={styles.statDate}>
                  {new Date(stats.minDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </ThemedText>
              )}
              <ThemedText type="xsmall" variant="secondary" style={styles.statInterpretation}>
                Most extreme rotation toward ETH/altcoins in the period
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText type="small" variant="secondary" style={styles.statLabel}>
                Maximum
              </ThemedText>
              <ThemedText type="body" style={[styles.statValue, { color: successColor }]}>
                {stats.max < 0 ? '' : '+'}{stats.max.toFixed(2)}%
              </ThemedText>
              {stats.maxDate && (
                <ThemedText type="xsmall" style={styles.statDate}>
                  {new Date(stats.maxDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </ThemedText>
              )}
              <ThemedText type="xsmall" variant="secondary" style={styles.statInterpretation}>
                Most extreme rotation toward BTC/risk-off in the period
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.statItem}>
              <ThemedText type="small" variant="secondary" style={styles.statLabel}>
                Average
              </ThemedText>
              <ThemedText type="body" style={styles.statValue}>
                {stats.average < 0 ? '' : '+'}{stats.average.toFixed(2)}%
              </ThemedText>
              <ThemedText type="xsmall" variant="secondary" style={styles.statInterpretation}>
                {stats.average > 0 
                  ? "Overall trend favors BTC dominance" 
                  : stats.average < 0
                  ? "Overall trend favors ETH/altcoin rotation"
                  : "Balanced momentum over the period"}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.sm,
  },
  twoColumnContainer: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    minHeight: 80, // Ensure enough height for vertical centering
  },
  leftColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#a9a9a9',
    marginHorizontal: Spacing.md,
  },
  rightColumn: {
    flex: 1,
    justifyContent: "center",
  },
  value: {
    marginBottom: Spacing.xs,
  },
  label: {
    marginTop: Spacing.xs,
  },
  interpretation: {
    textAlign: "left",
    fontStyle: "italic",
    marginBottom: Spacing.xs,
  },
  description: {
    textAlign: "left",
  },
  statsSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#a9a9a9',
  },
  statsTitle: {
    marginBottom: Spacing.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: 100,
  },
  statLabel: {
    marginBottom: Spacing.xs / 2,
  },
  statValue: {
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  statDate: {
    marginBottom: Spacing.xs / 2,
    fontWeight: '500',
  },
  statInterpretation: {
    marginTop: Spacing.xs / 2,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});

