import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { ActivityIndicator, Dimensions, StyleSheet } from "react-native";

// 💡 NEW IMPORTS: React Query and Victory Charts
import {
  CRYPTO_DOMINANCE_HISTORY_QUERY_KEY
} from "@/constants/misc";
import {
  getHistoricalDominanceData,
  HistoricalDominanceSnapshot
} from "@/utils/coinGeckoHistoricalDominanceApi";
import { useQuery } from "@tanstack/react-query";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLegend,
  VictoryLine,
  VictoryTheme
} from 'victory-native';

const CHART_WIDTH = Dimensions.get('window').width - (Spacing.lg * 2);

export default function DominanceScreen() {
  
  // 1. Fetch historical data directly in the component using the established logic
  const { 
    data: historicalDominance, 
    isPending, 
    error 
  } = useQuery<HistoricalDominanceSnapshot[] | null>({
    queryKey: CRYPTO_DOMINANCE_HISTORY_QUERY_KEY,
    queryFn: getHistoricalDominanceData, 
    staleTime: 0, // Forces check of disk cache/network on every component mount
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  // 2. Handle Loading State
  if (isPending) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: Spacing.md }}>Loading Dominance Chart...</ThemedText>
      </ThemedView>
    );
  }

  // 3. Handle Error State
  if (error || !historicalDominance || historicalDominance.length === 0) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText type="subtitle">
          {error ? `Error fetching data: ${error.message}` : "No dominance data available."}
        </ThemedText>
      </ThemedView>
    );
  }

  // 4. Render the Chart
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>BTC vs ETH Dominance (Last 4 Weeks)</ThemedText>

      <VictoryChart
        theme={VictoryTheme.material}
        width={CHART_WIDTH}
        height={300}
        padding={{ top: 20, bottom: 50, left: 60, right: 20 }}
        scale={{ x: "time" }}
      >
        {/* Y-Axis: Percentage format */}
        <VictoryAxis 
          dependentAxis 
          tickFormat={(t) => `${t.toFixed(1)}%`} 
          style={{ grid: { stroke: "#ccc" } }}
        />
        
        {/* X-Axis: Date format */}
        <VictoryAxis 
          scale="time"
          tickCount={4} // Show roughly 4 major ticks (one per week)
          tickFormat={(t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          style={{ 
            tickLabels: { angle: -45, textAnchor: 'end', fontSize: 10 } 
          }}
        />

        {/* BTC Dominance Line */}
        <VictoryLine 
          data={historicalDominance}
          x="date"
          y="btcDominance"
          style={{ data: { stroke: "#FF9900", strokeWidth: 2 } }}
          name="BTC.D"
        />

        {/* ETH Dominance Line */}
        <VictoryLine 
          data={historicalDominance}
          x="date"
          y="ethDominance"
          style={{ data: { stroke: "#627EEA", strokeWidth: 2 } }}
          name="ETH.D"
        />

        {/* Legend */}
        <VictoryLegend x={CHART_WIDTH - 200} y={10}
          orientation="horizontal"
          gutter={20}
          data={[
            { name: "BTC.D", symbol: { fill: "#FF9900" } },
            { name: "ETH.D", symbol: { fill: "#627EEA" } },
          ]}
        />

      </VictoryChart>

    </ThemedView>
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
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  // Removed unused styles
});