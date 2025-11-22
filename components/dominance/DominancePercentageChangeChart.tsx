// components/DominancePercentageChangeChart.tsx
import React from 'react';
import { StyleSheet, useColorScheme } from "react-native";

import { SectionContainer } from '@/components/SectionContainer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from "@/constants/theme";


// Import the generic chart renderer
import GenericRnChart from '@/components/dominance/GenericRnChart';
import { useCalculatePercentageChange } from '@/hooks/use-dominance-calculations';
import { Collapsible } from '../ui/collapsible';

// --- CONFIGURATION CONSTANTS (Visuals) ---
const CHART_HEIGHT = 180;
const TRANSPARENT_COLOR = "#00000000";

// Defined Colors for the lines (passed to the hook)
const MOMENTUM_COLOR = "#3b82f6"; // Blue
const ZERO_LINE_COLOR = "#a1a1aa"; // Gray

// --- Component Props and Definition ---

interface HistoricalDominanceSnapshot {
  date: number; // UNIX timestamp
  btcDominance: number;
  ethDominance: number;
}

interface DominancePercentageChangeChartProps {
  historicalData: HistoricalDominanceSnapshot[];
}

// Helper function to format the percentage change
const formatPercentage = (value: number) => value.toFixed(2);

export default function DominancePercentageChangeChart({ historicalData }: DominancePercentageChangeChartProps) {

  const colorScheme = useColorScheme();

  // Dynamic Axis Color based on Theme
  const dynamicAxisColor =
    colorScheme === "dark"
      ? Colors.dark.textSecondary
      : Colors.light.textSecondary;

  // 1. Data Calculation (from the separated hook in the new location)
  const { chartData, currentChange } = useCalculatePercentageChange(
    historicalData,
    MOMENTUM_COLOR,
    ZERO_LINE_COLOR
  );

  if (!chartData) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Momentum data loading or insufficient data history...</ThemedText>
      </ThemedView>
    );
  }

  // 2. Chart Configuration (specific to react-native-chart-kit)
  const chartConfig = {
    backgroundColor: TRANSPARENT_COLOR,
    backgroundGradientFrom: TRANSPARENT_COLOR,
    backgroundGradientTo: TRANSPARENT_COLOR,
    decimalPlaces: 2,
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
    // Custom Y-Axis formatter to show the percentage sign
    yAxisLabel: (value: string) => {
      const num = Number(value);
      return formatPercentage(num);
    },
  };

  return (
    <SectionContainer>
      <ThemedText type="subtitle" style={styles.chartTitle}>
        7-Day Ratio Momentum (Velocity)
      </ThemedText>

      <Collapsible title="Momentum Chart Details">
        <ThemedText type="body" style={styles.explanatoryText}>
          This chart filters out long-term trends to highlight short-term rotational velocity and momentum. It plots the 7-day percentage change of the BTC/ETH Dominance Ratio.
        </ThemedText>
        <ThemedText type="body" style={styles.explanatoryText}>
          <ThemedText type="bodySemibold" >Sharp Spikes Above 0%</ThemedText>: Indicates a sudden, strong rotational momentum into BTC within the last week. This is often a sign of market defensiveness or a flight to safety within the crypto market.
        </ThemedText>
        <ThemedText type="body" style={styles.explanatoryText}>
          <ThemedText type="bodySemibold" >Sharp Dips Below 0%</ThemedText>: Indicates a sudden, strong rotational momentum into ETH (and potentially wider altcoins) within the last week. This is often a sign of increasing risk appetite or rotation out of BTC.
        </ThemedText>
      </Collapsible>

      <ThemedText type="body" variant="secondary" style={styles.changeDisplay}>
        Current 7D Change:
        <ThemedText
          style={{
            color: currentChange >= 0 ? Colors.light.success : Colors.light.error,
            fontWeight: 'bold'
          }}>
          {currentChange >= 0 ? '+' : ''}{formatPercentage(currentChange)}%
        </ThemedText>
      </ThemedText>


      {/* RENDER THE CHART USING THE GENERIC RN RENDERER */}
      <GenericRnChart
        chartData={chartData}
        chartConfig={chartConfig}
        chartHeight={CHART_HEIGHT}
        yAxisSuffix="%"
      />

      <ThemedText type="small" variant="secondary" style={styles.caption}>
        Positive velocity (above 0%) indicates recent rotation into BTC; negative velocity indicates rotation into ETH.
      </ThemedText>
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: Spacing.xl,
  },
  chartTitle: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  changeDisplay: {
    marginBottom: Spacing.sm,
    fontWeight: 'normal',
    marginLeft: Spacing.lg,
  },
  caption: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    textAlign: 'center',
  },
  explanatoryText: {
    marginBottom: Spacing.sm,
  },
});