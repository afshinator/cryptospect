// app/coin-detail.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AthAtlLogScaleBar } from "@/components/AthAtlLogScaleBar";
import { AthAtlRangeBar } from "@/components/AthAtlRangeBar";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CURRENCY_SYMBOLS } from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useCoinLists } from "@/hooks/use-coin-lists";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";

// Layout constants for alignment and spacing tweaks
const PRICE_COLUMN_RIGHT_PADDING = 50; // Web: horizontal padding on right side of price column
const ATH_ATL_MOBILE_BOTTOM_OFFSET = -8; // Mobile: vertical offset for ATH/ATL positioning (moved up one line from -24)
const PRICE_CONTAINER_BOTTOM_PADDING = 32; // Mobile: bottom padding to enclose absolutely positioned ATH/ATL
const PRICE_CONTAINER_MIN_HEIGHT = 60; // Mobile: minimum height for price container layout

export default function CoinDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cryptoMarket } = useAppInitialization();
  const { data: lists } = useCoinLists();
  const { data: preferences } = usePreferences();

  const borderColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");
  const tintColor = useThemeColor({}, "tint");

  // Use smaller font for Market Data labels on mobile when font scaling is >= 1.3x
  const marketDataLabelType = Platform.OS !== 'web' && (preferences?.fontScale ?? 1.0) >= 1.3 ? "xsmall" : "body";

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

  const formatPercentageValue = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "N/A";
    const sign = num >= 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}`;
  };

  const formatDataAge = (lastUpdated: string | null | undefined, snapshotTimestamp: number | undefined): string | null => {
    let timestamp: number | null = null;

    if (lastUpdated) {
      timestamp = new Date(lastUpdated).getTime();
    } else if (snapshotTimestamp) {
      timestamp = snapshotTimestamp;
    }

    if (!timestamp) return null;

    const now = Date.now();
    const diffSeconds = Math.floor((now - timestamp) / 1000);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate percentage changes from ATH and ATL
  const calculateChangeFromAth = (): number | null => {
    if (!coin.current_price || !coin.ath) return null;
    return ((coin.current_price - coin.ath) / coin.ath) * 100;
  };

  const calculateChangeFromAtl = (): number | null => {
    if (!coin.current_price || !coin.atl) return null;
    return ((coin.current_price - coin.atl) / coin.atl) * 100;
  };

  const changeFromAth = calculateChangeFromAth();
  const changeFromAtl = calculateChangeFromAtl();

  const dataAge = formatDataAge(coin.last_updated, cryptoMarket?.timestamp);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenContainer>
        <ThemedView style={styles.container}>
          <ScrollView accessibilityViewIsModal={false}>
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
              <View style={styles.priceSectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Price
                </ThemedText>
                {dataAge && (
                  <ThemedText type="small" variant="secondary" style={styles.dataAgeTopRight}>
                    {dataAge}
                  </ThemedText>
                )}
              </View>
              <View style={styles.priceContainer}>
                <View style={styles.priceMainRow}>
                  <View style={styles.priceAndAthAtlRow}>
                    <View style={Platform.OS === 'web' ? styles.priceTextContainer : undefined}>
                      <ThemedText type={Platform.OS === 'web' ? "xlarge" : "title"}>
                        {formatPrice(coin.current_price)}
                      </ThemedText>
                    </View>
                    {Platform.OS === 'web' && (
                      <>
                        <View style={styles.athAtlColumn}>
                          <View style={styles.athAtlRow}>
                            <ThemedText type="subtitle" variant="secondary" style={styles.athAtlBold}>
                              ATH:
                            </ThemedText>
                            <ThemedText type="subtitle" variant="secondary" style={styles.athAtlBold}>
                              {formatPrice(coin.ath)}
                            </ThemedText>
                            {coin.ath_date && (
                              <ThemedText type="xsmall" variant="secondary">
                                {' '}{formatDate(coin.ath_date)}
                              </ThemedText>
                            )}
                          </View>
                          <View style={styles.athAtlRow}>
                            <ThemedText type="subtitle" variant="secondary" style={styles.athAtlBold}>
                              ATL:
                            </ThemedText>
                            <ThemedText type="subtitle" variant="secondary" style={styles.athAtlBold}>
                              {formatPrice(coin.atl)}
                            </ThemedText>
                            {coin.atl_date && (
                              <ThemedText type="xsmall" variant="secondary">
                                {' '}{formatDate(coin.atl_date)}
                              </ThemedText>
                            )}
                          </View>
                        </View>
                        <View style={styles.changeFromColumn}>
                          {changeFromAth !== null && (
                            <ThemedText type="subtitle" variant="secondary" style={styles.athAtlBold}>
                              Down from ATH:{' '}
                              <Text style={{ color: errorColor, fontWeight: 'bold' }}>
                                {formatPercentageValue(changeFromAth)}
                              </Text>
                              <Text style={{ color: textSecondaryColor }}>%</Text>
                            </ThemedText>
                          )}
                          {changeFromAtl !== null && (
                            <ThemedText type="subtitle" variant="secondary" style={styles.athAtlBold}>
                              Up from ATL:{' '}
                              <Text style={{ color: successColor, fontWeight: 'bold' }}>
                                {formatPercentageValue(changeFromAtl)}
                              </Text>
                              <Text style={{ color: textSecondaryColor }}>%</Text>
                            </ThemedText>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                </View>
                {coin.price_change_percentage_24h !== null && (
                  <View style={Platform.OS === 'web' ? undefined : styles.priceChangeRow}>
                    <ThemedText
                      type="body"
                      variant={
                        (coin.price_change_percentage_24h || 0) >= 0
                          ? "success"
                          : "error"
                      }
                      style={Platform.OS === 'web' ? undefined : styles.priceChangeText}
                    >
                      {`${formatPercentage(coin.price_change_percentage_24h)} (24h)`}
                    </ThemedText>
                    {Platform.OS !== 'web' && (
                      <View style={styles.rangeBarMobile}>
                        <AthAtlRangeBar
                          currentPrice={coin.current_price || 0}
                          ath={coin.ath || 0}
                          atl={coin.atl || 0}
                          currencySymbol={currencySymbol}
                          width="100%"
                          barHeight={6}
                          showLabels={false}
                          showCurrentPrice={false}
                          indicatorStyle="bar"
                          recentChangePercentage={coin.price_change_percentage_24h ? coin.price_change_percentage_24h / 100 : undefined}
                          formatPrice={formatPrice}
                          formatDate={formatDate}
                        />
                      </View>
                    )}
                  </View>
                )}
                {Platform.OS === 'web' && (
                  <View style={styles.rangeBarWeb}>
                    <AthAtlRangeBar
                      currentPrice={coin.current_price || 0}
                      ath={coin.ath || 0}
                      atl={coin.atl || 0}
                      currencySymbol={currencySymbol}
                      width="100%"
                      barHeight={8}
                      showLabels={false}
                      showCurrentPrice={false}
                      indicatorStyle="bar"
                      recentChangePercentage={coin.price_change_percentage_24h ? coin.price_change_percentage_24h / 100 : undefined}
                      formatPrice={formatPrice}
                      formatDate={formatDate}
                    />
                  </View>
                )}
                {Platform.OS !== 'web' && (
                  <View style={styles.athAtlMobile}>
                    <Text style={[styles.athAtlMobileText, { color: textSecondaryColor }]}>
                      <Text style={styles.athAtlBold}>ATH:</Text> <Text style={styles.athAtlBold}>{formatPrice(coin.ath)}</Text>
                      {coin.ath_date && ` ${formatDate(coin.ath_date)}`}
                      {changeFromAth !== null && (
                        <Text style={{ color: textSecondaryColor }}>
                          {' '}(<Text style={{ color: errorColor }}>{formatPercentage(changeFromAth)}</Text>)
                        </Text>
                      )}
                    </Text>
                    <Text style={[styles.athAtlMobileText, { color: textSecondaryColor }]}>
                      <Text style={styles.athAtlBold}>ATL:</Text> <Text style={styles.athAtlBold}>{formatPrice(coin.atl)}</Text>
                      {coin.atl_date && ` ${formatDate(coin.atl_date)}`}
                      {changeFromAtl !== null && (
                        <Text style={{ color: textSecondaryColor }}>
                          {' '}(<Text style={{ color: successColor }}>{formatPercentage(changeFromAtl)}</Text>)
                        </Text>
                      )}
                    </Text>
                  </View>
                )}
              </View>
            </ThemedView>

            {/* Log Scale Section */}
            <ThemedView style={[styles.section, { borderColor }]}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                ATH/ATL Log Scale
              </ThemedText>
              <AthAtlLogScaleBar
                currentPrice={coin.current_price || 0}
                ath={coin.ath || 0}
                atl={coin.atl || 0}
                athDate={coin.ath_date}
                atlDate={coin.atl_date}
                currencySymbol={currencySymbol}
                width="100%"
                barHeight={Platform.OS === 'web' ? 8 : 6}
                showLabels={true}
                showCurrentPrice={false}
                showLogMarkers={true}
                formatPrice={formatPrice}
                formatDate={formatDate}
              />

              <Collapsible title="more info...">
                <ThemedText type="body" variant="secondary" style={styles.detailsText}>
                  The difference between ATL and ATH can span multiple orders of magnitude (e.g., $0.001 to $10).
                </ThemedText>
                <ThemedText type="body" variant="secondary" style={styles.detailsText}>
                  The linear scaler above can make the current price look practically at the ATL if the ATH is huge.
                  A logarithmic scale normalizes the extreme values and makes the current price look more realistic.
                </ThemedText>
                <ThemedText type="body" variant="secondary" style={styles.detailsText}>
                  The indicator's position reflects how close the price is to the next power of ten or the midpoint in terms of
                  growth potential.
                </ThemedText>

                <ThemedText type="body" variant="secondary" style={styles.detailsText}>
                  This helps sense if the coin is closer to recovering the "mental mile-markers" in the logarithmic journey towards a new ATH.
                </ThemedText>
              </Collapsible>
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
                labelType={marketDataLabelType}
              />
              <DataRow
                label="24h Volume"
                value={formatPrice(coin.total_volume)}
                borderColor={borderColor}
                labelType={marketDataLabelType}
              />
              <DataRow
                label="24h High"
                value={formatPrice(coin.high_24h)}
                borderColor={borderColor}
                labelType={marketDataLabelType}
              />
              <DataRow
                label="24h Low"
                value={formatPrice(coin.low_24h)}
                borderColor={borderColor}
                labelType={marketDataLabelType}
              />
              <DataRow
                label="Market Cap Change (24h)"
                value={formatPercentage(coin.market_cap_change_percentage_24h)}
                borderColor={borderColor}
                labelType={marketDataLabelType}
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

            {/* Lists Containing This Coin */}
            {containingLists.length > 0 && (
              <ThemedView style={[styles.section, { borderColor }]}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  {coin.symbol.toUpperCase()} is in these lists ({containingLists.length})
                </ThemedText>
                {containingLists.map((list) => (
                  <Pressable
                    key={list.id}
                    onPress={() => router.push(`/list-detail?id=${list.id}`)}
                    style={[styles.listItem, { borderColor }]}
                    accessibilityRole="button"
                    accessibilityLabel={`View list ${list.name}`}
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
  labelType = "body",
}: {
  label: string;
  value: string;
  borderColor: string;
  labelType?: "body" | "xsmall";
}) {
  return (
    <ThemedView
      style={[styles.dataRow, { borderBottomColor: borderColor }]}
    >
      <ThemedText type={labelType} variant="secondary">
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
  priceSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  dataAgeTopRight: {
    alignSelf: "flex-start",
  },
  priceContainer: {
    marginBottom: Spacing.xs,
    ...Platform.select({
      default: {
        position: 'relative',
        minHeight: PRICE_CONTAINER_MIN_HEIGHT,
        paddingBottom: PRICE_CONTAINER_BOTTOM_PADDING,
      },
      web: {},
    }),
  },
  priceMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  priceAndAthAtlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  priceTextContainer: {
    paddingRight: PRICE_COLUMN_RIGHT_PADDING,
  },
  athAtlColumn: {
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  changeFromColumn: {
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  athAtlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  athAtlBold: {
    fontWeight: 'bold',
  },
  athAtlMobile: {
    position: 'absolute',
    bottom: ATH_ATL_MOBILE_BOTTOM_OFFSET,
    right: 0,
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  athAtlMobileText: {
    fontSize: 12,
    lineHeight: 16,
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
  priceChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  priceChangeText: {
    flex: 1,
  },
  rangeBarMobile: {
    flex: 1,
    justifyContent: "center",
  },
  rangeBarWeb: {
    width: "100%",
    marginTop: Spacing.sm,
  },
  detailsText: {
    marginBottom: Spacing.sm,
  },
});

