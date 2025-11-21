// components/AthAtlRangeBar.tsx

import { useMemo } from "react";
import { DimensionValue, StyleSheet, View } from "react-native";
import Svg, { Defs, Path, Rect, Stop, LinearGradient as SvgLinearGradient } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

export type IndicatorStyle = "circle" | "bar" | "caret";

export interface AthAtlRangeBarProps {
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
  indicatorStyle?: IndicatorStyle;
  recentChangePercentage?: number; // Optional: percentage change (e.g., 0.047 for 4.7%)
  formatPrice?: (price: number) => string;
  formatDate?: (dateString: string | null | undefined) => string;
}

const INDICATOR_SIZE = 12;
const BAR_INDICATOR_WIDTH = 5;
const BAR_INDICATOR_HEIGHT_EXTRA = 6; // Extra height for current price indicator to make it taller
const CARET_SIZE = 8;
const DOT_SIZE = 3;
const DOT_SPACING = 4; // Space between dots
const DEFAULT_BAR_HEIGHT = 8;
const DEFAULT_HEIGHT = 80;
const DEFAULT_WIDTH = "100%";

export function AthAtlRangeBar({
  currentPrice,
  ath,
  atl,
  athDate,
  atlDate,
  currencySymbol = "$",
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  barHeight = DEFAULT_BAR_HEIGHT,
  showLabels = true,
  showCurrentPrice = true,
  indicatorStyle = "circle",
  recentChangePercentage,
  formatPrice,
  formatDate,
}: AthAtlRangeBarProps) {
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

  // Calculate position percentage
  const positionPercentage = useMemo(() => {
    if (ath === atl) return 50; // If ATH equals ATL, center the indicator
    const range = ath - atl;
    const position = ((currentPrice - atl) / range) * 100;
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, position));
  }, [currentPrice, ath, atl]);

  // Calculate indicator position percentage (will be adjusted with marginLeft)
  const indicatorLeftPercent = useMemo(() => {
    return positionPercentage;
  }, [positionPercentage]);

  // Calculate recent change position percentage
  // This shows where the price WAS before the change
  // Negative change (price went down) → previous price was higher → bar on the right
  // Positive change (price went up) → previous price was lower → bar on the left
  const changePositionPercentage = useMemo(() => {
    if (recentChangePercentage === undefined || recentChangePercentage === null || ath === atl) return null;
    const range = ath - atl;
    // Calculate the absolute price change
    const priceChange = currentPrice * Math.abs(recentChangePercentage);
    // Convert price change to percentage of the range
    const changeOffset = (priceChange / range) * 100;
    // Calculate previous price position:
    // If negative (price went down), previous was higher → add offset (go right)
    // If positive (price went up), previous was lower → subtract offset (go left)
    const newPosition = recentChangePercentage < 0 
      ? positionPercentage + changeOffset  // Price went down, previous was higher (right)
      : positionPercentage - changeOffset; // Price went up, previous was lower (left)
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, newPosition));
  }, [recentChangePercentage, currentPrice, ath, atl, positionPercentage]);

  // Calculate dots between current price and change indicators
  const connectingDots = useMemo(() => {
    if (changePositionPercentage === null) return [];
    
    const startPos = indicatorLeftPercent;
    const endPos = changePositionPercentage;
    const distance = Math.abs(endPos - startPos);
    
    // Only show dots if there's meaningful distance (at least 2%)
    if (distance < 2) return [];
    
    // Calculate number of dots (one dot per DOT_SPACING percentage points)
    const numDots = Math.floor(distance / (DOT_SPACING / 10)); // Convert spacing to percentage
    if (numDots === 0) return [];
    
    // Determine direction
    const isLeftToRight = endPos > startPos;
    const step = distance / (numDots + 1);
    
    const dots = [];
    for (let i = 1; i <= numDots; i++) {
      const dotPosition = isLeftToRight 
        ? startPos + (step * i)
        : startPos - (step * i);
      dots.push(dotPosition);
    }
    
    return dots;
  }, [indicatorLeftPercent, changePositionPercentage]);

  // Render indicator based on style
  const renderIndicator = () => {
    const leftPosition: DimensionValue = `${indicatorLeftPercent}%`;
    const marginLeft = indicatorStyle === "circle" 
      ? -INDICATOR_SIZE / 2 
      : indicatorStyle === "bar"
      ? -BAR_INDICATOR_WIDTH / 2
      : -CARET_SIZE / 2;

    switch (indicatorStyle) {
      case "bar":
        const barHeightWithExtra = barHeight + BAR_INDICATOR_HEIGHT_EXTRA;
        return (
          <View
            style={[
              styles.indicatorBar,
              {
                left: leftPosition,
                marginLeft: marginLeft,
                backgroundColor: borderColor,
                height: barHeightWithExtra,
                transform: [{ translateY: -(barHeightWithExtra / 2) }],
                opacity: 1,
              },
            ]}
          />
        );
      
      case "caret":
        return (
          <View
            style={[
              styles.indicatorCaretContainer,
              {
                left: leftPosition,
                marginLeft: marginLeft,
              },
            ]}
          >
            <Svg width={CARET_SIZE * 2} height={CARET_SIZE} style={styles.caretSvg}>
              <Path
                d={`M ${CARET_SIZE} 0 L ${CARET_SIZE * 2} ${CARET_SIZE} L 0 ${CARET_SIZE} Z`}
                fill={borderColor}
                stroke={textSecondaryColor}
                strokeWidth={1}
              />
            </Svg>
          </View>
        );
      
      case "circle":
      default:
        return (
          <View
            style={[
              styles.indicatorCircle,
              {
                left: leftPosition,
                marginLeft: marginLeft,
                backgroundColor: borderColor,
                borderColor: textSecondaryColor,
              },
            ]}
          />
        );
    }
  };

  // Calculate dynamic height based on whether labels are shown
  const dynamicHeight = showLabels ? (height || DEFAULT_HEIGHT) : undefined;
  
  return (
    <ThemedView style={[styles.container, { width: width as DimensionValue, height: dynamicHeight }]}>
      {/* Labels Row */}
      {showLabels && (
        <View style={styles.labelsRow}>
          <View style={styles.labelContainer}>
            <ThemedText type="xsmall" variant="secondary" style={styles.labelValue}>
              {priceFormatter(atl)}
            </ThemedText>
            {atlDate && (
              <ThemedText type="xsmall" variant="secondary" style={styles.labelDate}>
                {dateFormatter(atlDate)}
              </ThemedText>
            )}
          </View>
          <View style={styles.labelContainer}>
            <ThemedText type="xsmall" variant="secondary" style={[styles.labelValue, styles.labelRight]}>
              {priceFormatter(ath)}
            </ThemedText>
            {athDate && (
              <ThemedText type="xsmall" variant="secondary" style={[styles.labelDate, styles.labelRight]}>
                {dateFormatter(athDate)}
              </ThemedText>
            )}
          </View>
        </View>
      )}

      {/* Range Bar Container */}
      <View style={styles.barContainer}>
        {/* Gradient Bar using SVG */}
        <View style={[styles.barWrapper, { height: barHeight }]}>
          <Svg height={barHeight} width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="rangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={errorColor} stopOpacity="1" />
                <Stop offset="100%" stopColor={successColor} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height={barHeight} fill="url(#rangeGradient)" rx={4} />
          </Svg>
        </View>

        {/* Current Price Indicator */}
        {renderIndicator()}
        
        {/* Connecting Dots (if change indicator exists) */}
        {connectingDots.map((dotPosition, index) => (
          <View
            key={index}
            style={[
              styles.connectingDot,
              {
                left: `${dotPosition}%`,
                marginLeft: -DOT_SIZE / 2,
                backgroundColor: '#FFFFFF',
                opacity: 0.9,
              },
            ]}
          />
        ))}
        
        {/* Recent Change Indicator (if provided) */}
        {changePositionPercentage !== null && (
          <View
            style={[
              styles.changeIndicator,
              {
                left: `${changePositionPercentage}%`,
                marginLeft: -BAR_INDICATOR_WIDTH / 2,
                backgroundColor: textSecondaryColor,
                height: barHeight + 4,
                opacity: 0.6,
              },
            ]}
          />
        )}
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
  indicatorCircle: {
    position: "absolute",
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    borderWidth: 2,
    top: "50%",
    transform: [{ translateY: -INDICATOR_SIZE / 2 }],
    zIndex: 1,
  },
  indicatorBar: {
    position: "absolute",
    width: BAR_INDICATOR_WIDTH,
    top: "50%",
    zIndex: 2,
    borderRadius: 1,
    opacity: 1,
  },
  changeIndicator: {
    position: "absolute",
    width: BAR_INDICATOR_WIDTH,
    top: "50%",
    transform: [{ translateY: -((DEFAULT_BAR_HEIGHT + 4) / 2) }],
    zIndex: 1,
    borderRadius: 1,
  },
  connectingDot: {
    position: "absolute",
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    top: "50%",
    transform: [{ translateY: -DOT_SIZE / 2 }],
    zIndex: 1,
  },
  indicatorCaretContainer: {
    position: "absolute",
    top: "100%",
    marginTop: 2,
    zIndex: 1,
  },
  caretSvg: {
    position: "absolute",
  },
  currentPriceContainer: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  currentPriceLabel: {
    fontWeight: "600",
  },
});

