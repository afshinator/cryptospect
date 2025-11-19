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
  ExchangeRateCache,
  FIAT_DECIMAL_PLACES,
  SupportedCurrency,
} from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";

// --- GLOBAL BANNER CONSTANTS ---
const BANNER_HEIGHT = 70;
const SCROLL_SPEED_MS = 30000;

// =========================================================================
// 1. GENERIC TICKER DATA STRUCTURE
// =========================================================================

interface TickerItem {
  id: string; 
  label1: string; // Main identifier (e.g., USD)
  label2: string; // Friendly name (e.g., United States Dollar)
  value: string; 
  flagUrl?: string; 
}

interface GenericTickerItemProps {
  item: TickerItem;
  lessText: boolean; // RENAMED: Controls whether to display only label1 (less text)
  itemWidth: number; 
}

// =========================================================================
// 2. GENERIC TICKER ITEM COMPONENT
// =========================================================================

const GenericTickerItem = React.memo(({ item, lessText, itemWidth }: GenericTickerItemProps) => {
  const itemBackgroundColor = useThemeColor({}, "backgroundSecondary");
  const itemBorderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  return (
    <ThemedView 
        style={[
            styles.itemContainer, 
            { 
                width: itemWidth, 
                backgroundColor: itemBackgroundColor,
                borderRightColor: itemBorderColor,
            }
        ]} 
        shadow="sm"
    >
      {/* BACKGROUND IMAGE (Optional) */}
      {item.flagUrl && (
        <Image 
          source={{ uri: item.flagUrl }}
          style={styles.flagBackgroundImage}
          resizeMode={'cover'}
        />
      )}
      
      {/* TEXT CONTAINER - CENTERED */}
      <View style={styles.textContainer}>
        {/* Main Code/Label - bodySemibold */}
        <ThemedText 
          type="bodySemibold" 
          style={{ 
            color: textColor, 
            maxWidth: '100%', 
            textAlign: 'center' 
          }} 
          numberOfLines={1}
        >
            {/* UPDATED LOGIC: If lessText is true, show only label1 (USD). Otherwise, show label2 + label1 (US Dollar USD) */}
            {lessText ? item.label1 : `${item.label2} ${item.label1}`}
        </ThemedText>

        {/* Converted Value/Rate - bodySemibold */}
        <ThemedText type="bodySemibold" style={styles.rateText}>
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
  itemWidth: number; 
}

const HorizontalTicker = ({ data, lessText = false, itemWidth }: HorizontalTickerProps) => {
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
          itemWidth={itemWidth} 
        />
      ))}
    </Animated.View>
  );
};


// =========================================================================
// 4. CURRENCY UTILITIES
// =========================================================================

function calculateRelativeRate(
  selectedCurrency: SupportedCurrency,
  targetCurrency: SupportedCurrency,
  rates: ExchangeRateCache["rates"]
): number {
  const selectedCode = selectedCurrency.toUpperCase();
  const targetCode = targetCurrency.toUpperCase();

  const baseRate = rates[selectedCode] ?? 1.0;
  const targetRate = rates[targetCode] ?? 1.0;

  return targetRate / baseRate;
}

// =========================================================================
// 5. CURRENCY BANNER (WRAPPER COMPONENT)
// =========================================================================

const CURRENCY_ITEM_WIDTH = 140;

interface CurrencyBannerProps {
  lessText?: boolean; // RENAMED: New prop definition
}

export function CurrencyBanner({ lessText = false }: CurrencyBannerProps) {
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
            height: BANNER_HEIGHT,
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
          height: BANNER_HEIGHT,
          backgroundColor: bannerBackgroundColor,
          borderBottomColor: bannerBorderColor 
        }
      ]}
    >
      <HorizontalTicker 
        data={fiatTickerData} 
        lessText={lessText} // Pass the renamed prop
        itemWidth={CURRENCY_ITEM_WIDTH}
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
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
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
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.15, 
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rateText: {
    fontSize: 18, 
    marginTop: 2,
  }
});