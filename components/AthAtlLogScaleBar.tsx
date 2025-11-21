// components/AthAtlLogScaleBar.tsx

import { useMemo } from "react";
import { DimensionValue, Platform, StyleSheet, View } from "react-native";
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

// Magic numbers - all constants at top
const LOG_BASE = 10; // Base for logarithm calculation
const INDICATOR_SIZE = 12;
const BAR_INDICATOR_WIDTH = 5;
const BAR_INDICATOR_HEIGHT_EXTRA = 6; // Extra height for current price indicator
const DEFAULT_BAR_HEIGHT = 8;
const DEFAULT_HEIGHT_WEB = 80;
const DEFAULT_HEIGHT_MOBILE = 60;
const DEFAULT_WIDTH = "100%";
const MIN_LOG_DISTANCE = 0.001; // Minimum log distance to avoid division by zero

export interface AthAtlLogScaleBarProps {
  currentPrice: number;
  ath: number;
  atl: number;
  athDate?: string | null;
  atlDate?: string | null;
  currencySymbol?: string;
  width?: number | string;
  height?: number;
  barHeight?: number;
  showLabels?: boolean;
  showCurrentPrice?: boolean;
  formatPrice?: (price: number) => string;
  formatDate?: (dateString: string | null | undefined) => string;
}

export function AthAtlLogScaleBar({
  currentPrice,
  ath,
  atl,
  athDate,
  atlDate,
  currencySymbol = "$",
  width = DEFAULT_WIDTH,
  height,
  barHeight = DEFAULT_BAR_HEIGHT,
  showLabels = true,
  showCurrentPrice = true,
  formatPrice,
  formatDate,
}: AthAtlLogScaleBarProps) {
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  // Default formatters
  const defaultFormatPrice = (price: number): string => {
    return `${currencySymbol}${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })}`;
  };

  const defaultFormatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const priceFormatter = formatPrice || defaultFormatPrice;
  const dateFormatter = formatDate || defaultFormatDate;

  // Calculate dynamic height based on platform if not provided
  const dynamicHeight = useMemo(() => {
    if (height !== undefined) return height;
    return Platform.OS === 'web' ? DEFAULT_HEIGHT_WEB : DEFAULT_HEIGHT_MOBILE;
  }, [height]);

  // Calculate logarithmic position percentage
  const logPositionPercentage = useMemo(() => {
    // Ensure all values are positive for logarithm
    if (currentPrice <= 0 || ath <= 0 || atl <= 0) return 50;
    if (ath === atl) return 50; // If ATH equals ATL, center the indicator
    
    const logCurrent = Math.log10(currentPrice);
    const logAth = Math.log10(ath);
    const logAtl = Math.log10(atl);
    const logRange = logAth - logAtl;
    
    // Avoid division by zero
    if (Math.abs(logRange) < MIN_LOG_DISTANCE) return 50;
    
    const position = ((logCurrent - logAtl) / logRange) * 100;
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, position));
  }, [currentPrice, ath, atl]);

  // Calculate indicator position percentage
  const indicatorLeftPercent = useMemo(() => {
    return logPositionPercentage;
  }, [logPositionPercentage]);

  // Calculate dynamic height based on whether labels are shown
  const containerHeight = showLabels ? dynamicHeight : undefined;

  return (
    <ThemedView style={[styles.container, { width: width as DimensionValue, height: containerHeight }]}>
      {/* Labels Row */}
      {showLabels && (
        <View style={styles.labelsRow}>
          <View style={styles.labelContainer}>
            <ThemedText type="xsmall" variant="secondary" style={styles.labelValue}>
              {priceFormatter(atl)}
            </ThemedText>
          </View>
          <View style={styles.labelContainer}>
            <ThemedText type="xsmall" variant="secondary" style={[styles.labelValue, styles.labelRight]}>
              {priceFormatter(ath)}
            </ThemedText>
          </View>
        </View>
      )}

      {/* Log Scale Label */}
      {showLabels && (
        <View style={styles.logScaleLabelContainer}>
          <ThemedText type="xsmall" variant="secondary" style={styles.logScaleLabel}>
            Log Scale
          </ThemedText>
        </View>
      )}

      {/* Range Bar Container */}
      <View style={styles.barContainer}>
        {/* Gradient Bar using SVG */}
        <View style={[styles.barWrapper, { height: barHeight }]}>
          <Svg height={barHeight} width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="logRangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={errorColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={successColor} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height={barHeight} fill="url(#logRangeGradient)" rx={4} />
          </Svg>
        </View>

        {/* Current Price Indicator (Bar style) */}
        <View
          style={[
            styles.indicatorBar,
            {
              left: `${indicatorLeftPercent}%`,
              marginLeft: -BAR_INDICATOR_WIDTH / 2,
              backgroundColor: borderColor,
              height: barHeight + BAR_INDICATOR_HEIGHT_EXTRA,
              transform: [{ translateY: -((barHeight + BAR_INDICATOR_HEIGHT_EXTRA) / 2) }],
              opacity: 1,
            },
          ]}
        />
      </View>

      {/* Current Price Label */}
      {showLabels && showCurrentPrice && (
        <View style={styles.currentPriceContainer}>
          <ThemedText type="xsmall" variant="secondary" style={styles.currentPriceLabel}>
            Current: {priceFormatter(currentPrice)}
          </ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
    justifyContent: "flex-start",
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  labelContainer: {
    flex: 1,
  },
  labelValue: {
    fontWeight: "600",
  },
  labelDate: {
    marginTop: 2,
  },
  labelRight: {
    textAlign: "right",
  },
  logScaleLabelContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  logScaleLabel: {
    fontWeight: "500",
    fontStyle: "italic",
  },
  barContainer: {
    position: "relative",
    width: "100%",
    marginTop: Spacing.xs,
    marginBottom: 0,
  },
  barWrapper: {
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  indicatorBar: {
    position: "absolute",
    width: BAR_INDICATOR_WIDTH,
    top: "50%",
    zIndex: 2,
    borderRadius: 1,
    opacity: 1,
  },
  currentPriceContainer: {
    alignItems: "center",
    marginTop: Spacing.xs,
    marginBottom: 0,
  },
  currentPriceLabel: {
    fontWeight: "600",
  },
});

