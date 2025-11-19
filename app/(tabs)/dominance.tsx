import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ActivityIndicator, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// CHART PACKAGE
import { LineChart } from "react-native-chart-kit";

import { BACKEND_DOMINANCE_QUERY_KEY } from "@/constants/misc";
import {
  fetchHistoricalDominance,
  HistoricalDominanceSnapshot,
} from "@/utils/backendApi";
// Importing Theme Constants and Color Scheme Hook
import { Colors, Spacing } from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { useColorScheme } from "react-native";

// Import the new component
import LatestDominanceSnapshot from "@/components/LatestDominanceSnapshot";

// --- CONFIGURATION CONSTANTS ---

// Timing
const STALE_TIME_HOURS = 24;
const STALE_TIME_MS = STALE_TIME_HOURS * 60 * 60 * 1000;

// Chart Dimensions & Metrics
const CHART_HEIGHT = 300;

const LINE_STROKE_WIDTH_MAJOR = 2;
const LINE_STROKE_WIDTH_MINOR = 0.5;
const LABEL_FONT_SIZE_SMALL = 10;
const LABEL_FONT_SIZE_X_AXIS = 12;

// Calculated Dimensions
const SCREEN_WIDTH = Dimensions.get("window").width;
// const CHART_WIDTH = SCREEN_WIDTH - (Spacing.lg * 2);
const CHART_WIDTH = SCREEN_WIDTH;

// Defined Colors (Asset-specific colors)
const BTC_COLOR = "#FF9900"; // Orange
const ETH_COLOR = "#627EEA"; // Blue
const TRANSPARENT_COLOR = "#00000000"; // Fully Transparent

// Legend Metrics
const LEGEND_COLOR_WIDTH = 20;
const LEGEND_COLOR_HEIGHT = 3;

// Helper function to format percentages with consistent spacing and handle NaN
const formatPercentage = (value: number | string) => {
  const num = Number(value);
  // Using 2 decimal places here as this is for the *data card* presentation
  return isFinite(num) ? `${num.toFixed(2)}%` : "N/A";
};

export default function DominanceScreen() {
  const colorScheme = useColorScheme();

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

  if (isPending) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: Spacing.md }}>
            Loading Dominance Chart...
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

  // Dynamic Axis Color based on Theme (Uses theme secondary text for contrast)
  const dynamicAxisColor =
    colorScheme === "dark"
      ? Colors.dark.textSecondary
      : Colors.light.textSecondary;

  // --- Data preparation for react-native-chart-kit ---

  // 1. Prepare Labels (X-Axis)
  // We want to sample roughly every 15 days (half of 30) for a 6-month chart (180 days).
  // This provides 12-13 labels for better context.
  const labelSamplingRate = 15;

  const labels = dominanceData.map((item, index) => {
    // Check if the current point is a sample point OR the very last point
    const isSamplePoint = index % labelSamplingRate === 0;
    const isLastPoint = index === dominanceData.length - 1;

    if (isSamplePoint || isLastPoint) {
      // Format the date to show Month/Day (e.g., 10/22) for better context
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    // Return an empty string for non-labeled points
    return "";
  });

  // Determine the Month Label for display below the chart
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

  // 2. Prepare Data Series for the 2-way split (BTC and ETH only)
  const btcData = dominanceData.map((item) => item.btcDominance);
  const ethData = dominanceData.map((item) => item.ethDominance);

  // The 'datasets' array holds only the lines we want to plot
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: btcData,
        color: () => BTC_COLOR,
        strokeWidth: LINE_STROKE_WIDTH_MAJOR,
        withDots: false,
      },
      {
        data: ethData,
        color: () => ETH_COLOR,
        strokeWidth: LINE_STROKE_WIDTH_MAJOR,
        withDots: false,
      },
    ],
  };

  const latestData = dominanceData[dominanceData.length - 1];
  const latestBtcD = latestData.btcDominance;
  const latestEthD = latestData.ethDominance;

  const latestDate = new Date(latestData.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const chartConfig = {
    backgroundColor: TRANSPARENT_COLOR,
    backgroundGradientFrom: TRANSPARENT_COLOR,
    backgroundGradientTo: TRANSPARENT_COLOR,
    decimalPlaces: 0,
    color: (opacity = 1) => dynamicAxisColor,
    labelColor: (opacity = 1) => dynamicAxisColor,
    propsForDots: {
      r: "0",
      strokeWidth: "0",
    },
    propsForBackgroundLines: {
      strokeWidth: LINE_STROKE_WIDTH_MINOR,
    },
    propsForLabels: {
      fontSize: LABEL_FONT_SIZE_SMALL,
    },
    // Set fill shadow opacity to 0 to remove the area fill
    fillShadowOpacity: 0,
    // Custom Y-Axis Labeling: 0, 20, 40, 60, 80, 100
    yAxisLabel: (value: string) => {
      const num = Number(value);
      if (num % 20 === 0 && num >= 0 && num <= 100) {
        return `${num}`;
      }
      return "";
    },
  };
  // --- End Data preparation ---

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText type="large" style={styles.title}>
          Dominance History
        </ThemedText>

        <ThemedText type="small" variant="secondary" style={styles.subtitle}>
          Historical Market Dominance (BTC & ETH)
        </ThemedText>

        <LatestDominanceSnapshot
          latestBtcD={latestBtcD}
          latestEthD={latestEthD}
          latestDate={latestDate}
        />

        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          chartConfig={chartConfig}
          bezier
          withShadow={false}
          withInnerLines={false}
          withOuterLines={false}
          fromZero={true}
          yAxisSuffix="%"
          getDotColor={() => TRANSPARENT_COLOR}
          style={styles.chart}
        />
      </ThemedView>

      {/* MONTH LABEL - Centered label for the month span */}
      <ThemedText style={styles.monthLabel} variant="secondary">
        {monthLabel}
      </ThemedText>

      {/* LEGEND (Only BTC and ETH) */}
      <ThemedView style={styles.legend}>
        <ThemedView style={styles.legendItem}>
          <ThemedView
            style={[styles.legendColor, { backgroundColor: BTC_COLOR }]}
          />
          <ThemedText type="small">BTC.D</ThemedText>
        </ThemedView>
        <ThemedView style={styles.legendItem}>
          <ThemedView
            style={[styles.legendColor, { backgroundColor: ETH_COLOR }]}
          />
          <ThemedText type="small">ETH.D</ThemedText>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
    padding: Spacing.sm,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: Spacing.xs,
    marginLeft: 16,
  },
  subtitle: {
    marginBottom: Spacing.md,
    marginLeft: 16,
  },
  chart: {
    // marginVertical: Spacing.sm,
  },
  monthLabel: {
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    fontSize: LABEL_FONT_SIZE_X_AXIS,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendColor: {
    width: LEGEND_COLOR_WIDTH,
    height: LEGEND_COLOR_HEIGHT,
  },
});
