import React, { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, useColorScheme } from "react-native";

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BarChart } from "react-native-chart-kit";

import { SectionContainer } from '@/components/SectionContainer';
import { Colors, Spacing } from "@/constants/theme";
import { Collapsible } from '../ui/collapsible';

// --- CONFIGURATION CONSTANTS ---
const CHART_HEIGHT = 180;
const TRANSPARENT_COLOR = "#00000000";
const BAR_COLOR = "#9ca3af"; // Gray for non-highlighted bars
const CURRENT_RATIO_COLOR = "#3b82f6"; // Red for the current ratio marker

// Calculated Dimensions
const SCREEN_WIDTH = Dimensions.get("window").width;
// Add extra width to make chart wider (adjust this value as needed)
const CHART_WIDTH_PADDING = 0; // Extra pixels to add for width
const CHART_WIDTH = SCREEN_WIDTH + CHART_WIDTH_PADDING;

// The number of buckets (bins) we want to divide the data into
const NUM_BINS = 10;

// --- Component Props and Definition ---

interface HistoricalDominanceSnapshot {
  date: number;
  btcDominance: number;
  ethDominance: number;
}

interface DominanceRatioHistogramProps {
  historicalData: HistoricalDominanceSnapshot[];
}

// Helper function to format the ratio for UI display
const formatRatio = (value: number) => value.toFixed(2);


export default function DominanceRatioHistogram({ historicalData }: DominanceRatioHistogramProps) {

  const colorScheme = useColorScheme();

  // Dynamic Axis Color based on Theme
  const dynamicAxisColor =
    colorScheme === "dark"
      ? Colors.dark.textSecondary
      : Colors.light.textSecondary;

  // 1. Data Calculation: Ratio, Bins, and Distribution
  const { chartData, currentRatio, binLabels, yAxisLabelFunc, maxDays } = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      // Return null for chartData to trigger loading state
      return { chartData: null, currentRatio: 0, binLabels: [], yAxisLabelFunc: () => "" };
    }

    // A. Calculate all Ratios
    const ratios = historicalData.map(item => {
      return item.ethDominance > 0
        ? item.btcDominance / item.ethDominance
        : 0;
    }).filter(ratio => ratio > 0);

    if (ratios.length === 0) {
      return { chartData: null, currentRatio: 0, binLabels: [], yAxisLabelFunc: () => "" };
    }

    const currentR = ratios[ratios.length - 1];

    // B. Determine Binning parameters
    const minRatio = Math.min(...ratios);
    const maxRatio = Math.max(...ratios);
    const range = maxRatio - minRatio;
    const binSize = range / NUM_BINS;

    // C. Create Bins (Histogram)
    const bins = Array(NUM_BINS).fill(0);
    const labels = [];

    // Assign ratios to bins and create labels
    for (let i = 0; i < NUM_BINS; i++) {
      const lowerBound = minRatio + i * binSize;
      const upperBound = minRatio + (i + 1) * binSize;

      labels.push(formatRatio(lowerBound));

      ratios.forEach(ratio => {
        if (ratio >= lowerBound && (ratio < upperBound || (i === NUM_BINS - 1 && ratio <= upperBound))) {
          bins[i]++;
        }
      });
    }

    const mDays = Math.max(...bins);

    // D. Prepare data for BarChart
    // Note: We'll set the color function after calculating currentBinIndex
    const dataForChart = {
      labels: labels,
      datasets: [
        {
          data: bins,
          color: (opacity = 1) => BAR_COLOR, // Default color, will be overridden
        }
      ],
    };

    // E. Define Y-Axis Label function based on maxDays
    const yAxisFunc = (value: string) => {
      const num = Number(value);
      // Only display the 0 and the max days count for the scale
      if (num === 0 || num === mDays) {
        return `${num}`;
      }
      return '';
    };

    return {
      chartData: dataForChart,
      currentRatio: currentR,
      binLabels: labels,
      yAxisLabelFunc: yAxisFunc,
      maxDays: mDays,
    };
  }, [historicalData]);


  if (!chartData) {
    return <ThemedText style={styles.loadingText}>Ratio data loading...</ThemedText>;
  }

  // Find the label and index for the bin the current ratio falls into
  let currentBinLabel = '';
  let currentBinIndex = -1;
  if (binLabels.length > 0) {
    const minRatio = Number(binLabels[0]);
    const binSize = Number(binLabels[1]) - Number(binLabels[0]);

    let binIndex = Math.floor((currentRatio - minRatio) / binSize);

    if (binIndex >= NUM_BINS) {
      binIndex = NUM_BINS - 1;
    }
    if (binIndex < 0) {
      binIndex = 0;
    }

    currentBinIndex = binIndex;
    currentBinLabel = binLabels[binIndex];
  }

  // 2. Create modified chart data with colored bar for current ratio
  // react-native-chart-kit BarChart supports per-bar coloring via colors array of functions
  // Requires withCustomBarColorFromData={true} and flatColor={true} props
  const modifiedChartData = chartData && chartData.datasets[0].data.length > 0 ? {
    ...chartData,
    datasets: [
      {
        ...chartData.datasets[0],
        // Create colors array: one function per bar
        colors: chartData.datasets[0].data.map((_, index) => {
          return (opacity = 1) => {
            // Color the current ratio bar red, others gray
            return index === currentBinIndex ? CURRENT_RATIO_COLOR : BAR_COLOR;
          };
        }),
      }
    ],
  } : null;

  // 3. Chart Configuration
  const chartConfig = {
    backgroundColor: TRANSPARENT_COLOR,
    backgroundGradientFrom: TRANSPARENT_COLOR,
    backgroundGradientTo: TRANSPARENT_COLOR,
    decimalPlaces: 0,
    color: (opacity = 1) => dynamicAxisColor,
    labelColor: (opacity = 1) => dynamicAxisColor,
    barPercentage: 0.8,
    propsForLabels: {
      fontSize: 8,
    },
    fillShadowOpacity: 0,
    // Custom Y-Axis Labeling: Only show 0 and max, return empty string for others to avoid underlines
    yAxisLabel: (value: string) => {
      const num = Number(value);
      // Only display the 0 and the max days count for the scale
      if (num === 0 || (maxDays !== undefined && num === maxDays)) {
        return `${num}`;
      }
      return ""; // Empty string should not show underline
    },
  };

  return (
    <SectionContainer>
      <ThemedText type="subtitle" style={styles.chartTitle}>
        Historical Ratio Distribution
      </ThemedText>

      <Collapsible title="Details">
        <ThemedText type="body" style={styles.explanatoryText}>
          Shows how often has the above ratio has been at this aproximate level in the past.
        </ThemedText>
        <ThemedText type="body" style={styles.explanatoryText}>

          <ThemedText type="bodySemibold" >Tall Bars = Fair Value:</ThemedText>
          The tallest bars represent the most frequent ratios. This is the
          statistical mean or mode of the data. The market generally
          gravitates toward this area.
          The <ThemedText type="bodySemibold" >Fair Value Zone</ThemedText> on this chart is
          the range of ratios where the market has spent the most time.

        </ThemedText>
        <ThemedText type="body" style={styles.explanatoryText}>
          Meaning: When the ratio is inside
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
      {/* RENDER THE CHART (simulated histogram) */}
      {modifiedChartData && (
        <ThemedView style={styles.chartWrapper}>
          <BarChart
            data={modifiedChartData}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={chartConfig}
            fromZero={true}
            showValuesOnTopOfBars={false}
            withInnerLines={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withCustomBarColorFromData={true}
            flatColor={true}
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
          />
        </ThemedView>
      )}

      <ThemedText type="small" variant="secondary" style={styles.caption}>
        Bars show the number of days spent in that ratio range. The tall bars are the &quot;fair value&quot; zone.
      </ThemedText>

      <ThemedText type="xsmall" style={styles.currentRatioMarker}>
        Current ratio {' '}
        <ThemedText type="xsmall" style={{ color: CURRENT_RATIO_COLOR, fontWeight: 'bold' }}>
          {formatRatio(currentRatio)}
        </ThemedText> falls near the {currentBinLabel} range.
      </ThemedText>
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',    // paddingHorizontal: Spacing.lg,

    overflow: 'hidden', // Clip the chart if it's wider than container
    // Extend beyond container's horizontal padding to use full screen width
    marginRight: 10,
  },
  chart: {
    // No adjustments - baseline
  },
  chartTitle: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  ratioDisplay: {
    marginBottom: Spacing.sm,
    fontWeight: 'normal',
    marginLeft: Spacing.lg,
  },
  caption: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    ...(Platform.OS === 'web' && { fontSize: 16 }), // Larger font on web
  },
  currentRatioMarker: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  loadingText: {
    padding: Spacing.xl,
    textAlign: 'center',
  },
  explanatoryText: {
    marginBottom: Spacing.sm,
  },
});
