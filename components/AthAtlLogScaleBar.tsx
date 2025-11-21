// components/AthAtlLogScaleBar.tsx

import { useMemo } from "react";
import { DimensionValue, Platform, StyleSheet, View } from "react-native";
import Svg, { Defs, Rect, Stop, LinearGradient as SvgLinearGradient } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

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
  showLogMarkers?: boolean; // Optional: show logarithmic midpoint (50% position)
  showPowerOfTenMarkers?: boolean; // Optional: show power-of-ten markers (×10, ×100, etc.)
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
  showLogMarkers = false,
  showPowerOfTenMarkers = false,
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

  // Formatter for midpoint that rounds to reasonable precision
  const formatMidpointPrice = (price: number): string => {
    if (price >= 1000) {
      // For large numbers, use 2 decimal places
      return `${currencySymbol}${price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else if (price >= 1) {
      // For medium numbers, use 2-4 decimal places
      return `${currencySymbol}${price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}`;
    } else if (price >= 0.01) {
      // For small numbers, use 4-6 decimal places
      return `${currencySymbol}${price.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })}`;
    } else {
      // For very small numbers, use scientific notation or more decimals
      return `${currencySymbol}${price.toLocaleString(undefined, {
        minimumFractionDigits: 6,
        maximumFractionDigits: 8,
      })}`;
    }
  };

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

  // Calculate logarithmic midpoint price and position
  const logMidpoint = useMemo(() => {
    if (!showLogMarkers || ath <= 0 || atl <= 0 || ath === atl) return null;
    const logAth = Math.log10(ath);
    const logAtl = Math.log10(atl);
    const logMid = (logAth + logAtl) / 2;
    const midpointPrice = Math.pow(10, logMid);
    const midpointPosition = ((logMid - logAtl) / (logAth - logAtl)) * 100;
    return { price: midpointPrice, position: Math.max(0, Math.min(100, midpointPosition)) };
  }, [showLogMarkers, ath, atl]);

  // Calculate power-of-ten markers from ATL
  const powerOfTenMarkers = useMemo(() => {
    if (!showPowerOfTenMarkers || ath <= 0 || atl <= 0 || ath === atl) return [];
    const logAth = Math.log10(ath);
    const logAtl = Math.log10(atl);
    const logRange = logAth - logAtl;
    
    if (Math.abs(logRange) < MIN_LOG_DISTANCE) return [];
    
    const markers = [];
    let multiplier = 10; // Start with ×10
    
    // Generate markers: ATL × 10, ATL × 100, ATL × 1000, etc., up to ATH
    while (true) {
      const markerPrice = atl * multiplier;
      if (markerPrice > ath) break;
      
      const logMarker = Math.log10(markerPrice);
      const markerPosition = ((logMarker - logAtl) / logRange) * 100;
      
      if (markerPosition >= 0 && markerPosition <= 100) {
        markers.push({
          price: markerPrice,
          position: markerPosition,
          multiplier: multiplier,
        });
      }
      
      multiplier *= 10;
      // Safety check to avoid infinite loop
      if (multiplier > 1e12) break;
    }
    
    return markers;
  }, [showPowerOfTenMarkers, ath, atl]);

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


      {/* Range Bar Container */}
      <View style={styles.barContainer}>
        {/* Logarithmic Markers (if enabled) */}
        {(showLogMarkers || showPowerOfTenMarkers) && (
          <>
            {/* Logarithmic Midpoint Marker */}
            {showLogMarkers && logMidpoint && (
              <View
                style={[
                  styles.logMarker,
                  {
                    left: `${logMidpoint.position}%`,
                    marginLeft: -1,
                  },
                ]}
              >
                <View style={[styles.markerTick, { backgroundColor: textSecondaryColor }]} />
                <View style={styles.markerLabelContainer}>
                  <ThemedText type="xsmall" variant="secondary" style={styles.markerLabel}>
                    {formatMidpointPrice(logMidpoint.price)}
                  </ThemedText>
                  <ThemedText type="xsmall" variant="secondary" style={styles.markerSubLabel}>
                    50%
                  </ThemedText>
                </View>
              </View>
            )}
            
            {/* Power-of-Ten Markers */}
            {showPowerOfTenMarkers && powerOfTenMarkers.map((marker, index) => (
              <View
                key={index}
                style={[
                  styles.logMarker,
                  {
                    left: `${marker.position}%`,
                    marginLeft: -1,
                  },
                ]}
              >
                <View style={[styles.markerTick, { backgroundColor: textSecondaryColor, opacity: 0.7 }]} />
                <View style={styles.markerLabelContainer}>
                  <ThemedText type="xsmall" variant="secondary" style={styles.markerLabel}>
                    {priceFormatter(marker.price)}
                  </ThemedText>
                  <ThemedText type="xsmall" variant="secondary" style={styles.markerSubLabel}>
                    ×{marker.multiplier}
                  </ThemedText>
                </View>
              </View>
            ))}
          </>
        )}
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
  logMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 1,
    pointerEvents: "none",
  },
  markerTick: {
    width: 2,
    height: "100%",
    position: "absolute",
    top: 0,
  },
  markerLabelContainer: {
    position: "absolute",
    top: -24,
    alignItems: "center",
    minWidth: 60,
  },
  markerLabel: {
    fontWeight: "600",
    textAlign: "center",
  },
  markerSubLabel: {
    marginTop: 2,
    textAlign: "center",
  },
});

