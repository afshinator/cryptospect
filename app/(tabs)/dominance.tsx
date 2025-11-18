// app/(tabs)/dominance.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { ActivityIndicator, Dimensions, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BACKEND_DOMINANCE_QUERY_KEY } from "@/constants/misc";
import {
  fetchHistoricalDominance,
  type HistoricalDominanceSnapshot
} from "@/utils/backendApi";
import { useQuery } from "@tanstack/react-query";

// Constants
const CHART_WIDTH = Dimensions.get('window').width - (Spacing.lg * 2);
const STALE_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours
const BTC_COLOR = "#FF9900";
const ETH_COLOR = "#627EEA";
const STROKE_WIDTH = 2;
const LEGEND_COLOR_WIDTH = 20;
const LEGEND_COLOR_HEIGHT = 3;

type ChartDataPoint = {
  date: number;
  btcDominance: number;
  ethDominance: number;
};

export default function DominanceScreen() {
  
  const { 
    data: historicalDominance, 
    isPending, 
    error 
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
            {error ? `Error: ${(error as Error).message}` : "No dominance data available."}
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          BTC vs ETH Dominance (Last 6 Months)
        </ThemedText>

        <ThemedText type="small" variant="secondary" style={styles.subtitle}>
          {historicalDominance.length} data points
        </ThemedText>

        {Platform.OS === 'web' ? (
          <ThemedView style={styles.webMessage}>
            <ThemedText type="body" style={{ textAlign: 'center' }}>
              Chart visualization is available on mobile devices.
            </ThemedText>
            <ThemedText type="small" variant="secondary" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
              View this page on iOS or Android to see the interactive chart.
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            {/* Chart will only render on native platforms */}
            <DominanceChart data={historicalDominance} />
          </>
        )}

        <ThemedView style={styles.legend}>
          <ThemedView style={styles.legendItem}>
            <ThemedView style={[styles.legendColor, { backgroundColor: BTC_COLOR }]} />
            <ThemedText type="small">BTC.D</ThemedText>
          </ThemedView>
          <ThemedView style={styles.legendItem}>
            <ThemedView style={[styles.legendColor, { backgroundColor: ETH_COLOR }]} />
            <ThemedText type="small">ETH.D</ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

// Separate component for the chart (only used on native)
function DominanceChart({ data }: { data: HistoricalDominanceSnapshot[] }) {
  // Dynamically import victory-native only on native platforms
  const { CartesianChart, Line } = require("victory-native");
  
  const chartData: ChartDataPoint[] = data.map(item => ({
    date: item.date,
    btcDominance: item.btcDominance,
    ethDominance: item.ethDominance,
  }));

  return (
    <CartesianChart
      data={chartData}
      xKey="date"
      yKeys={["btcDominance", "ethDominance"]}
      domainPadding={{ left: 50, right: 50, top: 30 }}
    >
      {({ points }: any) => (
        <>
          <Line
            points={points.btcDominance}
            color={BTC_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
          <Line
            points={points.ethDominance}
            color={ETH_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
        </>
      )}
    </CartesianChart>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  webMessage: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendColor: {
    width: LEGEND_COLOR_WIDTH,
    height: LEGEND_COLOR_HEIGHT,
  },
});