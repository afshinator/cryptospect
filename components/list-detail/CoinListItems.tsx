import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import { StablecoinBadge } from "@/components/list-detail/StablecoinBadge";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ASYNC_STORAGE_OPERATION_DELAY_MS } from "@/constants/apiConfig";
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { CoinListItem } from "@/constants/coinLists";
import { isStablecoin } from "@/constants/coinTypes";
import { SupportedCurrency } from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useStartupCoinFetch } from "@/hooks/use-startup-coin-fetch";
import { useThemeColor } from "@/hooks/use-theme-color";
import { fetchOutlierCoinData } from "@/utils/fetchOutlierCoinData";
import { logger } from "@/utils/logger";
import { loadSavedOutlierCoins, SavedOutlierCoinWithTimestamp, saveSavedOutlierCoin } from "@/utils/searchedCoinsStorage";

// --- Constants ---
const STABLECOIN_BADGE_OPACITY = 0.45; // Transparency for mobile badge to respect text underneath
const STABLECOIN_BADGE_ROTATION = 0; // Rotation in degrees (clockwise) for mobile badge
const STABLECOIN_BADGE_TOP_OFFSET = 0; // Top offset for mobile badge positioning
const STABLECOIN_BADGE_LEFT_OFFSET = 0; // Left offset for mobile badge positioning

interface CoinListItemsProps {
  coins: CoinListItem[];
  globalMarketSnapshot: CoinGeckoMarketData[] | null | undefined;
  editingCoinId: string | null;
  editedCoinNotes: string;
  onCoinPress: (coinId: string) => void;
  onStartEditingCoinNotes: (coinId: string, currentNotes: string) => void;
  onSaveCoinNotes: () => void;
  onCancelEditingCoinNotes: () => void;
  onRemoveCoin: (coinId: string) => void;
  isSavingNotesPending: boolean;
  onNotesChange: (notes: string) => void;
  isCompactView: boolean;
  onCompactViewChange: (value: boolean) => void;
  currency?: SupportedCurrency; // Currency for fetching market data
}

export function CoinListItems({
  coins,
  globalMarketSnapshot,
  editingCoinId,
  editedCoinNotes,
  onCoinPress,
  onStartEditingCoinNotes,
  onSaveCoinNotes,
  onCancelEditingCoinNotes,
  onRemoveCoin,
  isSavingNotesPending,
  onNotesChange,
  isCompactView,
  onCompactViewChange,
  currency = "usd",
}: CoinListItemsProps) {
  const [savedOutlierCoins, setSavedOutlierCoins] = useState<{ [coinId: string]: SavedOutlierCoinWithTimestamp }>({});
  // Legacy alias for backward compatibility
  const searchedCoins = savedOutlierCoins;
  const setSearchedCoins = setSavedOutlierCoins;
  const [fetchingCoins, setFetchingCoins] = useState<Set<string>>(new Set());
  const fetchedCoinsRef = useRef<Set<string>>(new Set()); // Track coins we've already attempted to fetch
  const startupFetchState = useStartupCoinFetch(); // Track startup fetch state

  // Helper function to fetch full market data for a coin
  const fetchDataForCoin = React.useCallback((coinId: string, savedOutlierCoin: SavedOutlierCoinWithTimestamp) => {
    // Skip if already fetching or fetched (ref prevents infinite loop)
    if (fetchedCoinsRef.current.has(coinId)) {
      logger(`⏭️ Skipping fetch for ${coinId} - already fetched or fetching`, 'log', 'debug');
      return;
    }

    // Mark as being fetched (using ref to prevent duplicate fetches)
    fetchedCoinsRef.current.add(coinId);
    setFetchingCoins(prev => new Set(prev).add(coinId));
    logger(`🚀 [CoinListItems] Starting fetch for ${coinId} (${savedOutlierCoin.name})...`, 'log', 'info');
    logger(`   └─ Strategy: Try BACKEND first, then CoinGecko if backend fails`, 'log', 'info');
    
    // Use shared utility function for backend-first fetch strategy
    fetchOutlierCoinData(savedOutlierCoin.id, currency, 'CoinListItems')
      .then((result) => {
        const { data: fullData, dataSource } = result;
        
        if (fullData) {
          logger(`📥 [CoinListItems] Final data for ${fullData.name} (${fullData.id}):`, 'log', 'info');
          logger(`   └─ Data source: ${dataSource.toUpperCase()}`, 'log', 'info');
          logger(`   └─ Price change: ${fullData.price_change_percentage_24h ?? 'null'}`, 'log', 'info');
          
          // Always update state with fetched data (saveSavedOutlierCoin will handle intelligent merging)
          const coinWithTimestamp: SavedOutlierCoinWithTimestamp = {
            ...fullData,
            _lastUpdated: Date.now(), // Always update timestamp when we get new data
          };
          
          // Update the saved outlier coins state with full data
          setSavedOutlierCoins(prev => {
            const updated = {
              ...prev,
              [coinId]: coinWithTimestamp,
            };
            logger(`📝 [CoinListItems] Updating savedOutlierCoins state for ${coinId}:`, 'log', 'info');
            // logger(`   └─ Name: ${fullData.name}`, 'log', 'info');
            // logger(`   └─ Data source: ${dataSource.toUpperCase()}`, 'log', 'info');
            // logger(`   └─ Price change: ${fullData.price_change_percentage_24h}`, 'log', 'info');
            // logger(`   └─ Timestamp: ${new Date(coinWithTimestamp._lastUpdated!).toISOString()}`, 'log', 'info');
            return updated;
          });
            
          // Also save to storage for future use (saveSavedOutlierCoin will merge intelligently and preserve non-null data)
          saveSavedOutlierCoin(fullData).then(() => {
            logger(`💾 [CoinListItems] Saved/merged full data to storage for ${fullData.name}`, 'log', 'info');
            logger(`   └─ Data source: ${dataSource.toUpperCase()}`, 'log', 'info');
          }).catch((saveError) => {
            logger(`❌ [CoinListItems] Error saving to storage:`, 'error', undefined, saveError);
          });
        } else {
          logger(`⚠️ Fetch returned no data (null/undefined) for ${savedOutlierCoin.id}`, 'warn');
          // Keep in ref to prevent infinite retries - only remove if we want to allow retry after some time
          // For now, keep it in ref to prevent infinite loop
        }
      })
      .catch((error) => {
        // Don't log as error if it's a rate limit or network/CORS issue - these are expected
        const errorMessage = error?.message || '';
        const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429');
        const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error');
        
        if (isRateLimit) {
          logger(`⚠️🚦 [CoinListItems] Rate limit hit for ${savedOutlierCoin.id}. Will retry later.`, 'warn');
        } else if (isNetworkError) {
          logger(`⚠️ [CoinListItems] Network/CORS issue for ${savedOutlierCoin.id} (expected):`, 'warn');
          logger(`   └─ This is informational, not an error`, 'warn');
          logger(`   └─ Will retry later when network is available`, 'warn');
        } else {
          // Real error - log it
          logger(`❌ [CoinListItems] Failed to fetch market data for ${savedOutlierCoin.id}:`, 'error');
          logger(`   └─ Error: ${errorMessage}`, 'error');
        }
        // Remove from ref so we can retry later if needed (after rate limit expires or network recovers)
        fetchedCoinsRef.current.delete(coinId);
      })
      .finally(() => {
        setFetchingCoins(prev => {
          const next = new Set(prev);
          next.delete(coinId);
          return next;
        });
        logger(`🏁 Fetch process finished for ${coinId}`, 'log', 'debug');
      });
  }, [currency]); // Removed savedOutlierCoins from deps - we read from state directly inside the function

  // Load searched coins and check for coins needing full market data
  useEffect(() => {
    const reloadAndCheck = async () => {
      logger(`🔄 [CoinListItems] useEffect triggered - checking coins...`, 'log', 'info');
      logger(`   └─ coins.length: ${coins.length}`, 'log', 'info');
      logger(`   └─ globalMarketSnapshot: ${globalMarketSnapshot ? `${globalMarketSnapshot.length} coins` : 'null/undefined'}`, 'log', 'info');
      
      // Small delay to ensure any async saves have completed
      await new Promise(resolve => setTimeout(resolve, ASYNC_STORAGE_OPERATION_DELAY_MS));
      const loaded = await loadSavedOutlierCoins();
      logger(`📦 Loaded SavedOutlierCoins: ${Object.keys(loaded).length} coins`, 'log', 'info');
      
      // Log each coin's price change status with timestamp
      Object.entries(loaded).forEach(([coinId, coinData]) => {
        const lastUpdated = coinData._lastUpdated ? new Date(coinData._lastUpdated).toISOString() : '⚠️ NO TIMESTAMP';
        logger(`📦 [CoinListItems] SearchedCoin [${coinId}]:`, 'log', 'debug');
        // logger(`   └─ Name: ${coinData.name}`, 'log', 'debug');
        // logger(`   └─ Has price change: ${coinData.price_change_percentage_24h !== null && coinData.price_change_percentage_24h !== undefined}`, 'log', 'debug');
        // logger(`   └─ Price change: ${coinData.price_change_percentage_24h ?? 'null'}`, 'log', 'debug');
        // logger(`   └─ Last updated: ${lastUpdated}`, 'log', 'debug');
        
        // Warn if timestamp is missing
        if (!coinData._lastUpdated) {
          logger(`   └─ ⚠️ WARNING: Missing timestamp for ${coinId}!`, 'warn');
        }
      });
      
      setSavedOutlierCoins(loaded);

      // After loading, check if any coins need full market data
      if (!globalMarketSnapshot) {
        logger(`⚠️ [CoinListItems] globalMarketSnapshot is null/undefined, skipping coin check`, 'log', 'info');
        return;
      }
      
      if (coins.length === 0) {
        logger(`⚠️ [CoinListItems] No coins in list, skipping check`, 'log', 'info');
        return;
      }
      
      logger(`🔍 [CoinListItems] Checking ${coins.length} coins against market snapshot...`, 'log', 'info');

      coins.forEach((coin) => {
        const normalizedCoinId = coin.coinId.toLowerCase();
        const marketData = globalMarketSnapshot.find(
          (m) => m.id.toLowerCase() === normalizedCoinId
        );
        
        // logger(`🔍 [CoinListItems] Checking coin: ${coin.coinId} (normalized: ${normalizedCoinId})`, 'log', 'info');
        // logger(`   └─ In market snapshot: ${!!marketData}`, 'log', 'info');
        
        // If not in main cache, check loaded searched coins
        if (!marketData) {
          const searchedCoin = loaded[normalizedCoinId];
          logger(`   └─ In SavedOutlierCoins: ${!!searchedCoin}`, 'log', 'info');
          
          if (searchedCoin) {
            // Coin exists in SavedOutlierCoins
            logger(`   └─ Has price change data: ${searchedCoin.price_change_percentage_24h !== null && searchedCoin.price_change_percentage_24h !== undefined}`, 'log', 'info');
            // If missing price data, fetch it (in background, don't block display)
            // BUT: Only fetch if we haven't already tried (check fetchedCoinsRef)
            if (searchedCoin.price_change_percentage_24h === null && !fetchedCoinsRef.current.has(normalizedCoinId)) {
              logger(`🔄 Coin ${coin.coinId} needs full data, fetching from BACKEND (then CoinGecko if needed)...`, 'log', 'info');
              fetchDataForCoin(normalizedCoinId, searchedCoin);
            } else if (searchedCoin.price_change_percentage_24h === null) {
              logger(`⏭️ Coin ${coin.coinId} needs data but fetch already attempted, skipping`, 'log', 'debug');
            } else {
              logger(`✅ Coin ${coin.coinId} already has price data in SavedOutlierCoins: ${searchedCoin.price_change_percentage_24h}`, 'log', 'info');
              logger(`   └─ Data source: Previously fetched (check storage timestamp for original source)`, 'log', 'info');
            }
          } else {
            // Coin is NOT in main cache AND NOT in SavedOutlierCoins
            // This could happen if SavedOutlierCoins was deleted or coin was never fetched
            // Create a minimal coin entry and fetch full data
            // BUT: Only fetch if we haven't already tried (check fetchedCoinsRef)
            if (!fetchedCoinsRef.current.has(normalizedCoinId)) {
              logger(`🔄 Coin ${coin.coinId} not found in main cache or SavedOutlierCoins, fetching from BACKEND (then CoinGecko if needed)...`, 'log', 'info');
              const minimalCoin: SavedOutlierCoinWithTimestamp = {
                id: normalizedCoinId,
                symbol: coin.symbol || '',
                name: coin.name || coin.coinId,
                image: coin.apiData?.image || '',
                current_price: null,
                market_cap: null,
                market_cap_rank: null,
                fully_diluted_valuation: null,
                total_volume: null,
                high_24h: null,
                low_24h: null,
                price_change_24h: null,
                price_change_percentage_24h: null,
                market_cap_change_24h: null,
                market_cap_change_percentage_24h: null,
                circulating_supply: null,
                total_supply: null,
                max_supply: null,
                ath: null,
                ath_change_percentage: null,
                ath_date: null,
                atl: null,
                atl_change_percentage: null,
                atl_date: null,
                roi: null,
                last_updated: null,
              };
              fetchDataForCoin(normalizedCoinId, minimalCoin);
            } else {
              logger(`⏭️ Coin ${coin.coinId} fetch already attempted, skipping`, 'log', 'debug');
            }
          }
        } else {
          // logger(`✅ Coin ${coin.coinId} found in market snapshot, no fetch needed`, 'log', 'info');
        }
      });
      
      logger(`✅ [CoinListItems] Finished checking all coins`, 'log', 'info');
    };
    
    reloadAndCheck().catch((error) => {
      logger(`❌ [CoinListItems] Error in reloadAndCheck:`, 'error', undefined, error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins.length, globalMarketSnapshot, fetchDataForCoin]); // Reload when coins are added/removed or snapshot changes
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");
  const successColor = useThemeColor({}, "success");
  const errorColor = useThemeColor({}, "error");
  const backgroundSecondaryColor = useThemeColor({}, "backgroundSecondary");

  // Helper function to format percentage change
  const formatPercentageChange = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "N/A";
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Helper function to get color for price change
  const getPriceChangeColor = (value: number | null | undefined): string | undefined => {
    if (value === null || value === undefined) return undefined;
    return value >= 0 ? successColor : errorColor;
  };

  return (
    <ThemedView style={styles.coinsContainer}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Coins ({coins.length})
        </ThemedText>
        <View style={styles.compactViewToggle}>
          <ThemedText type="small" variant="secondary" style={styles.compactViewLabel}>
            Compact
          </ThemedText>
          <Switch
            value={isCompactView}
            onValueChange={onCompactViewChange}
            trackColor={{ false: borderColor, true: tintColor }}
            thumbColor="#ffffff"
          />
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {coins.length > 0 ? (
          coins.map((coin) => {
            // Look up the market data from the global snapshot using the coinId
            // Normalize both IDs to lowercase for comparison
            const normalizedCoinId = coin.coinId.toLowerCase();
            const marketData = globalMarketSnapshot?.find(
              (m) => m.id.toLowerCase() === normalizedCoinId
            );

            // Check searched coins storage if not in main cache
            const searchedCoin = !marketData ? searchedCoins[normalizedCoinId] : null;

            // Use marketData for live details, otherwise fallback to searched coin, then minimal data stored in the list item
            const displayName = marketData?.name || searchedCoin?.name || coin.name;
            const displaySymbol = marketData?.symbol || searchedCoin?.symbol || coin.symbol;
            // Fallback order: marketData -> searchedCoin -> legacy coin.apiData.image
            const displayImage = marketData?.image || searchedCoin?.image || coin.apiData?.image;
            // Get 24h price change from marketData or searchedCoin
            // IMPORTANT: Use searchedCoin data immediately if available, don't wait for fetches
            const priceChange24h = marketData?.price_change_percentage_24h ?? searchedCoin?.price_change_percentage_24h;
            
            // Check if coin is waiting for startup fetch
            const isWaitingForStartupFetch = 
              !marketData && 
              !searchedCoin && 
              startupFetchState.isFetching;

            const isEditingThisCoin = editingCoinId === coin.coinId;

            return (
              <ThemedView 
                key={coin.coinId} 
                style={[
                  styles.coinItem, 
                  { borderColor },
                  isCompactView && styles.coinItemCompact
                ]}
              >
                {isEditingThisCoin ? (
                  // Editing mode for coin notes
                  <ThemedView style={styles.coinNotesEditContainer}>
                    <ThemedView style={styles.coinNotesHeader}>
                      <ThemedText type="bodySemibold">{displayName}</ThemedText>
                      <ThemedText type="small" variant="secondary">
                        {displaySymbol.toUpperCase()}
                      </ThemedText>
                    </ThemedView>
                    <TextInput
                      style={[
                        styles.textArea,
                        { color: textColor, backgroundColor, borderColor },
                      ]}
                      placeholder="Add notes for this coin..."
                      placeholderTextColor={placeholderColor}
                      value={editedCoinNotes}
                      onChangeText={onNotesChange}
                      multiline
                      autoFocus
                    />
                    <ThemedView style={styles.coinNotesButtonRow}>
                      <Pressable
                        onPress={onSaveCoinNotes}
                        style={styles.saveButton}
                        disabled={isSavingNotesPending}
                      >
                        <ThemedText type="bodySemibold">Save</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={onCancelEditingCoinNotes}
                        style={styles.cancelButton}
                      >
                        <ThemedText type="body" variant="secondary">
                          Cancel
                        </ThemedText>
                      </Pressable>
                    </ThemedView>
                  </ThemedView>
                ) : (
                  // Display mode
                  <Pressable
                    onPress={() => onCoinPress(coin.coinId)}
                    style={[
                      styles.coinItemPressable,
                      isCompactView && styles.coinItemPressableCompact
                    ]}
                  >
                    {/* Mobile: Stablecoin Badge - absolutely positioned relative to list item container */}
                    {Platform.OS !== 'web' && isStablecoin(displaySymbol) && (
                      <View style={styles.stablecoinBadgeContainerMobile}>
                        <StablecoinBadge 
                          backgroundColor={tintColor} 
                          opacity={STABLECOIN_BADGE_OPACITY}
                          rotation={STABLECOIN_BADGE_ROTATION}
                        />
                      </View>
                    )}
                    
                    {/* Use the retrieved image from the global snapshot or legacy apiData */}
                    {displayImage ? (
                      <Image
                        source={{ uri: displayImage }}
                        style={styles.coinImage}
                      />
                    ) : null}
                    {Platform.OS === 'web' ? (
                      // Web: Badge in its own column, flushed left, vertically centered
                      <View style={styles.coinInfoContainer}>
                        <ThemedView style={styles.coinInfo}>
                          <View style={styles.coinNameRow}>
                            <ThemedText type="bodySemibold">{displayName}</ThemedText>
                            {isWaitingForStartupFetch ? (
                              <ThemedText 
                                type="small" 
                                variant="secondary"
                                style={[
                                  { marginLeft: Spacing.sm },
                                  Platform.OS === 'web' && styles.percentageChangeWeb
                                ]}
                              >
                                Waiting on API...
                              </ThemedText>
                            ) : priceChange24h !== null && priceChange24h !== undefined ? (
                              <ThemedText 
                                type="bodySemibold" 
                                style={[
                                  { color: getPriceChangeColor(priceChange24h), marginLeft: Spacing.sm },
                                  Platform.OS === 'web' && styles.percentageChangeWeb
                                ]}
                              >
                                {formatPercentageChange(priceChange24h)}
                              </ThemedText>
                            ) : null}
                          </View>
                          <ThemedText type="small" variant="secondary">
                            {displaySymbol.toUpperCase()}
                          </ThemedText>
                          {coin.notes && coin.notes.trim() ? (
                            <ThemedText type="small" variant="secondary" style={styles.coinNotesText}>
                              {coin.notes}
                            </ThemedText>
                          ) : null}
                        </ThemedView>
                        
                        {/* Stablecoin Badge - in its own column, flushed left */}
                        <View style={styles.stablecoinColumn}>
                          {isStablecoin(displaySymbol) && (
                            <StablecoinBadge backgroundColor={tintColor} />
                          )}
                        </View>
                      </View>
                    ) : (
                      // Mobile: Coin info without badge (badge is positioned relative to container)
                      <ThemedView style={styles.coinInfo}>
                        <View style={styles.coinNameRow}>
                          <ThemedText type="bodySemibold">{displayName}</ThemedText>
                          {isWaitingForStartupFetch ? (
                            <ThemedText 
                              type="small" 
                              variant="secondary"
                              style={{ marginLeft: Spacing.sm }}
                            >
                              Waiting on API...
                            </ThemedText>
                          ) : priceChange24h !== null && priceChange24h !== undefined ? (
                            <ThemedText 
                              type="bodySemibold" 
                              style={{ color: getPriceChangeColor(priceChange24h), marginLeft: Spacing.sm }}
                            >
                              {formatPercentageChange(priceChange24h)}
                            </ThemedText>
                          ) : null}
                        </View>
                        <ThemedText type="small" variant="secondary">
                          {displaySymbol.toUpperCase()}
                        </ThemedText>
                        {coin.notes && coin.notes.trim() ? (
                          <ThemedText type="small" variant="secondary" style={styles.coinNotesText}>
                            {coin.notes}
                          </ThemedText>
                        ) : null}
                      </ThemedView>
                    )}
                    
                    {/* Action Buttons Container */}
                    <ThemedView style={styles.coinActionsContainer}>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          onStartEditingCoinNotes(coin.coinId, coin.notes || "");
                        }}
                        style={styles.coinActionButton}
                        accessibilityRole="button"
                      >
                        <IconSymbol 
                          name="pencil" 
                          size={24} 
                          color={tintColor} 
                        />
                      </Pressable>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation(); 
                          onRemoveCoin(coin.coinId);
                        }}
                        style={styles.removeButton}
                        accessibilityRole="button"
                      >
                        <IconSymbol name="trash.fill" size={30} color={tintColor} />
                      </Pressable>
                    </ThemedView>
                  </Pressable>
                )}
              </ThemedView>
            );
          })
        ) : (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText type="body" variant="secondary">
              No coins in this list yet. Add coins using the search above.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  coinsContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  compactViewToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  compactViewLabel: {
    marginRight: Spacing.xs,
  },
  coinItem: {
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
  },
  coinItemCompact: {
    marginBottom: Spacing.xs,
  },
  coinItemPressable: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    ...Platform.select({
      default: {
        position: "relative", // Mobile: Enable absolute positioning for badge
      },
      web: {},
    }),
  },
  coinItemPressableCompact: {
    paddingVertical: Spacing.xs,
    ...Platform.select({
      default: {
        paddingHorizontal: Spacing.sm, // Mobile: reduce horizontal padding in compact mode
      },
      web: {},
    }),
  },
  percentageChangeWeb: {
    marginLeft: 20, // Web: move percentage change 20px to the right
  },
  coinNotesEditContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  coinNotesHeader: {
    marginBottom: Spacing.xs,
  },
  coinNotesText: {
    marginTop: Spacing.xs,
  },
  coinNotesButtonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  coinActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  coinActionButton: {
    padding: Spacing.xs,
  },
  coinImage: {
    width: 40,
    height: 40,
    marginRight: Spacing.md,
    borderRadius: 20,
  },
  // Web: Badge in column layout
  coinInfoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  coinInfo: {
    flex: 1,
  },
  coinNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  stablecoinColumn: {
    width: 100,
    justifyContent: "center",
    alignItems: "flex-start",
    marginLeft: Spacing.md,
  },
  
  // Mobile: Badge absolutely positioned at upper left corner of list item container
  stablecoinBadgeContainerMobile: {
    position: "absolute",
    top: STABLECOIN_BADGE_TOP_OFFSET,
    left: STABLECOIN_BADGE_LEFT_OFFSET,
    zIndex: 1,
  },
  removeButton: {
    padding: Spacing.xs,
    zIndex: 10, 
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#0a7ea4",
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    padding: Spacing.sm,
    alignItems: "center",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
});

