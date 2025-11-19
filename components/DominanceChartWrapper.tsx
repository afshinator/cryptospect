import React from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";
import RnChartKitLineChart from "./charts/RnChartKitLineChart";

// Chart Dimensions & Metrics
const CHART_HEIGHT = 200;

const LINE_STROKE_WIDTH_MAJOR = 2;
const LINE_STROKE_WIDTH_MINOR = 0.5;
const LABEL_FONT_SIZE_SMALL = 10;
const UI_DECIMAL_PRECISION = 0; // for y-axis

// Defined Colors (Asset-specific colors)
const BTC_COLOR = "#FF9900"; // Orange
const ETH_COLOR = "#627EEA"; // Blue
const TRANSPARENT_COLOR = "#00000000"; // Fully Transparent

// Legend Metrics
const LEGEND_COLOR_WIDTH = 20;
const LEGEND_COLOR_HEIGHT = 3;

// Re-defining the required type for clarity in this component
interface HistoricalDominanceSnapshot {
  date: number; // UNIX timestamp
  btcDominance: number;
  ethDominance: number;
  // ... other dominance fields
}

interface DominanceChartWrapperProps {
  dominanceData: HistoricalDominanceSnapshot[];
}

export default function DominanceChartWrapper({
  dominanceData,
}: DominanceChartWrapperProps) {
  const colorScheme = useColorScheme();

  // Dynamic Axis Color based on Theme (Uses theme secondary text for contrast)
  const dynamicAxisColor =
    colorScheme === "dark"
      ? Colors.dark.textSecondary
      : Colors.light.textSecondary;

  // --- Data preparation for chart-kit ---

  // 1. Prepare Labels (X-Axis) - Sample roughly every 15 days
  const labelSamplingRate = 15;

  const labels = dominanceData.map((item, index) => {
    const isSamplePoint = index % labelSamplingRate === 0;
    const isLastPoint = index === dominanceData.length - 1;

    if (isSamplePoint || isLastPoint) {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return "";
  });

  // 2. Prepare Data Series
  const btcData = dominanceData.map((item) => item.btcDominance);
  const ethData = dominanceData.map((item) => item.ethDominance);

  // The final chartData structure
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

  // The final chartConfig structure
  const chartConfig = {
    backgroundColor: TRANSPARENT_COLOR,
    backgroundGradientFrom: TRANSPARENT_COLOR,
    backgroundGradientTo: TRANSPARENT_COLOR,
    decimalPlaces: UI_DECIMAL_PRECISION,
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
    <>
      <RnChartKitLineChart
        chartData={chartData}
        chartConfig={chartConfig}
        chartHeight={CHART_HEIGHT}
        yAxisSuffix="%"
      />

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
    </>
  );
}

const styles = StyleSheet.create({
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
