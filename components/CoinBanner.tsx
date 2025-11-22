import React, { useCallback, useEffect, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { CoinList } from "@/constants/coinLists";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useThemeColor } from "@/hooks/use-theme-color";

// --- GLOBAL BANNER CONSTANTS ---
const BANNER_HEIGHT = 70;
const BANNER_HEIGHT_SMALL = 35; // Half height for small version
const SCROLL_SPEED_MS = 30000;

interface TickerItem {
  id: string;
  label1: string; // Main identifier (e.g., BTC)
  label2: string; // Friendly name (e.g., Bitcoin)
  value: string;
  imageUrl?: string;
}

interface GenericTickerItemProps {
  item: TickerItem;
  lessText: boolean; // Whether to display only label1 (less text)
  hideCoinName: boolean; // Whether to hide coin name (label2)
  itemWidth: number;
  itemHeight: number;
  size: CoinBannerSize;
  valueColor?: string; // Color for the value text (based on positive/negative)
}

const GenericTickerItem = React.memo(({ 
  item, 
  lessText, 
  hideCoinName, 
  itemWidth, 
  itemHeight, 
  size,
  valueColor 
}: GenericTickerItemProps) => {
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
    ? item.label1  // Only show coin symbol (BTC)
    : `${item.label2} ${item.label1}`; // Show coin name + symbol (Bitcoin BTC)

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
      {/* BACKGROUND IMAGE (Coin logo) */}
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.coinBackgroundImage,
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
        {/* Main Symbol/Name - bodySemibold (only show if not hiding coin name) */}
        {!hideCoinName && (
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

        {/* 24h Price Change - bodySemibold */}
        <ThemedText 
          type="bodySemibold" 
          style={[
            styles.valueText,
            {
              fontSize: rateFontSize,
              marginTop: hideCoinName ? 0 : rateMarginTop,
              width: '100%',
              textAlign: 'center',
              color: valueColor || textColor,
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
  lessText?: boolean;
  hideCoinName: boolean;
  itemWidth: number;
  itemHeight: number;
  size: CoinBannerSize;
  getValueColor?: (item: TickerItem) => string | undefined;
  scrollSpeedMs: number;
}

const HorizontalTicker = ({ 
  data, 
  lessText = false, 
  hideCoinName, 
  itemWidth, 
  itemHeight, 
  size,
  getValueColor,
  scrollSpeedMs
}: HorizontalTickerProps) => {
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
        duration: scrollSpeedMs,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [scrollAnim, data.length, scrollSpeedMs]);

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
          lessText={lessText}
          hideCoinName={hideCoinName}
          itemWidth={itemWidth}
          itemHeight={itemHeight}
          size={size}
          valueColor={getValueColor?.(item)}
        />
      ))}
    </Animated.View>
  );
};

const COIN_ITEM_WIDTH = 140;
const COIN_ITEM_WIDTH_SMALL = 70; // Half width for small version

export type CoinBannerSize = "default" | "small";

interface CoinBannerProps {
  lessText?: boolean; // Whether to display only coin symbol (default: true)
  hideCoinName?: boolean; // Whether to hide coin name (default: true for small size, false otherwise)
  size?: CoinBannerSize; // Size variant: "default" or "small"
  maxCoins?: number; // Maximum number of coins to display (default: all)
  speed?: number; // Scroll speed in milliseconds (default: 30000)
  coinList?: CoinList; // Optional coin list - if provided, only show coins from this list
}

// Helper function to format percentage change
const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export function CoinBanner({ 
  lessText = true, 
  hideCoinName, 
  size = "default",
  maxCoins,
  speed = SCROLL_SPEED_MS,
  coinList
}: CoinBannerProps) {
  const { cryptoMarket, isCryptoMarketPending } = useAppInitialization();

  // Dynamic Theme Colors
  const bannerBackgroundColor = useThemeColor({}, "background");
  const bannerBorderColor = useThemeColor({}, "border");
  const loadingTintColor = useThemeColor({}, "tint");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  // Calculate dimensions based on size
  const bannerHeight = size === "small" ? BANNER_HEIGHT_SMALL : BANNER_HEIGHT;
  const itemWidth = size === "small" ? COIN_ITEM_WIDTH_SMALL : COIN_ITEM_WIDTH;
  
  // For small size, default to hiding coin name if not explicitly set
  const shouldHideCoinName = hideCoinName !== undefined 
    ? hideCoinName 
    : size === "small";

  // Map coins to TickerItem format
  const coinTickerData: TickerItem[] = useMemo(() => {
    if (!cryptoMarket?.data) return [];

    // Filter out coins without 24h price change data
    let coinsWithData = cryptoMarket.data.filter(
      (coin) => coin.price_change_percentage_24h !== null && coin.price_change_percentage_24h !== undefined
    );

    // If coinList is provided, filter to only show coins from that list
    if (coinList) {
      const coinListIds = new Set(coinList.coins.map(coin => coin.coinId.toLowerCase()));
      coinsWithData = coinsWithData.filter(
        (coin) => coinListIds.has(coin.id.toLowerCase())
      );
    }

    // Limit to maxCoins if specified
    const coinsToDisplay = maxCoins 
      ? coinsWithData.slice(0, maxCoins)
      : coinsWithData;

    return coinsToDisplay.map((coin: CoinGeckoMarketData) => ({
      id: coin.id,
      label1: coin.symbol.toUpperCase(),
      label2: coin.name,
      value: formatPercentage(coin.price_change_percentage_24h),
      imageUrl: coin.image,
    }));
  }, [cryptoMarket?.data, maxCoins, coinList]);

  // Function to get color based on price change
  const getValueColor = useCallback((item: TickerItem): string | undefined => {
    // Extract the percentage value from the formatted string
    const match = item.value.match(/[+-]?(\d+\.?\d*)/);
    if (!match) return undefined;
    
    const value = parseFloat(match[0]);
    if (isNaN(value)) return undefined;
    
    return value >= 0 ? successColor : errorColor;
  }, [successColor, errorColor]);

  // --- Render ---

  if (isCryptoMarketPending || coinTickerData.length === 0) {
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
        styles.bottomShadow,
        {
          height: bannerHeight,
          backgroundColor: bannerBackgroundColor,
          borderBottomColor: bannerBorderColor,
        }
      ]}
    >
      <HorizontalTicker
        data={coinTickerData}
        lessText={lessText}
        hideCoinName={shouldHideCoinName}
        itemWidth={itemWidth}
        itemHeight={bannerHeight}
        size={size}
        getValueColor={getValueColor}
        scrollSpeedMs={speed}
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
  bottomShadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
    },
    default: {},
  }),
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
  coinBackgroundImage: {
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
  valueText: {
    marginTop: 2,
  }
});

