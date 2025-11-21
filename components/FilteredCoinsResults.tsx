// components/FilteredCoinsResults.tsx
// Displays the results of filtered coin analysis

import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { FilteredCoinMatch } from "@/utils/coinFilters";
// Helper function to format percentage values
const formatPercentage = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

interface FilteredCoinsResultsProps {
  matches: FilteredCoinMatch[];
  activeFilterIds: string[];
}

export function FilteredCoinsResults({
  matches,
  activeFilterIds,
}: FilteredCoinsResultsProps) {
  const router = useRouter();
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");

  if (activeFilterIds.length === 0) {
    return null;
  }

  if (matches.length === 0) {
    return (
      <SectionContainer marginBottom={Spacing.md}>
        <ThemedText type="subtitle" style={styles.title}>
          Filter Results
        </ThemedText>
        <ThemedText type="body" variant="secondary" style={styles.emptyMessage}>
          No coins match the selected filters.
        </ThemedText>
      </SectionContainer>
    );
  }

  const handleCoinPress = (coinId: string) => {
    router.push(`/coin-detail?id=${coinId}`);
  };

  const handleListPress = (listId: string) => {
    router.push(`/list-detail?id=${listId}`);
  };

  return (
    <SectionContainer marginBottom={Spacing.md}>
      <ThemedText type="subtitle" style={styles.title}>
        Filter Results ({matches.length})
      </ThemedText>

      <ThemedView style={styles.resultsContainer}>
        {matches.map((match, index) => {
          const { coin, lists, marketData } = match;
          const priceChange24h = marketData.price_change_percentage_24h;
          const athChange = marketData.ath_change_percentage;

          return (
            <Pressable
              key={`${coin.coinId}-${index}`}
              onPress={() => handleCoinPress(coin.coinId)}
              style={[styles.coinItem, { borderColor }]}
            >
              <ThemedView style={styles.coinHeader}>
                <ThemedView style={styles.coinInfo}>
                  <ThemedText type="bodySemibold">{coin.name}</ThemedText>
                  <ThemedView style={styles.secondLine}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCoinPress(coin.coinId);
                      }}
                    >
                      <ThemedText type="small" variant="link" style={styles.coinSymbolLink}>
                        {coin.symbol.toUpperCase()}
                      </ThemedText>
                    </Pressable>
                    {lists.length > 0 && (
                      <>
                        <ThemedText type="small" variant="secondary" style={styles.separator}>
                          {" • "}
                        </ThemedText>
                        <ThemedView style={styles.listsContainer}>
                        {lists.map((listInfo, listIndex) => (
                          <ThemedView key={listInfo.listId} style={styles.listLinkWrapper}>
                            {listIndex > 0 && (
                              <ThemedText type="small" variant="secondary" style={styles.separator}>
                                {" • "}
                              </ThemedText>
                            )}
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                handleListPress(listInfo.listId);
                              }}
                            >
                              <ThemedText
                                type="small"
                                variant="link"
                                style={styles.listLinkText}
                              >
                                {listInfo.listName}
                              </ThemedText>
                            </Pressable>
                          </ThemedView>
                        ))}
                        </ThemedView>
                      </>
                    )}
                  </ThemedView>
                </ThemedView>
                {priceChange24h !== null && (
                  <ThemedText
                    type="bodySemibold"
                    style={[
                      styles.priceChange,
                      {
                        color:
                          priceChange24h >= 0 ? successColor : errorColor,
                      },
                    ]}
                  >
                    {priceChange24h >= 0 ? "+" : ""}
                    {formatPercentage(priceChange24h)}%
                  </ThemedText>
                )}
              </ThemedView>

              <ThemedView style={styles.metricsRow}>
                {athChange !== null && (
                  <ThemedView style={styles.metric}>
                    <ThemedText type="xsmall" variant="secondary">
                      From ATH
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{
                        color: athChange < -70 ? errorColor : undefined,
                      }}
                    >
                      {formatPercentage(athChange)}%
                    </ThemedText>
                  </ThemedView>
                )}
                {marketData.current_price !== null && (
                  <ThemedView style={styles.metric}>
                    <ThemedText type="xsmall" variant="secondary">
                      Price
                    </ThemedText>
                    <ThemedText type="small">
                      {marketData.current_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 6,
                      })}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </Pressable>
          );
        })}
      </ThemedView>
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.md,
  },
  emptyMessage: {
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  resultsContainer: {
    gap: Spacing.sm,
  },
  coinItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  coinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  coinInfo: {
    flex: 1,
  },
  priceChange: {
    marginLeft: Spacing.sm,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metric: {
    gap: Spacing.xs / 2,
  },
  secondLine: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: Spacing.xs / 2,
  },
  listsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginLeft: Spacing.xs,
  },
  listLinkWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    marginHorizontal: Spacing.xs / 4,
  },
  listLinkText: {
    textDecorationLine: "underline",
  },
  coinSymbolLink: {
    textDecorationLine: "underline",
  },
});

