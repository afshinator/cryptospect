import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BACKEND_DOMINANCE_QUERY_KEY } from "@/constants/misc";
import {
  fetchHistoricalDominance,
  HistoricalDominanceSnapshot,
} from "@/utils/backendApi";
// Importing Theme Constants
import { Spacing } from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";

// Import the new components
import DominanceChartWrapper from "@/components/DominanceChartWrapper";
import DominanceRatioChart from "@/components/DominanceRatioChart";
import DominanceRatioHistogram from "@/components/DominanceRatioHistogram";
import LatestDominanceSnapshot from "@/components/LatestDominanceSnapshot";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Collapsible } from "@/components/ui/collapsible";

// --- CONFIGURATION CONSTANTS (Only timing left here) ---

// Timing
const STALE_TIME_HOURS = 24;
const STALE_TIME_MS = STALE_TIME_HOURS * 60 * 60 * 1000;

export default function DominanceScreen() {
  // 1. Data Fetch
  const {
    data: historicalDominance,
    isPending,
    error,
  } = useQuery<HistoricalDominanceSnapshot[]>({
    queryKey: BACKEND_DOMINANCE_QUERY_KEY,
    queryFn: fetchHistoricalDominance,
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });

  // 2. Loading and Error Handling
  if (isPending) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: Spacing.md }}>
            Loading Dominance Data...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error || !historicalDominance || historicalDominance.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={[styles.container, styles.center]}>
          <ThemedText type="subtitle">
            {error
              ? `Error: ${(error as Error).message}`
              : "No dominance data available."}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const dominanceData = historicalDominance;

  // 3. Extract Latest Data for Snapshot Card
  const latestData = dominanceData[dominanceData.length - 1];
  const latestBtcD = latestData.btcDominance;
  const latestEthD = latestData.ethDominance;

  const latestDate = new Date(latestData.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // 4. Determine the Month Label for display below the main chart
  const firstDate = new Date(dominanceData[0].date);
  const lastDate = new Date(dominanceData[dominanceData.length - 1].date);

  let monthLabel;
  if (
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDate.getFullYear() === lastDate.getFullYear()
  ) {
    monthLabel = firstDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  } else {
    // Show the range of months covered
    const startMonth = firstDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const endMonth = lastDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    monthLabel = `${startMonth} - ${endMonth}`;
  }

  // 5. Render Components
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenContainer>
        <ThemedView style={styles.container}>

          <ThemedText type="large" style={styles.title}>
            Dominance Dashboard
          </ThemedText>

          <ThemedText type="small" variant="secondary" style={styles.subtitle}>
            Market Composition and Rotation Signals
          </ThemedText>

          {/* LATEST SNAPSHOT CARD (Live Data) */}
          <LatestDominanceSnapshot
            latestBtcD={latestBtcD}
            latestEthD={latestEthD}
            latestDate={latestDate}
          />

          {/* BTC/ETH Historical Line Chart (Main View) */}
          <ThemedView style={styles.chartWrapper}>
            <DominanceChartWrapper dominanceData={dominanceData} />
          </ThemedView>

          {/* MONTH LABEL - Centered label for the month span of the main chart */}
          <ThemedText style={styles.monthLabel} variant="secondary">
            {monthLabel}
          </ThemedText>

          <Collapsible title="Details">
            <ThemedText>
              The chart provides context for the current ratio by answering the
              question: "How often has the ratio been at this level in the
              past?"
            </ThemedText>
          </Collapsible>
          <ThemedView style={styles.chartWrapper}>
            <DominanceRatioHistogram historicalData={dominanceData} />
          </ThemedView>

          {/* BTC/ETH Dominance Ratio Chart (New Rotational Signal) */}
          <ThemedView style={styles.chartWrapper}>
            <DominanceRatioChart historicalData={dominanceData} />
          </ThemedView>
        </ThemedView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  chartWrapper: {
    // paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  subtitle: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.lg,
  },
  monthLabel: {
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: 12,
  },
});
