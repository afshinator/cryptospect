import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

// Calculated Dimensions are kept here since they are directly needed by the RN Chart Kit component
const SCREEN_WIDTH = Dimensions.get("window").width;
// Add extra width to account for chart-kit's internal padding and prevent label cutoff
// The chart-kit library needs extra space for labels, especially on the right side
const CHART_WIDTH_PADDING = 40; // Extra pixels to add for label space
const CHART_WIDTH = SCREEN_WIDTH + CHART_WIDTH_PADDING;

interface RnChartKitLineChartProps {
  chartData: any; // react-native-chart-kit data structure
  chartConfig: any; // react-native-chart-kit config structure
  chartHeight: number;
  yAxisSuffix: string;
}

export default function RnChartKitLineChart({
  chartData,
  chartConfig,
  chartHeight,
  yAxisSuffix,
}: RnChartKitLineChartProps) {
  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={chartData}
        width={CHART_WIDTH}
        height={chartHeight}
        chartConfig={chartConfig}
        bezier
        withShadow={false}
        withInnerLines={false}
        withOuterLines={false}
        fromZero={true}
        yAxisSuffix={yAxisSuffix}
        // Use background color as dot color for transparency
        getDotColor={() => chartConfig.backgroundGradientFrom}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    // Container for the chart - allow horizontal scrolling if needed
    overflow: "hidden",
  },
  chart: {
    // Additional chart styling - negative margin to shift left and reduce excessive left padding
    marginLeft: -20,
  },
});
