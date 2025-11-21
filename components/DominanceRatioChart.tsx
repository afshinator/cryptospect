import React, { useMemo } from 'react';
import { StyleSheet, useColorScheme } from "react-native";

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from "@/constants/theme";

// Import the generic chart renderer
import BtcAndEthDominanceChartRnChart from '@/components/dominance/BtcAndEthDominanceChartRnChart';

// --- CONFIGURATION CONSTANTS (Visuals & Data Prep) ---

const CHART_HEIGHT = 180; // Slightly smaller height for comparison chart
const LINE_STROKE_WIDTH = 2;

// Defined Colors (Ratio-specific colors)
const RATIO_COLOR = "#fde047"; // Yellow (for the ratio line)
const AVERAGE_COLOR = "#ef4444"; // Red (for the baseline)
const TRANSPARENT_COLOR = "#00000000";

// --- Component Props and Definition ---

// Re-defining the required type for clarity
interface HistoricalDominanceSnapshot {
  date: number; // UNIX timestamp
  btcDominance: number;
  ethDominance: number;
}

interface DominanceRatioChartProps {
  historicalData: HistoricalDominanceSnapshot[];
}

// Helper function to format the ratio for UI display
const formatRatio = (value: number) => value.toFixed(2);

export default function DominanceRatioChart({ historicalData }: DominanceRatioChartProps) {

  const colorScheme = useColorScheme();

  // Dynamic Axis Color based on Theme
  const dynamicAxisColor =
    colorScheme === "dark"
      ? Colors.dark.textSecondary
      : Colors.light.textSecondary;

  // 1. Data Calculation and Baseline Determination
  const { chartData, averageRatio, currentRatio } = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return { chartData: null, averageRatio: 0, currentRatio: 0 };
    }

    // Calculate the BTC/ETH Ratio for every day
    const ratioData = historicalData.map(item => {
      // BTC.D / ETH.D = Ratio (Avoid division by zero)
      return item.ethDominance > 0
        ? item.btcDominance / item.ethDominance
        : 0;
    });

    // Calculate the 180-day average ratio for the baseline
    const totalRatio = ratioData.reduce((sum, value) => sum + value, 0);
    const avgRatio = totalRatio / ratioData.length;

    // Create a flat line dataset for the average ratio (Reference Line equivalent)
    const averageLineData = ratioData.map(() => avgRatio);

    // Prepare chart data for react-native-chart-kit
    const dataForChart = {
      // Labels are not strictly needed for this chart, but kept for consistency
      labels: historicalData.map(() => ""),
      datasets: [
        {
          // The actual Ratio Line
          data: ratioData,
          color: () => RATIO_COLOR,
          strokeWidth: LINE_STROKE_WIDTH,
          withDots: false,
        },
        {
          // The Average Reference Line (Flat)
          data: averageLineData,
          color: () => AVERAGE_COLOR,
          strokeWidth: 1, // Thinner dashed line
          strokeDasharray: [4, 4],
          withDots: false,
        }
      ],
    };

    return {
      chartData: dataForChart,
      averageRatio: avgRatio,
      currentRatio: ratioData[ratioData.length - 1],
    };
  }, [historicalData]);

  if (!chartData) {
    return <ThemedText style={styles.loadingText}>Ratio data loading...</ThemedText>;
  }

  // 2. Chart Configuration
  const chartConfig = {
    backgroundColor: TRANSPARENT_COLOR,
    backgroundGradientFrom: TRANSPARENT_COLOR,
    backgroundGradientTo: TRANSPARENT_COLOR,
    decimalPlaces: 2, // Show 2 decimal places for the ratio
    color: (opacity = 1) => dynamicAxisColor,
    labelColor: (opacity = 1) => dynamicAxisColor,
    propsForDots: {
      r: "0",
      strokeWidth: "0",
    },
    propsForBackgroundLines: {
      strokeWidth: 0.5,
    },
    propsForLabels: {
      fontSize: 10,
    },
    fillShadowOpacity: 0,
    // Use a custom Y-Axis formatter to show the ratio value
    yAxisLabel: (value: string) => {
      const num = Number(value);
      return formatRatio(num);
    },
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.chartTitle}>
        BTC/ETH Dominance Rotation Signal
      </ThemedText>

      <ThemedText type="body" variant="secondary" style={styles.ratioDisplay}>
        Current: <ThemedText style={{ color: RATIO_COLOR, fontWeight: 'bold' }}>{formatRatio(currentRatio)}</ThemedText> |
        180D Avg: <ThemedText style={{ color: AVERAGE_COLOR, fontWeight: 'bold' }}>{formatRatio(averageRatio)}</ThemedText>
      </ThemedText>


      {/* RENDER THE CHART USING THE GENERIC RN RENDERER */}
      <BtcAndEthDominanceChartRnChart
        chartData={chartData}
        chartConfig={chartConfig}
        chartHeight={CHART_HEIGHT}
        yAxisSuffix="" // No suffix needed since the ratio is unitless
      />

      <ThemedText type="small" variant="secondary" style={styles.caption}>
        The red dashed line is the 180-day average. Above the red line indicates BTC over-dominance.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    // Add border/styling to make it look like a distinct card/component
  },
  chartTitle: {
    marginBottom: Spacing.xs,
  },
  ratioDisplay: {
    marginBottom: Spacing.sm,
    fontWeight: 'normal',
  },
  caption: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  loadingText: {
    padding: Spacing.xl,
    textAlign: 'center',
  }
});