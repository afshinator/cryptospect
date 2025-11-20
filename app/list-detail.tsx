// app/list-detail.tsx

import { useQuery } from "@tanstack/react-query"; // Import useQuery for cache access
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CoinAutocomplete } from "@/components/CoinAutocomplete";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { CoinListItem } from "@/constants/coinLists";
import { SupportedCurrency } from "@/constants/currency";
import { CRYPTO_MARKET_QUERY_KEY } from "@/constants/misc"; // Import key for global cache
import { Spacing } from "@/constants/theme";
import {
  useAddCoinToList,
  useCoinLists,
  useRemoveCoinFromList,
  useUpdateCoinList,
} from "@/hooks/use-coin-lists";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";

// --- Custom Confirmation Modal Component ---
interface ConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  coinName: string;
}

const RemoveConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  coinName,
}) => {
  const cardColor = useThemeColor({}, "backgroundSecondary");
  const tintColor = useThemeColor({}, "tint");
  const dangerColor = useThemeColor({}, "error");

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      {/* Set a semi-transparent background color directly on the overlay for reliable dimming */}
      <ThemedView style={modalStyles.overlay}>
        <ThemedView style={[modalStyles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={modalStyles.title}>
            Remove Coin
          </ThemedText>
          <ThemedText style={modalStyles.message}>
            Are you sure you want to remove <ThemedText type="bodySemibold">{coinName}</ThemedText> from this list?
          </ThemedText>

          <ThemedView style={modalStyles.buttonRow}>
            <Pressable 
              onPress={onCancel} 
              style={[modalStyles.button, { borderColor: tintColor }]}
            >
              <ThemedText style={{ color: tintColor }}>Cancel</ThemedText>
            </Pressable>
            <Pressable 
              onPress={onConfirm} 
              style={[modalStyles.button, { backgroundColor: dangerColor, borderColor: dangerColor }]}
            >
              <ThemedText type="bodySemibold" style={{ color: '#fff' }}>Remove</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

// --- Main Screen Component ---
export default function ListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lists } = useCoinLists();
  const { data: preferences } = usePreferences();
  const addCoin = useAddCoinToList();
  const removeCoin = useRemoveCoinFromList();
  const updateList = useUpdateCoinList();
  
  // State for List Editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  
  // State for Custom Confirmation Modal
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
  const [coinToRemoveId, setCoinToRemoveId] = useState<string | null>(null);

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");

  const list = lists?.find((l) => l.id === id);

  // Access the global cached market data (the snapshot)
  const { data: globalMarketSnapshot } = useQuery<CoinGeckoMarketData[]>({
      queryKey: CRYPTO_MARKET_QUERY_KEY,
      // Query the cache directly as the data is managed by useAppInitialization
      enabled: true, 
      staleTime: Infinity, 
      gcTime: Infinity,
  });

  if (!list) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenContainer>
          <ThemedView style={styles.centerContainer}>
            <ActivityIndicator size="large" />
            <ThemedText style={{ marginTop: Spacing.md }}>Loading list...</ThemedText>
          </ThemedView>
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  const coinToRemove = list.coins.find(c => c.coinId === coinToRemoveId);

  const handleAddCoin = (coin: CoinGeckoMarketData) => {
    const currency = (preferences?.currency || "usd") as SupportedCurrency;
    
    // UPDATED: Only store minimal reference data and OMIT apiData
    const coinItem: Omit<CoinListItem, "addedAt" | "apiData"> = {
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      notes: "",
      vsCurrency: currency,
      // apiData is explicitly omitted to improve efficiency
    };

    // We cast to CoinListItem because the persistence layer will handle 'addedAt' and 
    // the structure of CoinListItem allows for apiData to be undefined/null on creation.
    addCoin.mutate(
      { listId: list.id, coin: coinItem as CoinListItem },
      {
        onError: (error) => {
          console.error("Failed to add coin:", error);
          // In-app message box would be preferred over Alert
        },
      }
    );
  };

  const handleRemoveCoin = useCallback((coinId: string) => {
    // Show custom confirmation modal instead of native Alert.alert
    setCoinToRemoveId(coinId);
    setIsConfirmingRemoval(true);
  }, []);

  const handleConfirmRemoval = () => {
    if (!coinToRemoveId) return;

    removeCoin.mutate(
      { listId: list.id, coinId: coinToRemoveId },
      {
        onSuccess: () => {
          setIsConfirmingRemoval(false);
          setCoinToRemoveId(null);
        },
        onError: (error) => {
          console.error("Failed to remove coin:", error);
          setIsConfirmingRemoval(false);
          setCoinToRemoveId(null);
          // In-app message box would be preferred over Alert
        },
      }
    );
  };

  const handleCancelRemoval = () => {
    setIsConfirmingRemoval(false);
    setCoinToRemoveId(null);
  };

  const handleSaveName = () => {
    if (!editedName.trim()) {
      // In-app message box would be preferred over Alert
      return;
    }

    const trimmedName = editedName.trim();
    const nameExists = lists?.some(
      (l) =>
        l.id !== list.id &&
        l.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      // In-app message box would be preferred over Alert
      return;
    }

    updateList.mutate(
      { id: list.id, updates: { name: trimmedName } },
      {
        onSuccess: () => {
          setIsEditingName(false);
          setEditedName("");
        },
        onError: (error) => {
          console.error("Failed to update name:", error);
          // In-app message box would be preferred over Alert
        },
      }
    );
  };

  const handleSaveNotes = () => {
    updateList.mutate(
      { id: list.id, updates: { notes: editedNotes } },
      {
        onSuccess: () => {
          setIsEditingNotes(false);
        },
        onError: (error) => {
          console.error("Failed to update notes:", error);
          // In-app message box would be preferred over Alert
        },
      }
    );
  };

  const handleCoinPress = (coinId: string) => {
    router.push(`/coin-detail?id=${coinId}`);
  };

  const excludeCoinIds = list.coins.map((c) => c.coinId);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenContainer>
        <ThemedView style={styles.container}>
          {/* List Name */}
          {isEditingName ? (
            <ThemedView style={styles.editContainer}>
              <TextInput
                style={[
                  styles.input,
                  { color: textColor, backgroundColor, borderColor },
                ]}
                placeholder="List name"
                placeholderTextColor={placeholderColor}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
              />
              <Pressable onPress={handleSaveName} style={styles.saveButton}>
                <ThemedText type="bodySemibold">Save</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsEditingName(false);
                  setEditedName("");
                }}
                style={styles.cancelButton}
              >
                <ThemedText type="body" variant="secondary">
                  Cancel
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <Pressable
              onPress={() => {
                setEditedName(list.name);
                setIsEditingName(true);
              }}
              style={styles.nameContainer}
            >
              <ThemedText type="large">{list.name}</ThemedText>
              <IconSymbol name="pencil" size={20} color={tintColor} />
            </Pressable>
          )}

          {/* Notes */}
          {isEditingNotes ? (
            <ThemedView style={styles.editContainer}>
              <TextInput
                style={[
                  styles.textArea,
                  { color: textColor, backgroundColor, borderColor },
                ]}
                placeholder="Notes (optional)"
                placeholderTextColor={placeholderColor}
                value={editedNotes}
                onChangeText={setEditedNotes}
                multiline
                numberOfLines={3}
              />
              <Pressable onPress={handleSaveNotes} style={styles.saveButton}>
                <ThemedText type="bodySemibold">Save</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsEditingNotes(false);
                  setEditedNotes("");
                }}
                style={styles.cancelButton}
              >
                <ThemedText type="body" variant="secondary">
                  Cancel
                </ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
              <Pressable
                onPress={() => {
                  setEditedNotes(list.notes);
                  setIsEditingNotes(true);
                }}
                style={styles.notesContainer}
              >
              <ThemedText type="small" variant="secondary">
                {list.notes || "Tap to add notes"}
              </ThemedText>
              <IconSymbol name="pencil" size={16} color={tintColor} />
            </Pressable>
          )}

          {/* Add Coin */}
          <ThemedView style={styles.addCoinContainer}>
            <CoinAutocomplete
              onSelect={handleAddCoin}
              excludeCoinIds={excludeCoinIds}
            />
          </ThemedView>

          {/* Coins List */}
          <ThemedView style={styles.coinsContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Coins ({list.coins.length})
            </ThemedText>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={Keyboard.dismiss}
            >
              {list.coins.length > 0 ? (
                list.coins.map((coin) => {
                  // FIX #4: Look up the market data from the global snapshot using the coinId
                  const marketData = globalMarketSnapshot?.find(
                    (m) => m.id === coin.coinId
                  );

                  // Use marketData for live details, otherwise fallback to the minimal data stored in the list item
                  const displayName = marketData?.name || coin.name;
                  const displaySymbol = marketData?.symbol || coin.symbol;
                  // Fallback to legacy coin.apiData.image if global snapshot isn't loaded (for existing items)
                  const displayImage = marketData?.image || coin.apiData?.image; 

                  return (
                    <Pressable
                      key={coin.coinId}
                      onPress={() => handleCoinPress(coin.coinId)}
                      style={[styles.coinItem, { borderColor }]}
                    >
                      {/* Use the retrieved image from the global snapshot or legacy apiData */}
                      {displayImage && (
                        <Image
                          source={{ uri: displayImage }}
                          style={styles.coinImage}
                        />
                      )}
                      <ThemedView style={styles.coinInfo}>
                        <ThemedText type="bodySemibold">{displayName}</ThemedText>
                        <ThemedText type="small" variant="secondary">
                          {displaySymbol.toUpperCase()}
                        </ThemedText>
                        {coin.notes && (
                          <ThemedText type="small" variant="secondary">
                            {coin.notes}
                          </ThemedText>
                        )}
                      </ThemedView>
                      
                      {/* Trash Button Container */}
                      <ThemedView style={styles.removeButtonContainer}>
                        <Pressable
                          onPress={(e) => {
                            console.log('Remove coin handler called - stopping propagation'); 
                            // Standard synthetic event propagation stop (still necessary!)
                            e.stopPropagation(); 
                            handleRemoveCoin(coin.coinId);
                          }}
                          style={styles.removeButton}
                          accessibilityRole="button"
                        >
                          <IconSymbol name="trash.fill" size={30} color={tintColor} />
                        </Pressable>
                      </ThemedView>
                    </Pressable>
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
        </ThemedView>
      </ScreenContainer>

      {/* RENDER CUSTOM MODAL AT THE TOP LEVEL */}
      <RemoveConfirmationModal
        visible={isConfirmingRemoval}
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
        coinName={coinToRemove?.name || "this coin"}
      />
    </SafeAreaView>
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
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
  },
  editContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
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
  addCoinContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  coinsContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
  },
  coinItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
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
  removeButtonContainer: {
    paddingLeft: Spacing.sm,
  },
  removeButton: {
    padding: Spacing.xs,
    zIndex: 10, 
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Manually apply a semi-transparent black background for reliable dimming
    backgroundColor: 'rgba(0, 0, 0, 0.85)', 
  },
  card: {
    width: '80%',
    maxWidth: 350,
    borderRadius: 12,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    marginBottom: Spacing.md,
  },
  message: {
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
});