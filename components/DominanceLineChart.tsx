import React from 'react'; // <-- ADD THIS IMPORT
import { Dimensions, StyleSheet } from "react-native";
// CHART PACKAGE
import { LineChart } from "react-native-chart-kit";

// Importing Theme Constants and Color Scheme Hook
import { Colors, Spacing } from "@/constants/theme";

// --- CONFIGURATION CONSTANTS (Moved from dominance.tsx) ---

// Chart Dimensions & Metrics
const CHART_HEIGHT = 300;
const LINE_STROKE_WIDTH_MAJOR = 2;
const LINE_STROKE_WIDTH_MINOR = 0.5;
const LABEL_FONT_SIZE_SMALL = 10;
const UI_DECIMAL_PRECISION = 0; // for y-axis

// Calculated Dimensions
const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH;

// Defined Colors (Asset-specific colors)
const BTC_COLOR = "#FF9900"; // Orange
const ETH_COLOR = "#627EEA"; // Blue
const TRANSPARENT_COLOR = "#00000000"; // Fully Transparent

// --- Component Props and Definition ---

interface HistoricalDominanceSnapshot {
  date: string;
  btcDominance: number;
  ethDominance: number;
}

interface DominanceLineChartProps {
  dominanceData: HistoricalDominanceSnapshot[];
  colorScheme: 'light' | 'dark' | null;
}

// FIX: Explicitly assign the props type to the function component signature
export default function DominanceLineChart({ 
  dominanceData, 
  colorScheme 
}: DominanceLineChartProps) { // <-- FIX IS HERE
  
  // Dynamic Axis Color based on Theme
  const dynamicAxisColor =
    colorScheme === "dark"
      ? Colors.dark.textSecondary
      : Colors.light.textSecondary;

  // --- Data preparation for react-native-chart-kit (Moved from dominance.tsx) ---

  // 1. Prepare Labels (X-Axis) 
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
  
  // 3. Chart Configuration
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
    yAxisLabel: (value: string) => {
      const num = Number(value);
      if (num % 20 === 0 && num >= 0 && num <= 100) {
        return `${num}`;
      }
      return "";
    },
  };

  // --- Render Chart ---
  return (
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
  );
}

const styles = StyleSheet.create({
    chart: {
        marginVertical: Spacing.sm,
    },
});
 