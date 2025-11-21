import { CoinFilters } from "@/components/CoinFilters";
import { CoinListItem } from "@/components/CoinListItem";
import { CurrencyBanner } from "@/components/CurrencyBanner";
import { DominanceMomentumWidget } from "@/components/DominanceMomentumWidget";
import { LatestDominancePercentages } from "@/components/dominance/LatestDominancePercentages";
import { FilteredCoinsResults } from "@/components/FilteredCoinsResults";
import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useCoinLists } from "@/hooks/use-coin-lists";
import {
  applyFilters,
  createMarketDataMap,
} from "@/utils/coinFilters";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { data: lists, isLoading } = useCoinLists();
  const { cryptoMarket } = useAppInitialization();
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
  const [andFilterIds, setAndFilterIds] = useState<string[]>([]);

  const handleListPress = (listId: string) => {
    router.push(`/list-detail?id=${listId}`);
  };

  const handleFilterToggle = (filterId: string) => {
    setActiveFilterIds((prev) => {
      if (prev.includes(filterId)) {
        // Remove from active, also remove from AND if it was there
        setAndFilterIds((andPrev) => andPrev.filter((id) => id !== filterId));
        return prev.filter((id) => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  const handleAndToggle = (filterId: string) => {
    setAndFilterIds((prev) => {
      if (prev.includes(filterId)) {
        return prev.filter((id) => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  // Apply filters to get matching coins
  const filteredMatches = useMemo(() => {
    if (!lists || activeFilterIds.length === 0 || !cryptoMarket?.data) {
      return {};
    }

    const marketDataMap = createMarketDataMap(cryptoMarket.data);
    return applyFilters(lists, marketDataMap, activeFilterIds, andFilterIds);
  }, [lists, cryptoMarket, activeFilterIds, andFilterIds]);

  return (
    <SafeAreaView style={{ flex: 1 }}> 
      
      {/* FIXED CONTENT: Currency Banner remains at the top */}
      <CurrencyBanner 
        lessText 
        hideCurrencyName={Platform.OS === "web" ? false : true}
        size={Platform.OS === "web" ? "default" : "small"} 
      />

      {/* SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.scrollArea}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="large">CryptoSpect</ThemedText>
          <HelloWave />
        </ThemedView>

        {/* Dominance Section */}
        <LatestDominancePercentages showAllFour={true}/>

        {/* Dominance Momentum Widget */}
        <DominanceMomentumWidget />

        {/* Filters and Analysis Section */}
        <CoinFilters
          activeFilterIds={activeFilterIds}
          onFilterToggle={handleFilterToggle}
          andFilterIds={andFilterIds}
          onAndToggle={handleAndToggle}
        />

        {/* Filter Results */}
        {activeFilterIds.length > 0 && (
          <FilteredCoinsResults
            matches={filteredMatches}
            activeFilterIds={activeFilterIds}
            isLoading={!cryptoMarket?.data}
          />
        )}

        {/* Coin Lists Section */}
        <ThemedView style={styles.listsSection} lightColor="transparent" darkColor="transparent">
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Coin Lists
          </ThemedText>
          {isLoading ? (
            <ThemedText type="body" variant="secondary">
              Loading lists...
            </ThemedText>
          ) : lists && lists.length > 0 ? (
            lists.map((list) => (
              <CoinListItem
                key={list.id}
                list={list}
                onPress={handleListPress}
                showChevron={true}
                variant="home"
              />
            ))
          ) : (
            <ThemedText type="body" variant="secondary">
              No lists yet. Create your first list in the Lists tab!
            </ThemedText>
          )}
        </ThemedView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  contentContainer: {
    paddingVertical: Spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  listsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  stepContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});