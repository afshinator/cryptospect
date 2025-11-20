import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, useColorScheme } from "react-native";

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BarChart } from "react-native-chart-kit";

import { Colors, Spacing } from "@/constants/theme";

// --- CONFIGURATION CONSTANTS ---
const CHART_HEIGHT = 180; 
const TRANSPARENT_COLOR = "#00000000"; 
const BAR_COLOR = "#9ca3af"; // Gray for non-highlighted bars
const CURRENT_RATIO_COLOR = "#ef4444"; // Red for the current ratio marker

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
  const barColorFunctions = chartData && currentBinIndex >= 0 && chartData.datasets[0].data.length > 0
    ? chartData.datasets[0].data.map((_, index) => 
        (opacity = 1) => index === currentBinIndex ? CURRENT_RATIO_COLOR : BAR_COLOR
      )
    : chartData?.datasets[0].data.map(() => (opacity = 1) => BAR_COLOR) || [];

  const modifiedChartData = chartData ? {
    ...chartData,
    datasets: [
      {
        ...chartData.datasets[0],
        colors: barColorFunctions, // Array of color functions, one per bar
        color: (opacity = 1) => BAR_COLOR, // Fallback color (not used when colors array is provided)
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
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.chartTitle}>
        Historical Ratio Distribution
      </ThemedText>

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

      <ThemedText style={styles.caption} variant="secondary">
        Bars show the number of days spent in that ratio range. The tall bars are the &quot;fair value&quot; zone.
      </ThemedText>
      
      <ThemedText style={styles.currentRatioMarker}>
        Current ratio {' '}
        <ThemedText style={{ color: CURRENT_RATIO_COLOR, fontWeight: 'bold' }}>
          {formatRatio(currentRatio)}
        </ThemedText> falls near the {currentBinLabel} range.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.lg,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',    // paddingHorizontal: Spacing.lg,

    overflow: 'hidden', // Clip the chart if it's wider than container
    // Extend beyond container's horizontal padding to use full screen width
    marginRight:10,
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
    fontSize: 10,
    textAlign: 'center',
  },
  currentRatioMarker: {
    marginTop: Spacing.xs,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingText: {
    padding: Spacing.xl,
    textAlign: 'center',
  },
});
 