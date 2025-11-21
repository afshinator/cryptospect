import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  CURRENCY_DISPLAY_NAMES,
  CURRENCY_FLAG_URLS,
  CURRENCY_SYMBOLS,
  DISPLAY_CURRENCIES,
  FIAT_DECIMAL_PLACES,
  SupportedCurrency
} from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";
import { calculateRelativeRate } from "@/utils/currencyCalculations";

// --- GLOBAL BANNER CONSTANTS ---
const BANNER_HEIGHT = 70;
const BANNER_HEIGHT_SMALL = 35; // Half height for small version
const SCROLL_SPEED_MS = 30000;


interface TickerItem {
  id: string;
  label1: string; // Main identifier (e.g., USD)
  label2: string; // Friendly name (e.g., United States Dollar)
  value: string;
  flagUrl?: string;
}

interface GenericTickerItemProps {
  item: TickerItem;
  lessText: boolean; // Whether to display only label1 (less text)
  hideCurrencyName: boolean; // Whether to hide currency name (label2)
  itemWidth: number;
  itemHeight: number;
  size: CurrencyBannerSize;
}


const GenericTickerItem = React.memo(({ item, lessText, hideCurrencyName, itemWidth, itemHeight, size }: GenericTickerItemProps) => {
  const itemBackgroundColor = useThemeColor({}, "backgroundSecondary");
  const itemBorderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  // Calculate font sizes based on size variant
  const labelFontSize = size === "small" ? 10 : 16; // Smaller for small size
  const rateFontSize = size === "small" ? 12 : 18; // Smaller for small size
  const rateMarginTop = size === "small" ? 1 : 2;
  
  // Reduce padding for small size to maximize text space
  const itemPadding = size === "small" ? Spacing.xs : Spacing.md;

  // Determine what text to display
  const displayText = lessText 
    ? item.label1  // Only show currency code (USD)
    : `${item.label2} ${item.label1}`; // Show currency name + code (US Dollar USD)

  return (
    <ThemedView
      style={[
        styles.itemContainer,
        {
          width: itemWidth,
          height: itemHeight,
          backgroundColor: itemBackgroundColor,
          borderRightColor: itemBorderColor,
          paddingHorizontal: itemPadding,
        }
      ]}
      shadow="sm"
    >
      {/* BACKGROUND IMAGE (Optional) */}
      {item.flagUrl && (
        <Image
          source={{ uri: item.flagUrl }}
          style={[
            styles.flagBackgroundImage,
            {
              width: itemWidth,
              height: itemHeight,
            }
          ]}
          resizeMode={'cover'}
        />
      )}

      {/* TEXT CONTAINER - CENTERED */}
      <View style={[styles.textContainer, { width: itemWidth - (itemPadding * 2) }]}>
        {/* Main Code/Label - bodySemibold (only show if not hiding currency name) */}
        {!hideCurrencyName && (
          <ThemedText
            type="bodySemibold"
            style={{
              color: textColor,
              width: '100%',
              textAlign: 'center',
              fontSize: labelFontSize,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
            ellipsizeMode="tail"
          >
            {displayText}
          </ThemedText>
        )}

        {/* Converted Value/Rate - bodySemibold */}
        <ThemedText 
          type="bodySemibold" 
          style={[
            styles.rateText,
            {
              fontSize: rateFontSize,
              marginTop: hideCurrencyName ? 0 : rateMarginTop,
              width: '100%',
              textAlign: 'center',
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
          ellipsizeMode="tail"
        >
          {item.value}
        </ThemedText>
      </View>
    </ThemedView>
  );
});

GenericTickerItem.displayName = 'GenericTickerItem';

// =========================================================================
// 3. HORIZONTAL TICKER COMPONENT (REUSABLE)
// =========================================================================

interface HorizontalTickerProps {
  data: TickerItem[];
  lessText?: boolean; // RENAMED: New prop definition
  hideCurrencyName: boolean; // Whether to hide currency name
  itemWidth: number;
  itemHeight: number;
  size: CurrencyBannerSize;
}

const HorizontalTicker = ({ data, lessText = false, hideCurrencyName, itemWidth, itemHeight, size }: HorizontalTickerProps) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const fullDataWidth = data.length * itemWidth;

  const infiniteData = React.useMemo(() => {
    return data.length > 0
      ? [...data, ...data, ...data]
      : [];
  }, [data]);

  const startAnimation = useCallback(() => {
    if (data.length <= 1) return;

    scrollAnim.stopAnimation();

    Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: SCROLL_SPEED_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [scrollAnim, data.length]);

  useEffect(() => {
    startAnimation();
    return () => scrollAnim.stopAnimation();
  }, [startAnimation, scrollAnim]);


  const translateX = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -fullDataWidth],
  });

  return (
    <Animated.View
      style={[
        styles.scrollContent,
        {
          width: infiniteData.length * itemWidth,
          transform: [{ translateX }]
        }
      ]}
    >
      {infiniteData.map((item, index) => (
        <GenericTickerItem
          key={item.id + index}
          item={item}
          lessText={lessText} // Pass the renamed prop
          hideCurrencyName={hideCurrencyName}
          itemWidth={itemWidth}
          itemHeight={itemHeight}
          size={size}
        />
      ))}
    </Animated.View>
  );
};


const CURRENCY_ITEM_WIDTH = 140;
const CURRENCY_ITEM_WIDTH_SMALL = 70; // Half width for small version

export type CurrencyBannerSize = "default" | "small";

interface CurrencyBannerProps {
  lessText?: boolean; // Whether to display only currency code (default: true)
  hideCurrencyName?: boolean; // Whether to hide currency name (default: true for small size, false otherwise)
  size?: CurrencyBannerSize; // Size variant: "default" or "small"
}

export function CurrencyBanner({ lessText = true, hideCurrencyName, size = "default" }: CurrencyBannerProps) {
  const { data: prefs, isPending: isPrefsPending } = usePreferences();
  const {
    data: ratesData,
    isLoading: isRatesLoading,
    error,
  } = useExchangeRates();

  // Dynamic Theme Colors
  const bannerBackgroundColor = useThemeColor({}, "background");
  const bannerBorderColor = useThemeColor({}, "border");
  const loadingTintColor = useThemeColor({}, "tint");

  // Calculate dimensions based on size
  const bannerHeight = size === "small" ? BANNER_HEIGHT_SMALL : BANNER_HEIGHT;
  const itemWidth = size === "small" ? CURRENCY_ITEM_WIDTH_SMALL : CURRENCY_ITEM_WIDTH;
  
  // For small size, default to hiding currency name if not explicitly set
  const shouldHideCurrencyName = hideCurrencyName !== undefined 
    ? hideCurrencyName 
    : size === "small";

  // Filter out non-fiat currencies (like btc, eth) and map to TickerItem
  const fiatTickerData: TickerItem[] = React.useMemo(() => {
    if (!prefs || !ratesData || !ratesData.rates) return [];

    const selectedCurrency = prefs.currency;

    // Filter to ensure only SupportedCurrency (fiat) codes are processed
    const fiatCurrencies = DISPLAY_CURRENCIES.filter(
      (code): code is SupportedCurrency => code !== 'btc' && code !== 'eth'
    ) as SupportedCurrency[];


    return fiatCurrencies.map((code) => {
      const relativeRate = calculateRelativeRate(
        selectedCurrency,
        code,
        ratesData.rates
      );

      const symbol = CURRENCY_SYMBOLS[code] || "";
      const displayCode = code.toUpperCase();

      const label =
        (CURRENCY_DISPLAY_NAMES as Record<string, string>)[code] || displayCode;

      const formattedRate = `${symbol}${relativeRate.toFixed(FIAT_DECIMAL_PLACES)}`;

      return {
        id: code,
        label1: displayCode,
        label2: label,
        value: formattedRate,
        flagUrl: CURRENCY_FLAG_URLS[code]
      };
    });
  }, [prefs, ratesData]);


  // --- Render ---

  if (isPrefsPending || isRatesLoading || fiatTickerData.length === 0 || error) {
    return (
      <View
        style={[
          styles.bannerContainer,
          styles.loadingBanner,
          {
            height: bannerHeight,
            backgroundColor: bannerBackgroundColor,
            borderBottomColor: bannerBorderColor
          }
        ]}
      >
        <ActivityIndicator size="small" color={loadingTintColor} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bannerContainer,
        {
          height: bannerHeight,
          backgroundColor: bannerBackgroundColor,
          borderBottomColor: bannerBorderColor
        }
      ]}
    >
      <HorizontalTicker
        data={fiatTickerData}
        lessText={lessText} // Pass the renamed prop
        hideCurrencyName={shouldHideCurrencyName}
        itemWidth={itemWidth}
        itemHeight={bannerHeight}
        size={size}
      />
    </View>
  );
}

// --- STYLES ---

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  loadingBanner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  flagBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.15,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rateText: {
    marginTop: 2,
  }
});