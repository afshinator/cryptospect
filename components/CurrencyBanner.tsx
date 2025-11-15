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
  CRYPTO_DECIMAL_PLACES,
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

// --- BANNER CONSTANTS ---
// The height of the scrolling banner container
const BANNER_HEIGHT = 70;
// The fixed width for each currency flag item
const FLAG_ITEM_WIDTH = 140;
// The duration for one full scroll cycle (lower number = faster speed)
const SCROLL_SPEED_MS = 30000;

// Local map for display names not present in CURRENCY_DISPLAY_NAMES (e.g., crypto)
const ADDITIONAL_DISPLAY_NAMES: Partial<Record<SupportedCurrency | 'btc' | 'eth', string>> = {
  btc: "Bitcoin",
  eth: "Ethereum",
};

// --- UTILITIES (Unchanged) ---

function calculateRelativeRate(
  selectedCurrency: SupportedCurrency,
  targetCurrency: SupportedCurrency | 'btc' | 'eth',
  rates: ExchangeRateCache["rates"]
): number {
  const selectedCode = selectedCurrency.toUpperCase();
  const targetCode = targetCurrency.toUpperCase();

  const baseRate = rates[selectedCode] ?? 1.0;
  const targetRate = rates[targetCode] ?? 1.0;

  return targetRate / baseRate;
}

// --- SUB COMPONENT (A single flag item) ---

interface BannerItemProps {
  code: SupportedCurrency | 'btc' | 'eth';
  rate: number;
  showLabels: boolean;
}

const BannerItem = React.memo(({ code, rate, showLabels }: BannerItemProps) => {
  const isCrypto = code === "btc" || code === "eth";
  const displayCode = code.toUpperCase();
  
  const label = 
    (CURRENCY_DISPLAY_NAMES as Record<string, string>)[code] ||
    ADDITIONAL_DISPLAY_NAMES[code] ||
    displayCode;

  const symbol = CURRENCY_SYMBOLS[code] || "$";
  const decimalPlaces = isCrypto ? CRYPTO_DECIMAL_PLACES : FIAT_DECIMAL_PLACES;
  const formattedRate = rate.toFixed(decimalPlaces);
  
  const flagUrl = CURRENCY_FLAG_URLS[code];
  const itemBackgroundColor = useThemeColor({}, "backgroundSecondary");
  const itemBorderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");

  return (
    <ThemedView 
        style={[
            styles.itemContainer, 
            { 
                width: FLAG_ITEM_WIDTH, 
                backgroundColor: itemBackgroundColor,
                borderRightColor: itemBorderColor,
            }
        ]} 
        shadow="sm"
    >
      {/* BACKGROUND FLAG IMAGE */}
      {flagUrl && (
        <Image 
          source={{ uri: flagUrl }}
          style={styles.flagBackgroundImage}
          resizeMode={'cover'}
        />
      )}
      
      {/* TEXT CONTAINER - NOW CENTERED */}
      <View style={styles.textContainer}>
        {/* Currency Code (Always shown) and Label (Conditional) - NOW bodySemibold */}
        <ThemedText 
          type="bodySemibold" 
          style={{ 
            color: textColor, 
            maxWidth: '100%', 
            textAlign: 'center' // Ensures text alignment is centered
          }} 
          numberOfLines={1}
        >
            {showLabels ? `${label} ${displayCode}` : displayCode}
        </ThemedText>

        {/* Converted Rate (Price is large) */}
        <ThemedText type="largeSemibold" style={styles.rateText}>
          {symbol} {formattedRate}
        </ThemedText>
      </View>
    </ThemedView>
  );
});

// --- MAIN COMPONENT ---

interface CurrencyBannerProps {
  showLabels?: boolean; // Optional prop for the friendly name
}

export function CurrencyBanner({ showLabels = true }: CurrencyBannerProps) {
  const { data: prefs, isPending: isPrefsPending } = usePreferences();
  const {
    data: ratesData,
    isLoading: isRatesLoading,
    error,
  } = useExchangeRates();

  const scrollAnim = useRef(new Animated.Value(0)).current;
  
  // Dynamic Theme Colors
  const bannerBackgroundColor = useThemeColor({}, "background");
  const bannerBorderColor = useThemeColor({}, "border");

  const dataForList = React.useMemo(() => {
    if (!prefs || !ratesData || !ratesData.rates) return [];
    
    const selectedCurrency = prefs.currency;

    return DISPLAY_CURRENCIES.map((code) => {
      const relativeRate = calculateRelativeRate(
        selectedCurrency,
        code,
        ratesData.rates
      );
      return { code, rate: relativeRate };
    });
  }, [prefs, ratesData]);

  const infiniteData = React.useMemo(() => {
    return dataForList.length > 0
      ? [...dataForList, ...dataForList, ...dataForList]
      : [];
  }, [dataForList]);
  
  const fullDataWidth = dataForList.length * FLAG_ITEM_WIDTH;

  const startAnimation = useCallback(() => {
    scrollAnim.stopAnimation();
    
    Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1, 
        duration: SCROLL_SPEED_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [scrollAnim]);

  useEffect(() => {
    if (infiniteData.length > 0) {
      startAnimation();
    }
    return () => scrollAnim.stopAnimation();
  }, [infiniteData, startAnimation, scrollAnim]);


  const translateX = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -fullDataWidth], 
  });


  // --- Render ---

  if (isPrefsPending || isRatesLoading || infiniteData.length === 0 || error) {
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
        <ActivityIndicator size="small" color={useThemeColor({}, "tint")} />
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
      <Animated.View 
        style={[
          styles.scrollContent, 
          { 
            width: infiniteData.length * FLAG_ITEM_WIDTH, 
            transform: [{ translateX }] 
          }
        ]}
      >
        {infiniteData.map((item, index) => (
          <BannerItem 
            key={index} 
            code={item.code} 
            rate={item.rate} 
            showLabels={showLabels} // Pass the prop for friendly name control
          />
        ))}
      </Animated.View>
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
    padding: Spacing.xs,
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
    // CHANGED: Centered alignment
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 1,
  },
  // Price text style
  rateText: {
    fontSize: 18, 
  }
});