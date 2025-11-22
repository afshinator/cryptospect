// components/CoinAutocomplete.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { SupportedCurrency } from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";
import { fetchCoinMarketData, searchCoins } from "@/utils/coinGeckoApi";
import { saveSearchedCoin } from "@/utils/searchedCoinsStorage";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

interface CoinAutocompleteProps {
  onSelect: (coin: CoinGeckoMarketData) => void;
  excludeCoinIds?: string[]; // Coins to exclude from results (e.g., already in list)
  placeholder?: string;
}

export function CoinAutocomplete({
  onSelect,
  excludeCoinIds = [],
  placeholder = "Search by name or symbol",
}: CoinAutocompleteProps) {
  const { cryptoMarket } = useAppInitialization();
  const { data: preferences } = usePreferences();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiSearchResults, setApiSearchResults] = useState<CoinGeckoMarketData[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [apiSearchError, setApiSearchError] = useState<string | null>(null);
  const [isFetchingMarketData, setIsFetchingMarketData] = useState(false);
  const inputRef = React.useRef<TextInput>(null);
  
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");

  // Check if there's an exact match in the excluded coins (already in list)
  const exactMatchInList = useMemo(() => {
    if (!cryptoMarket?.data || !searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase().trim();
    
    // Find coins that are excluded (already in list)
    const excludedCoins = cryptoMarket.data.filter((coin) =>
      excludeCoinIds.includes(coin.id)
    );

    // Check for exact match by symbol or name
    const match = excludedCoins.find(
      (coin) =>
        coin.symbol.toLowerCase() === query ||
        coin.name.toLowerCase() === query
    );

    return match || null;
  }, [searchQuery, cryptoMarket?.data, excludeCoinIds]);

  // Filter and search coins - prioritize coins that start with the query
  const filteredCoins = useMemo(() => {
    if (!cryptoMarket?.data) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    const availableCoins = cryptoMarket.data.filter(
      (coin) => !excludeCoinIds.includes(coin.id)
    );

    // Separate coins into groups with priority:
    // 1. Symbol starts with query (highest priority)
    // 2. Name starts with query (but symbol doesn't)
    // 3. Symbol contains query (but doesn't start)
    // 4. Name contains query (but doesn't start)
    const symbolStartsWith: CoinGeckoMarketData[] = [];
    const nameStartsWith: CoinGeckoMarketData[] = [];
    const symbolContains: CoinGeckoMarketData[] = [];
    const nameContains: CoinGeckoMarketData[] = [];

    availableCoins.forEach((coin) => {
      const nameLower = coin.name.toLowerCase();
      const symbolLower = coin.symbol.toLowerCase();
      
      const nameStartsWithQuery = nameLower.startsWith(query);
      const symbolStartsWithQuery = symbolLower.startsWith(query);
      const nameContainsQuery = nameLower.includes(query);
      const symbolContainsQuery = symbolLower.includes(query);

      if (symbolStartsWithQuery) {
        symbolStartsWith.push(coin);
      } else if (nameStartsWithQuery) {
        nameStartsWith.push(coin);
      } else if (symbolContainsQuery) {
        symbolContains.push(coin);
      } else if (nameContainsQuery) {
        nameContains.push(coin);
      }
    });

    // Return in priority order, limit to 50 total
    return [
      ...symbolStartsWith,
      ...nameStartsWith,
      ...symbolContains,
      ...nameContains,
    ].slice(0, 50);
  }, [searchQuery, cryptoMarket?.data, excludeCoinIds]);

  // Combine local results with API search results, filtering out excluded coins
  const allFilteredCoins = useMemo(() => {
    const local = filteredCoins;
    const api = apiSearchResults.filter(
      (coin) => !excludeCoinIds.includes(coin.id)
    );
    
    // Remove duplicates (prioritize local results)
    const localIds = new Set(local.map(c => c.id));
    const uniqueApi = api.filter(c => !localIds.has(c.id));
    
    return [...local, ...uniqueApi].slice(0, 50);
  }, [filteredCoins, apiSearchResults, excludeCoinIds]);

  const handleSelect = async (coin: CoinGeckoMarketData) => {
    // Check if this coin is from API search (not in local cache)
    // A coin is from API search if:
    // 1. It's in apiSearchResults, OR
    // 2. It's not in the main cryptoMarket cache (meaning it was found via search)
    const isInApiResults = apiSearchResults.some(c => c.id === coin.id);
    const isInMainCache = cryptoMarket?.data?.some(c => c.id === coin.id);
    const isFromApiSearch = isInApiResults || (!isInMainCache && searchQuery.trim().length >= 2);
    
    console.log(`🔍 Coin selection debug:`, {
      coinId: coin.id,
      coinName: coin.name,
      isInApiResults,
      isInMainCache,
      isFromApiSearch,
      searchQueryLength: searchQuery.trim().length,
    });
    
    // If it's from API search, fetch full market data and save it
    if (isFromApiSearch) {
      console.log(`📥 Fetching full market data for: ${coin.name} (${coin.id})`);
      setIsFetchingMarketData(true);
      try {
        const currency = (preferences?.currency || "usd") as SupportedCurrency;
        // Fetch full market data for this coin
        const fullMarketData = await fetchCoinMarketData(coin.id, currency);
        
        if (fullMarketData) {
          console.log(`✅ Fetched full market data, saving to storage...`);
          // Use the full market data (with all fields populated)
          await saveSearchedCoin(fullMarketData);
          console.log(`✅✅ Saved searched coin with full market data: ${fullMarketData.name} (${fullMarketData.id})`);
          // Verify it was saved
          const { loadSearchedCoins } = await import('@/utils/searchedCoinsStorage');
          const allCoins = await loadSearchedCoins();
          console.log(`📦 Verification: ${Object.keys(allCoins).length} coins in storage, looking for: ${fullMarketData.id.toLowerCase()}`);
          console.log(`📋 Available IDs:`, Object.keys(allCoins));
          // Use the full data for selection
          onSelect(fullMarketData);
        } else {
          console.log(`⚠️ Full fetch returned null, saving partial data...`);
          // Fallback: save the partial data if full fetch fails
          await saveSearchedCoin(coin);
          console.log(`⚠️ Saved searched coin with partial data (full fetch failed): ${coin.name} (${coin.id})`);
          onSelect(coin);
        }
      } catch (error) {
        console.error('❌ Failed to fetch/save searched coin:', error);
        // Fallback: save partial data and continue
        try {
          await saveSearchedCoin(coin);
          console.log(`⚠️ Saved partial data as fallback: ${coin.name} (${coin.id})`);
        } catch (saveError) {
          console.error('❌ Failed to save partial coin data:', saveError);
        }
        onSelect(coin);
      } finally {
        setIsFetchingMarketData(false);
      }
    } else {
      console.log(`ℹ️ Coin is in main cache, not saving to searched coins storage`);
      // Coin is in main cache, select immediately
      onSelect(coin);
    }
    
    setSearchQuery("");
    setIsModalVisible(false);
    // Dismiss keyboard after closing modal
    setTimeout(() => {
      Keyboard.dismiss();
      inputRef.current?.blur();
    }, 0);
  };

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    // Reset API search state when query changes
    setApiSearchResults([]);
    setApiSearchError(null);
  };

  // Trigger API search when local results are empty and there's a query
  useEffect(() => {
    const query = searchQuery.trim();
    
    // Only search API if:
    // 1. There's a search query
    // 2. No local results found
    // 3. Not already searching
    // 4. Query is at least 2 characters (to avoid too many API calls)
    if (query.length >= 2 && filteredCoins.length === 0 && !isSearchingApi) {
      const searchTimeout = setTimeout(async () => {
        setIsSearchingApi(true);
        setApiSearchError(null);
        
        try {
          const results = await searchCoins(query);
          setApiSearchResults(results);
        } catch (error) {
          console.error('Failed to search coins via API:', error);
          setApiSearchError(error instanceof Error ? error.message : 'Failed to search coins');
        } finally {
          setIsSearchingApi(false);
        }
      }, 500); // Debounce: wait 500ms after user stops typing

      return () => clearTimeout(searchTimeout);
    } else if (query.length === 0) {
      // Clear API results when query is cleared
      setApiSearchResults([]);
      setApiSearchError(null);
    }
  }, [searchQuery, filteredCoins.length, isSearchingApi]);

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSearchQuery("");
    // Dismiss keyboard and blur input when closing modal
    Keyboard.dismiss();
    inputRef.current?.blur();
  };

  // Auto-focus input when modal opens (with delay for mobile)
  useEffect(() => {
    if (isModalVisible) {
      // Small delay to ensure modal is fully rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, Platform.OS === "ios" ? 300 : 100);
      return () => clearTimeout(timer);
    }
  }, [isModalVisible]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={[styles.addButton, { borderColor }]}
      >
        <IconSymbol name="plus.circle.fill" size={24} color={tintColor} />
        <ThemedText type="bodySemibold" style={{ marginLeft: Spacing.sm }}>
          Add Coin
        </ThemedText>
      </Pressable>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlayPressable}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={handleCloseModal}
          />
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ThemedView
              style={[styles.modalContent, { backgroundColor }]}
              onStartShouldSetResponder={() => true}
            >
              {/* Modal Header */}
              <ThemedView style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Search Coins
                </ThemedText>
                <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                  <IconSymbol name="xmark.circle.fill" size={28} color={tintColor} />
                </Pressable>
              </ThemedView>

              {/* Search Input in Modal */}
              <TextInput
                ref={inputRef}
                style={[
                  styles.modalInput,
                  { color: textColor, backgroundColor, borderColor },
                ]}
                placeholder={placeholder}
                placeholderTextColor={placeholderColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={false}
                returnKeyType="search"
              />

              {/* Exact Match Warning */}
              {exactMatchInList && (
                <ThemedView style={[styles.exactMatchWarning, { borderColor, backgroundColor: tintColor + "20" }]}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color={tintColor} />
                  <ThemedText type="small" style={{ marginLeft: Spacing.xs, flex: 1 }}>
                    <ThemedText type="small" style={{ fontWeight: "600" }}>
                      {exactMatchInList.name}
                    </ThemedText>
                    {" "}({exactMatchInList.symbol.toUpperCase()}) is already in your list
                  </ThemedText>
                </ThemedView>
              )}

              {/* Results List */}
              {allFilteredCoins.length > 0 ? (
                <ScrollView
                  style={styles.modalScrollView}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalScrollViewContent}
                >
                  {allFilteredCoins.map((item) => (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.modalItem,
                        { borderBottomColor: borderColor },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleSelect(item)}
                    >
                      {item.image && (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.coinImage}
                        />
                      )}
                      <View style={styles.coinInfo}>
                        <ThemedText type="bodySemibold">{item.name}</ThemedText>
                        <ThemedText type="small" variant="secondary">
                          {item.symbol.toUpperCase()}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : searchQuery ? (
                <ThemedView style={styles.emptyState}>
                  {isSearchingApi ? (
                    <>
                      <ActivityIndicator size="small" color={tintColor} />
                      <ThemedText type="body" variant="secondary" style={{ marginTop: Spacing.sm }}>
                        Searching CoinGecko...
                      </ThemedText>
                    </>
                  ) : apiSearchError ? (
                    <ThemedText type="body" variant="error">
                      {apiSearchError}
                    </ThemedText>
                  ) : (
                    <ThemedText type="body" variant="secondary">
                      No coins found.
                    </ThemedText>
                  )}
                </ThemedView>
              ) : (
                <ThemedView style={styles.emptyState}>
                  <ThemedText type="body" variant="secondary">
                    Start typing to search for coins...
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  modalOverlayPressable: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  modalContent: {
    borderBottomLeftRadius: Spacing.lg,
    borderBottomRightRadius: Spacing.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: Spacing.lg,
    maxHeight: "85%",
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 44,
    marginBottom: Spacing.md,
  },
  modalScrollView: {
    flex: 1,
    maxHeight: 400,
  },
  modalScrollViewContent: {
    paddingBottom: Spacing.md,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  coinImage: {
    width: 40,
    height: 40,
    marginRight: Spacing.md,
    borderRadius: 20,
  },
  coinInfo: {
    flex: 1,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  exactMatchWarning: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
});

