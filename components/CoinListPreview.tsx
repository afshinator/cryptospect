// components/CoinListPreview.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CoinList } from "@/constants/coinLists";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { Image, StyleSheet, View } from "react-native";

// Adjustable overlap amount (negative margin to overlap icons)
const ICON_OVERLAP = -8; // pixels of overlap between icons

interface CoinListPreviewProps {
  list: CoinList;
}

/**
 * Displays a coin list preview with overlapping coin icons and count
 * Used on both home page and lists page
 */
export function CoinListPreview({ list }: CoinListPreviewProps) {
  const { cryptoMarket } = useAppInitialization();
  const marketData = cryptoMarket?.data;
  const borderColor = useThemeColor({}, "border");

  // Get coin images from market data
  const coinImages = list.coins
    .map((coin) => {
      const marketCoin = marketData?.find((m) => m.id === coin.coinId);
      return marketCoin?.image || coin.apiData?.image;
    })
    .filter((image): image is string => !!image)
    .slice(0, 5); // Limit to first 5 coins for display

  const coinCount = list.coins.length;

  return (
    <ThemedView style={styles.container}>
      {coinImages.length > 0 && (
        <View style={styles.iconsContainer}>
          {coinImages.map((imageUri, index) => (
            <Image
              key={`${list.id}-${index}`}
              source={{ uri: imageUri }}
              style={[
                styles.coinIcon,
                {
                  marginLeft: index > 0 ? ICON_OVERLAP : 0,
                  borderColor,
                },
              ]}
            />
          ))}
        </View>
      )}
      <ThemedText type="small" variant="secondary">
        ({coinCount})
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
});

