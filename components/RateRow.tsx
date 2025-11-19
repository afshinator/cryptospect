// components/RateRow.tsx

import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import {
    CURRENCY_DISPLAY_NAMES,
    CURRENCY_FLAG_URLS,
    CURRENCY_SYMBOLS,
    SupportedCurrency,
} from "@/constants/currency";
import { Colors, Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

// =========================================================================
// CONSTANTS
// =========================================================================

// UI Constants
const MAX_ROW_WIDTH = 290;
const SELECTED_TEXT_COLOR = Colors.dark.text;

// Flag/Icon Image Configuration
const FLAG_IMAGE_SIZE = 40; // Fixed size for flag/icon images (should not exceed row height)
type FlagImagePosition = "left" | "center" | "right";
const FLAG_IMAGE_POSITION: FlagImagePosition = "center"; // Options: "left" | "center" | "right"
const FLAG_IMAGE_OPACITY = 0.15; // Opacity for background flag effect

// Decimal Places Configuration (for crypto precision calculation)
const MAX_DECIMAL_PLACES = 20; // Maximum decimal places for very small crypto values

// Local map for display names not present in CURRENCY_DISPLAY_NAMES (e.g., crypto)
const ADDITIONAL_DISPLAY_NAMES: Partial<
  Record<SupportedCurrency | "btc" | "eth", string>
> = {
  btc: "Bitcoin",
  eth: "Ethereum",
};

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

/**
 * Formats a rate value with appropriate decimal places.
 * For crypto: Shows full precision (no rounding) - up to 15 significant digits
 * For fiat: Rounds based on fullPrecision flag (2 decimal places if false, full precision if true)
 * @param rate The rate value to format
 * @param isCrypto Whether this is a cryptocurrency
 * @param fullPrecision Whether to show full precision for fiat currencies
 * @returns Object with formatted string and whether it's approximate
 */
function formatRate(
  rate: number,
  isCrypto: boolean,
  fullPrecision: boolean = false
): { formatted: string; isApproximate: boolean } {
  if (isCrypto) {
    // For crypto, show full precision without rounding
    if (rate === 0) {
      return { formatted: "0", isApproximate: false };
    }

    // Use enough decimal places to show full precision
    // For very small numbers, calculate based on magnitude
    const absRate = Math.abs(rate);
    let decimalPlaces = 12; // Default precision

    if (absRate < 1) {
      // For numbers less than 1, calculate decimal places needed
      // Use log10 to determine how many leading zeros
      const log10 = Math.log10(absRate);
      if (log10 < 0) {
        // Add extra precision for very small numbers
        decimalPlaces = Math.ceil(-log10) + 10;
      }
    }

    // Cap at MAX_DECIMAL_PLACES for display
    decimalPlaces = Math.min(decimalPlaces, MAX_DECIMAL_PLACES);

    // Format with calculated precision
    let formatted = rate.toFixed(decimalPlaces);

    // Remove trailing zeros but preserve the decimal point if there are significant digits
    formatted = formatted.replace(/\.?0+$/, "");
    return { formatted, isApproximate: false };
  } else {
    // For fiat currencies
    if (fullPrecision) {
      // Show full precision for fiat currencies
      // Use enough decimal places to show significant digits
      const absRate = Math.abs(rate);
      let decimalPlaces = 4; // Default precision

      if (absRate < 1) {
        const log10 = Math.log10(absRate);
        if (log10 < 0) {
          decimalPlaces = Math.ceil(-log10) + 4;
        }
      }

      decimalPlaces = Math.min(decimalPlaces, MAX_DECIMAL_PLACES);
      let formatted = rate.toFixed(decimalPlaces);
      formatted = formatted.replace(/\.?0+$/, "");
      return { formatted, isApproximate: false };
    } else {
      // Round to 2 decimal places (smallest denomination)
      const rounded = Math.round(rate * 100) / 100;
      const formatted = rounded.toFixed(2);
      const isApproximate = Math.abs(rate - rounded) > 0.0001;
      return { formatted, isApproximate };
    }
  }
}

// =========================================================================
// COMPONENT
// =========================================================================

export interface RateRowProps {
  code: SupportedCurrency | "btc" | "eth";
  rate: number;
  isSelected: boolean;
  isCrypto: boolean;
  fullPrecision: boolean;
}

/**
 * Renders a single row in the rates list.
 * Handles all rendering details including flag image positioning and styling.
 */
export function RateRow({
  code,
  rate,
  isSelected,
  isCrypto,
  fullPrecision,
}: RateRowProps) {
  const highlightColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "backgroundSecondary");

  // Determine display properties
  const displayCode = code.toUpperCase();
  // We explicitly check for both CURRENCY_DISPLAY_NAMES (fiat) and ADDITIONAL_DISPLAY_NAMES (crypto)
  const displayName =
    (CURRENCY_DISPLAY_NAMES as Record<string, string>)[code] ||
    ADDITIONAL_DISPLAY_NAMES[code] ||
    displayCode;
  const symbol = CURRENCY_SYMBOLS[code] || "$";
  const { formatted: formattedRate } = formatRate(rate, isCrypto, fullPrecision);

  // Get flag URL from the imported constant
  const flagUrl = CURRENCY_FLAG_URLS[code];

  // Set color props to force light text when selected, ensuring contrast on 'tint' background
  const textProps = isSelected
    ? {
        lightColor: SELECTED_TEXT_COLOR,
        darkColor: SELECTED_TEXT_COLOR,
      }
    : {};

  // Calculate flag image positioning based on FLAG_IMAGE_POSITION constant
  const flagImageStyle = React.useMemo(() => {
    const baseStyle: {
      width: number;
      height: number;
      opacity: number;
      position: "absolute";
      top: number;
    } = {
      width: FLAG_IMAGE_SIZE,
      height: FLAG_IMAGE_SIZE,
      opacity: FLAG_IMAGE_OPACITY,
      position: "absolute",
      top: Spacing.sm,
    };

    switch (FLAG_IMAGE_POSITION) {
      case "left":
        return { ...baseStyle, left: Spacing.sm };
      case "center":
        // Center position: approximate center of typical row (MAX_ROW_WIDTH / 2 - image size / 2)
        // This works well for most screen sizes
        const centerLeft = MAX_ROW_WIDTH / 2 - FLAG_IMAGE_SIZE / 2;
        return {
          ...baseStyle,
          left: centerLeft,
        };
      case "right":
        return {
          ...baseStyle,
          right: Spacing.sm,
        };
      default:
        return { ...baseStyle, left: Spacing.sm };
    }
  }, []);

  return (
    <ThemedView
      style={[
        styles.rateRow,
        { backgroundColor: isSelected ? highlightColor : backgroundColor },
        isSelected && styles.rateRowSelected,
      ]}
      shadow={isSelected ? "md" : "sm"}
    >
      {/* FLAG/ICON IMAGE (Fixed size, positioned based on FLAG_IMAGE_POSITION constant) */}
      {flagUrl && (
        <Image
          source={{ uri: flagUrl }}
          style={[styles.flagImage, flagImageStyle]}
          resizeMode="contain"
        />
      )}

      {/* Column 1: Currency Code and Name (z-index for foreground visibility) */}
      <View style={styles.codeColumn}>
        <Collapsible
          title={displayCode}
          hideChevron
          style={{ backgroundColor: "transparent" }}
        >
          <ThemedText
            type="small"
            variant={isSelected ? "default" : "secondary"} // Use default (light) or secondary text based on selection
            {...textProps} // Apply forced light text if selected
            style={{ backgroundColor: "transparent" }}
          >
            {displayName}
          </ThemedText>
        </Collapsible>
      </View>

      {/* Column 2: Rate (z-index for foreground visibility) */}
      <View style={styles.rateColumn}>
        <ThemedText
          type="body"
          propFontScale={1.3}
          {...textProps} // Apply forced light text if selected
        >
          {symbol} {formattedRate}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

// =========================================================================
// STYLES
// =========================================================================

const styles = StyleSheet.create({
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden", // Ensures flag doesn't bleed out of rounded corners
  },
  rateRowSelected: {
    borderWidth: 1,
    borderColor: Colors.dark.text,
  },
  flagImage: {
    // Base styles - positioning and size set dynamically based on FLAG_IMAGE_POSITION constant
    zIndex: 0,
  },
  codeColumn: {
    // flex: 1,
    zIndex: 1,
  },
  rateColumn: {
    // flex: 1,
    alignItems: "flex-end",
    zIndex: 1,
  },
});

