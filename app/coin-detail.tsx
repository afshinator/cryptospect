// app/coin-detail.tsx

import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useCoinLists } from "@/hooks/use-coin-lists";
import { CURRENCY_SYMBOLS } from "@/constants/currency";

export default function CoinDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cryptoMarket } = useAppInitialization();
  const { data: lists } = useCoinLists();

  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  // Find the coin in the market data
  const coin = useMemo(() => {
    return cryptoMarket?.data?.find((c) => c.id === id);
  }, [cryptoMarket?.data, id]);

  // Find all lists that contain this coin
  const containingLists = useMemo(() => {
    if (!lists || !id) return [];
    return lists.filter((list) =>
      list.coins.some((coin) => coin.coinId === id)
    );
  }, [lists, id]);

  if (!coin) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenContainer>
          <ThemedView style={styles.centerContainer}>
            <ThemedText type="subtitle">Coin not found</ThemedText>
            <ThemedText type="body" variant="secondary">
              Use the back button above to return
            </ThemedText>
          </ThemedView>
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  const currencySymbol =
    CURRENCY_SYMBOLS[cryptoMarket?.currency || "usd"] || "$";

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "N/A";
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return "N/A";
    return `${currencySymbol}${price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })}`;
  };

  const formatPercentage = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "N/A";
    const sign = num >= 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenContainer>
        <ThemedView style={styles.container}>
          <ScrollView>
            {/* Coin Header */}
            <ThemedView style={styles.header}>
              {coin.image && (
                <Image source={{ uri: coin.image }} style={styles.coinImage} />
              )}
              <ThemedView style={styles.headerText}>
                <ThemedText type="large">{coin.name}</ThemedText>
                <ThemedText type="subtitle" variant="secondary">
                  {coin.symbol.toUpperCase()}
                </ThemedText>
                {coin.market_cap_rank && (
                  <ThemedText type="small" variant="secondary">
                    Rank #{coin.market_cap_rank}
                  </ThemedText>
                )}
              </ThemedView>
            </ThemedView>

            {/* Price Section */}
            <ThemedView style={[styles.section, { borderColor }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Price
              </ThemedText>
              <ThemedText type="xlarge">
                {formatPrice(coin.current_price)}
              </ThemedText>
              {coin.price_change_percentage_24h !== null && (
                <ThemedText
                  type="body"
                  variant={
                    (coin.price_change_percentage_24h || 0) >= 0
                      ? "success"
                      : "error"
                  }
                >
                  {`${formatPercentage(coin.price_change_percentage_24h)} (24h)`}
                </ThemedText>
              )}
            </ThemedView>

            {/* Market Data */}
            <ThemedView style={[styles.section, { borderColor }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Market Data
              </ThemedText>
              <DataRow
                label="Market Cap"
                value={formatPrice(coin.market_cap)}
                borderColor={borderColor}
              />
              <DataRow
                label="24h Volume"
                value={formatPrice(coin.total_volume)}
                borderColor={borderColor}
              />
              <DataRow
                label="24h High"
                value={formatPrice(coin.high_24h)}
                borderColor={borderColor}
              />
              <DataRow
                label="24h Low"
                value={formatPrice(coin.low_24h)}
                borderColor={borderColor}
              />
              <DataRow
                label="Market Cap Change (24h)"
                value={formatPercentage(coin.market_cap_change_percentage_24h)}
                borderColor={borderColor}
              />
            </ThemedView>

            {/* Supply Data */}
            <ThemedView style={[styles.section, { borderColor }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Supply
              </ThemedText>
              <DataRow
                label="Circulating Supply"
                value={formatNumber(coin.circulating_supply)}
                borderColor={borderColor}
              />
              <DataRow
                label="Total Supply"
                value={formatNumber(coin.total_supply)}
                borderColor={borderColor}
              />
              <DataRow
                label="Max Supply"
                value={formatNumber(coin.max_supply)}
                borderColor={borderColor}
              />
            </ThemedView>

            {/* Historical Data */}
            <ThemedView style={[styles.section, { borderColor }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Historical
              </ThemedText>
              <DataRow
                label="All-Time High"
                value={formatPrice(coin.ath)}
                borderColor={borderColor}
              />
              {coin.ath_date && (
                <DataRow
                  label="ATH Date"
                  value={new Date(coin.ath_date).toLocaleDateString()}
                  borderColor={borderColor}
                />
              )}
              <DataRow
                label="All-Time Low"
                value={formatPrice(coin.atl)}
                borderColor={borderColor}
              />
              {coin.atl_date && (
                <DataRow
                  label="ATL Date"
                  value={new Date(coin.atl_date).toLocaleDateString()}
                  borderColor={borderColor}
                />
              )}
            </ThemedView>

            {/* Lists Containing This Coin */}
            {containingLists.length > 0 && (
              <ThemedView style={[styles.section, { borderColor }]}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  In Lists ({containingLists.length})
                </ThemedText>
                {containingLists.map((list) => (
                  <Pressable
                    key={list.id}
                    onPress={() => router.push(`/list-detail?id=${list.id}`)}
                    style={[styles.listItem, { borderColor }]}
                  >
                    <ThemedText type="bodySemibold">{list.name}</ThemedText>
                    <IconSymbol name="chevron.right" size={20} color={tintColor} />
                  </Pressable>
                ))}
              </ThemedView>
            )}
          </ScrollView>
        </ThemedView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

function DataRow({
  label,
  value,
  borderColor,
}: {
  label: string;
  value: string;
  borderColor: string;
}) {
  return (
    <ThemedView
      style={[styles.dataRow, { borderBottomColor: borderColor }]}
    >
      <ThemedText type="body" variant="secondary">
        {label}
      </ThemedText>
      <ThemedText type="bodySemibold">{value}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  coinImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  headerText: {
    flex: 1,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
  },
});

