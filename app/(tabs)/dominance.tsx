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
import { DominanceMomentumWidget } from "@/components/dominance/DominanceMomentumWidget";
import DominancePercentageChangeChart from "@/components/dominance/DominancePercentageChangeChart";
import DominanceRatioChart from "@/components/dominance/DominanceRatioChart";
import DominanceRatioHistogram from "@/components/dominance/DominanceRatioHistogram";
import { LatestDominancePercentages } from "@/components/dominance/LatestDominancePercentages";
import { ScreenContainer } from "@/components/ScreenContainer";

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

          {/* Dominance Momentum Widget */}
          <View style={styles.spacingWrapper}>
            <DominanceMomentumWidget extendedInfo={true} />
          </View>

          <HistoricalDataStatus isPending={isPending} error={error as Error | null} />

          {/* Charts and details - Only show when data is available */}
          {dominanceData && dominanceData.length > 0 && (
            <>
              {/* BTC/ETH Historical Line Chart (Main View) - Only show when data is available */}

              <View style={styles.spacingWrapper}>
                <BtcAndEthDominanceChartWrapper
                  dominanceData={dominanceData}
                  monthLabel={monthLabel}
                />
              </View>

              <View style={styles.spacingWrapper}>
                <DominanceRatioChart historicalData={dominanceData} />
              </View>

              <View style={styles.spacingWrapper}>
                <DominanceRatioHistogram historicalData={dominanceData} />
              </View>

              <ThemedView style={styles.spacingWrapper}>
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