import React, { useEffect, useState } from "react";
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
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { CoinListItem } from "@/constants/coinLists";
import { isStablecoin } from "@/constants/coinTypes";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { loadSearchedCoins } from "@/utils/searchedCoinsStorage";

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
}: CoinListItemsProps) {
  const [searchedCoins, setSearchedCoins] = useState<{ [coinId: string]: CoinGeckoMarketData }>({});

  // Load searched coins on mount and whenever coins change (new coin added)
  useEffect(() => {
    const reloadSearchedCoins = async () => {
      // Small delay to ensure any async saves have completed
      await new Promise(resolve => setTimeout(resolve, 100));
      const loaded = await loadSearchedCoins();
      setSearchedCoins(loaded);
    };
    
    reloadSearchedCoins().catch(console.error);
  }, [coins.length]); // Reload when coins are added/removed
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
            const marketData = globalMarketSnapshot?.find(
              (m) => m.id === coin.coinId
            );

            // Check searched coins storage if not in main cache
            const searchedCoin = !marketData ? searchedCoins[coin.coinId] : null;

            // Use marketData for live details, otherwise fallback to searched coin, then minimal data stored in the list item
            const displayName = marketData?.name || searchedCoin?.name || coin.name;
            const displaySymbol = marketData?.symbol || searchedCoin?.symbol || coin.symbol;
            // Fallback order: marketData -> searchedCoin -> legacy coin.apiData.image
            const displayImage = marketData?.image || searchedCoin?.image || coin.apiData?.image;
            const priceChange24h = marketData?.price_change_percentage_24h;

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
                            {priceChange24h !== null && priceChange24h !== undefined && (
                              <ThemedText 
                                type="bodySemibold" 
                                style={[
                                  { color: getPriceChangeColor(priceChange24h), marginLeft: Spacing.sm },
                                  Platform.OS === 'web' && styles.percentageChangeWeb
                                ]}
                              >
                                {formatPercentageChange(priceChange24h)}
                              </ThemedText>
                            )}
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
                          {priceChange24h !== null && priceChange24h !== undefined && (
                            <ThemedText 
                              type="bodySemibold" 
                              style={{ color: getPriceChangeColor(priceChange24h), marginLeft: Spacing.sm }}
                            >
                              {formatPercentageChange(priceChange24h)}
                            </ThemedText>
                          )}
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
                          console.log('Remove coin handler called - stopping propagation'); 
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

