// components/FilteredCoinsResults.tsx
// Displays the results of filtered coin analysis

import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Collapsible } from "@/components/ui/collapsible";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { AVAILABLE_FILTERS, FilteredCoinMatch } from "@/utils/coinFilters";
// Helper function to format percentage values
const formatPercentage = (value: number): string => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

interface FilteredCoinsResultsProps {
  matches: FilteredCoinMatch[] | { [filterId: string]: FilteredCoinMatch[] };
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
  
  const getFilterTitle = (filterId?: string, count?: number): string => {
    // Get icon emoji for filter
    let emoji = "";
    if (filterId === "discounted") {
      emoji = "📉 ";
    } else if (filterId === "recent_runner") {
      emoji = "📈 ";
    }
    
    const filter = AVAILABLE_FILTERS.find(f => f.id === filterId);
    const countText = count !== undefined ? ` (${count})` : "";
    return `${emoji}${filter?.name}${countText}`;
  };

  if (activeFilterIds.length === 0) {
    return null;
  }

  // Check if matches is unified (array) or separated by filter (object)
  const isUnified = Array.isArray(matches);
  
  const handleCoinPress = (coinId: string) => {
    router.push(`/coin-detail?id=${coinId}`);
  };

  const handleListPress = (listId: string) => {
    router.push(`/list-detail?id=${listId}`);
  };

  const renderCoinItem = (match: FilteredCoinMatch, index: number) => {
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
  };

  // Unified results (AND logic enabled)
  if (isUnified) {
    const unifiedMatches = matches as FilteredCoinMatch[];
    const totalCount = unifiedMatches.length;

    if (totalCount === 0) {
      return (
        <SectionContainer marginBottom={Spacing.md}>
          <ThemedText type="subtitle" style={styles.title}>
            Filter Results (Unified)
          </ThemedText>
          <ThemedText type="body" variant="secondary" style={styles.emptyMessage}>
            No coins match the selected filters with AND logic.
          </ThemedText>
        </SectionContainer>
      );
    }

    return (
      <SectionContainer marginBottom={Spacing.md}>
        <ThemedText type="subtitle" style={styles.title}>
          Filter Results (Unified) ({totalCount})
        </ThemedText>
        <ThemedView style={styles.resultsContainer}>
          {unifiedMatches.map((match, index) => renderCoinItem(match, index))}
        </ThemedView>
      </SectionContainer>
    );
  }

  // Separate results per filter (OR logic)
  const separatedMatches = matches as { [filterId: string]: FilteredCoinMatch[] };
  const hasAnyResults = Object.values(separatedMatches).some(arr => arr.length > 0);

  if (!hasAnyResults) {
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

  return (
    <SectionContainer marginBottom={Spacing.md}>
      <ThemedText type="subtitle" style={styles.title}>
        Filter Results
      </ThemedText>
      <ThemedView style={styles.resultsContainer}>
        {activeFilterIds.map((filterId) => {
          const filterMatches = separatedMatches[filterId] || [];
          const filter = AVAILABLE_FILTERS.find(f => f.id === filterId);
          
          if (filterMatches.length === 0) {
            return null;
          }

          const titleText = getFilterTitle(filterId, filterMatches.length);

          return (
            <Collapsible 
              key={filterId} 
              title={titleText}
              style={styles.filterCollapsible}
            >
              <ThemedView style={styles.filterResults}>
                {filterMatches.map((match, index) => renderCoinItem(match, index))}
              </ThemedView>
            </Collapsible>
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
  filterCollapsible: {
    marginBottom: Spacing.md,
  },
  filterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  filterSectionTitleContainer: {
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterSectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  filterSectionIcon: {
    // Icon size is controlled by the size prop on IconSymbol
  },
  filterSectionTitle: {
    // Title text styling
  },
  filterResults: {
    gap: Spacing.sm,
  },
});

