import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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
import BtcAndEthDominanceChartWrapper from "@/components/dominance/BtcAndEthDominanceChartWrapper";
import { LatestDominancePercentages } from "@/components/dominance/LatestDominancePercentages";
import DominancePercentageChangeChart from "@/components/DominancePercentageChangeChart";
import DominanceRatioChart from "@/components/DominanceRatioChart";
import DominanceRatioHistogram from "@/components/DominanceRatioHistogram";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Collapsible } from "@/components/ui/collapsible";

// --- CONFIGURATION CONSTANTS (Only timing left here) ---

// Timing
const STALE_TIME_HOURS = 24;
const STALE_TIME_MS = STALE_TIME_HOURS * 60 * 60 * 1000;

interface HistoricalDataStatusProps {
  isPending: boolean;
  error: Error | null;
}

function HistoricalDataStatus({ isPending, error }: HistoricalDataStatusProps) {
  return (
    <>
      {/* Loading message for backend data */}
      {isPending && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <ThemedText type="small" variant="secondary" style={styles.loadingText}>
            Loading historical data...
          </ThemedText>
        </ThemedView>
      )}

      {/* Error message for backend data */}
      {error && !isPending && (
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="small" variant="error">
            ⚠️ Error loading historical data: {error.message}
          </ThemedText>
        </ThemedView>
      )}
    </>
  );
}

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

  // 2. Prepare data (will be null if still loading or error)
  const dominanceData = historicalDominance && historicalDominance.length > 0 ? historicalDominance : null;

  // 3. Extract Latest Data for Snapshot Card (if available)
  const latestData = dominanceData ? dominanceData[dominanceData.length - 1] : null;
  const latestBtcD = latestData?.btcDominance;
  const latestEthD = latestData?.ethDominance;
  // Use usdtDominance as proxy for stablecoins (since historical data doesn't have full stablecoins breakdown)
  const latestStablecoinsD = latestData?.usdtDominance;
  const latestOthersD = latestData?.othersDominance;

  const latestDate = latestData
    ? new Date(latestData.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : null;

  // 4. Determine the Month Label for display below the main chart (if data available)
  let monthLabel = "";
  if (dominanceData && dominanceData.length > 0) {
    const firstDate = new Date(dominanceData[0].date);
    const lastDate = new Date(dominanceData[dominanceData.length - 1].date);

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
  }

  // 5. Render Components
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenContainer>
        <ThemedView style={styles.container}>
          <ThemedText type="large" style={styles.title}>
            Coin Dominance
          </ThemedText>

          <ThemedText type="small" variant="secondary" style={styles.subtitle}>
            Market Composition and Rotation Signals
          </ThemedText>

          {/* LATEST SNAPSHOT CARD (Live Data) - Uses real-time data from CoinGecko /global endpoint */}
          <View style={styles.spacingWrapper}>
            <LatestDominancePercentages
              showAllFour={true}
            />
          </View>

          <HistoricalDataStatus isPending={isPending} error={error as Error | null} />

          {/* BTC/ETH Historical Line Chart (Main View) - Only show when data is available */}
          {dominanceData && dominanceData.length > 0 && (
            <View style={styles.spacingWrapper}>
              <BtcAndEthDominanceChartWrapper
                dominanceData={dominanceData}
                monthLabel={monthLabel}
              /></View>
          )}


          {/* Charts and details - Only show when data is available */}
          {dominanceData && dominanceData.length > 0 && (
            <>
              {/* === CHART 1: RATIO LINE CHART === */}
              <Collapsible title="Ratio Chart Details">
                <ThemedText type="body" style={styles.explanatoryText}>
                  This chart plots the BTC/ETH Dominance Ratio over time, providing
                  a clear visual signal for whether market leadership is
                  consolidation into Bitcoin or rotating toward Ethereum and the
                  wider altcoin market.
                </ThemedText>

                <ThemedText type="body" style={styles.explanatoryText}>
                  Rising Ratio (Moving Up): This means BTC.D is gaining strength
                  faster than ETH.D, or ETH.D is weakening faster than BTC.D. This
                  signals a consolidation of capital into Bitcoin, which is
                  typically a defensive or &quot;risk-off&quot; move within the crypto space.
                </ThemedText>

                <ThemedText type="body" style={styles.explanatoryText}>
                  Falling Ratio (Moving Down): This means ETH.D is gaining strength
                  relative to BTC.D. This signals a rotation of capital into
                  Ethereum and often serves as a lead indicator for the wider
                  altcoin rally (the &quot;altcoin season&quot;).
                </ThemedText>
              </Collapsible>
              <ThemedView style={styles.chartWrapper}>
                <DominanceRatioChart historicalData={dominanceData} />
              </ThemedView>

              {/* === CHART 2: RATIO HISTOGRAM === */}
              <Collapsible title="Ratio Distribution Details">
                <ThemedText type="body" style={styles.explanatoryText}>
                  The chart provides context for the current ratio by answering the
                  question: &quot;How often has the ratio been at this level in the
                  past?&quot;
                </ThemedText>
                <ThemedText type="body" style={styles.explanatoryText}>
                  The &quot;Fair Value Zone&quot; on this chart is simply the range of ratios
                  where the market has spent the most time. Tall Bars = Fair Value:
                  The tallest bars represent the most frequent ratios. This is the
                  statistical mean or mode of the data. The market generally
                  gravitates toward this area. Meaning: When the ratio is inside
                  this zone, it suggests the relationship between BTC&apos;s dominance
                  and ETH&apos;s dominance is stable, balanced, and historically common.
                  No significant, non-standard capital rotation is likely signaled.
                </ThemedText>
                <ThemedText type="body" style={styles.explanatoryText}>
                  If the current ratio falls into one of the short-bar extreme
                  zones, the chart is signaling an imbalance that often precedes a
                  market rotation or correction in dominance.
                </ThemedText>
              </Collapsible>
              <ThemedView style={styles.histogramWrapper}>
                <DominanceRatioHistogram historicalData={dominanceData} />
              </ThemedView>

              {/* === CHART 3: PERCENTAGE CHANGE INDICATOR */}
              <Collapsible title="Momentum Chart Details">
                <ThemedText type="body" style={styles.explanatoryText}>
                  This chart filters out long-term trends to highlight short-term rotational velocity and momentum. It plots the 7-day percentage change of the BTC/ETH Dominance Ratio.
                </ThemedText>
                <ThemedText type="body" style={styles.explanatoryText}>
                  Sharp Spikes Above 0%: Indicates a sudden, strong rotational momentum into BTC within the last week. This is often a sign of market defensiveness or a flight to safety within the crypto market.
                </ThemedText>
                <ThemedText type="body" style={styles.explanatoryText}>
                  Sharp Dips Below 0%: Indicates a sudden, strong rotational momentum into ETH (and potentially wider altcoins) within the last week. This is often a sign of increasing risk appetite or rotation out of BTC.
                </ThemedText>
              </Collapsible>
              <ThemedView style={styles.chartWrapper}>
                <DominancePercentageChangeChart historicalData={dominanceData} />
              </ThemedView>
            </>
          )}
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
  spacingWrapper: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md
  },
  chartWrapper: {
    // paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  histogramWrapper: {
    marginBottom: Spacing.xl,
    marginLeft: -30,
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  loadingText: {
    // Text styling handled by ThemedText
  },
  errorContainer: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  explanatoryText: {
    marginBottom: Spacing.sm,
  },
});