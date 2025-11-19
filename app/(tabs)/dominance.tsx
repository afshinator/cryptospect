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
import { DominanceSection } from "@/components/DominanceSection";
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
              ? `❌ Error: ${(error as Error).message}`
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
  // Use usdtDominance as proxy for stablecoins (since historical data doesn't have full stablecoins breakdown)
  const latestStablecoinsD = latestData.usdtDominance;
  const latestOthersD = latestData.othersDominance;

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

          {/* LATEST SNAPSHOT CARD (Live Data) - Uses real-time data from CoinGecko /global endpoint */}
          <DominanceSection
            showAllFour={true}
          />

          {/* BTC/ETH Historical Line Chart (Main View) */}
          <ThemedView style={styles.chartWrapper}>
            <DominanceChartWrapper dominanceData={dominanceData} />
          </ThemedView>

          {/* MONTH LABEL - Centered label for the month span of the main chart */}
          <ThemedText style={styles.monthLabel} variant="secondary">
            {monthLabel}
          </ThemedText>

          <Collapsible title="Ratio Distribution Details">
            <ThemedText>
              The chart provides context for the current ratio by answering the
              question: &quot;How often has the ratio been at this level in the
              past?&quot;
            </ThemedText>
            <ThemedText>
              The &quot;Fair Value Zone&quot; on this chart is simply the range of ratios
              where the market has spent the most time. Tall Bars = Fair Value:
              The tallest bars represent the most frequent ratios. This is the
              statistical mean or mode of the data. The market generally
              gravitates toward this area. Meaning: When the ratio is inside
              this zone, it suggests the relationship between BTC&apos;s dominance
              and ETH&apos;s dominance is stable, balanced, and historically common.
              No significant, non-standard capital rotation is likely signaled.
            </ThemedText>
            <ThemedText>
              If the current ratio falls into one of the short-bar extreme
              zones, the chart is signaling an imbalance that often precedes a
              market rotation or correction in dominance.
            </ThemedText>
          </Collapsible>
          <ThemedView style={styles.chartWrapper}>
            <DominanceRatioHistogram historicalData={dominanceData} />
          </ThemedView>

          <Collapsible title="Ratio Chart Details">
            <ThemedText>
              This chart plots the BTC/ETH Dominance Ratio over time, providing
              a clear visual signal for whether market leadership is
              consolidating into Bitcoin or rotating toward Ethereum and the
              wider altcoin market.
            </ThemedText>

            <ThemedText>
              Rising Ratio (Moving Up): This means BTC.D is gaining strength
              faster than ETH.D, or ETH.D is weakening faster than BTC.D. This
              signals a consolidation of capital into Bitcoin, which is
              typically a defensive or &quot;risk-off&quot; move within the crypto space.
            </ThemedText>

            <ThemedText>
              Falling Ratio (Moving Down): This means ETH.D is gaining strength
              relative to BTC.D. This signals a rotation of capital into
              Ethereum and often serves as a lead indicator for the wider
              altcoin rally (the &quot;altcoin season&quot;).
            </ThemedText>
          </Collapsible>
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
    // marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: 12,
  },
});
