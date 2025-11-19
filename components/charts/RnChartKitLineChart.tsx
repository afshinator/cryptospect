import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

// Calculated Dimensions are kept here since they are directly needed by the RN Chart Kit component
const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH;

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
    // Container for the chart
  },
  chart: {
    // Additional chart styling
  },
});
