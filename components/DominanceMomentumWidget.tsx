// components/DominanceMomentumWidget.tsx

import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, StyleSheet } from "react-native";

import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BACKEND_DOMINANCE_QUERY_KEY } from "@/constants/misc";
import { Spacing } from "@/constants/theme";
import { useCalculatePercentageChange } from "@/hooks/use-dominance-calculations";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  fetchHistoricalDominance,
  HistoricalDominanceSnapshot,
} from "@/utils/backendApi";

// Timing
const STALE_TIME_HOURS = 24;
const STALE_TIME_MS = STALE_TIME_HOURS * 60 * 60 * 1000;

export function DominanceMomentumWidget() {
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
      <ThemedView style={styles.valueContainer}>
        <ThemedText
          type="large"
          style={[styles.value, { color: changeColor }]}
        >
          {sign}
          {currentChange.toFixed(2)}%
        </ThemedText>
        <ThemedText type="small" variant="secondary" style={styles.label}>
          7-Day Change
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.interpretationContainer}>
        <ThemedText type="small" variant="secondary" style={styles.interpretation}>
          {interpretation}
        </ThemedText>
      </ThemedView>
      <ThemedText type="small" variant="secondary" style={styles.description}>
        {isPositive
          ? "BTC/ETH ratio accelerating toward BTC"
          : "BTC/ETH ratio accelerating toward ETH"}
      </ThemedText>
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.sm,
  },
  valueContainer: {
    alignItems: "center",
    // marginVertical: Spacing.md,
  },
  value: {
    marginBottom: Spacing.xs,
  },
  label: {
    marginTop: Spacing.xs,
  },
  interpretationContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  interpretation: {
    textAlign: "center",
    fontStyle: "italic",
  },
  description: {
    textAlign: "center",
    // marginTop: Spacing.xs,
  },
  loadingText: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});

