// app/list-detail.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CoinAutocomplete } from "@/components/CoinAutocomplete";
import { CoinFilters } from "@/components/CoinFilters";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FilteredCoinsResults } from "@/components/FilteredCoinsResults";
import { CoinListItems } from "@/components/list-detail/CoinListItems";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { CoinListItem } from "@/constants/coinLists";
import { SupportedCurrency } from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import {
  useAddCoinToList,
  useCoinLists,
  useRemoveCoinFromList,
  useUpdateCoinList,
  useUpdateCoinNotes,
} from "@/hooks/use-coin-lists";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";
import { applyFilters, createMarketDataMap } from "@/utils/coinFilters";

// --- Main Screen Component ---
export default function ListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lists } = useCoinLists();
  const { data: preferences } = usePreferences();
  const addCoin = useAddCoinToList();
  const removeCoin = useRemoveCoinFromList();
  const updateList = useUpdateCoinList();
  const updateCoinNotes = useUpdateCoinNotes();
  
  // State for List Editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  
  // State for Coin Notes Editing
  const [editingCoinId, setEditingCoinId] = useState<string | null>(null);
  const [editedCoinNotes, setEditedCoinNotes] = useState("");
  
  // State for Custom Confirmation Modal
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
  const [coinToRemoveId, setCoinToRemoveId] = useState<string | null>(null);
  
  // State for Filters
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);
  const [andFilterIds, setAndFilterIds] = useState<string[]>([]);
  
  // State for Compact View
  const [isCompactView, setIsCompactView] = useState(false);

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");

  const list = lists?.find((l) => l.id === id);

  // Access the global cached market data (the snapshot)
  const { cryptoMarket } = useAppInitialization();
  const globalMarketSnapshot = cryptoMarket?.data;

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

  const coinToRemove = list.coins.find(c => c.coinId.toLowerCase() === coinToRemoveId?.toLowerCase());

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

  const handleCoinPress = useCallback((coinId: string) => {
    router.push(`/coin-detail?id=${coinId}`);
  }, [router]);

  const handleStartEditingCoinNotes = useCallback((coinId: string, currentNotes: string) => {
    setEditingCoinId(coinId);
    setEditedCoinNotes(currentNotes || "");
  }, []);

  const handleSaveCoinNotes = useCallback(() => {
    if (!editingCoinId || !list) return;
    
    updateCoinNotes.mutate(
      {
        listId: list.id,
        coinId: editingCoinId,
        notes: editedCoinNotes,
      },
      {
        onSuccess: () => {
          setEditingCoinId(null);
          setEditedCoinNotes("");
        },
        onError: (error) => {
          console.error("Failed to update coin notes:", error);
        },
      }
    );
  }, [editingCoinId, editedCoinNotes, list, updateCoinNotes]);

  const handleCancelEditingCoinNotes = useCallback(() => {
    setEditingCoinId(null);
    setEditedCoinNotes("");
  }, []);

  const excludeCoinIds = list.coins.map((c) => c.coinId);

  // Filter coins in this list only
  const filteredMatches = useMemo(() => {
    if (!globalMarketSnapshot || activeFilterIds.length === 0) {
      return {};
    }

    // Create a single-item list array for this list only
    const singleListArray = [list];
    
    // Create a map for efficient market data lookup
    const marketDataMap = createMarketDataMap(globalMarketSnapshot);

    // Use the applyFilters function with the new logic
    return applyFilters(singleListArray, marketDataMap, activeFilterIds, andFilterIds);
  }, [list, globalMarketSnapshot, activeFilterIds, andFilterIds]);

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
          <CoinListItems
            coins={list.coins}
            globalMarketSnapshot={globalMarketSnapshot}
            editingCoinId={editingCoinId}
            editedCoinNotes={editedCoinNotes}
            onCoinPress={handleCoinPress}
            onStartEditingCoinNotes={handleStartEditingCoinNotes}
            onSaveCoinNotes={handleSaveCoinNotes}
            onCancelEditingCoinNotes={handleCancelEditingCoinNotes}
            onRemoveCoin={handleRemoveCoin}
            isSavingNotesPending={updateCoinNotes.isPending}
            onNotesChange={setEditedCoinNotes}
            isCompactView={isCompactView}
            onCompactViewChange={setIsCompactView}
            currency={(preferences?.currency || "usd") as SupportedCurrency}
          />

          {/* Filters and Analysis Section */}
          <ThemedView style={styles.filtersContainer}>
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
            defaultOpen={true}
            isLoading={!cryptoMarket?.data}
          />
            )}
          </ThemedView>
        </ThemedView>
      </ScreenContainer>

      {/* RENDER CUSTOM MODAL AT THE TOP LEVEL */}
      <ConfirmationModal
        visible={isConfirmingRemoval}
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
        title="Remove Coin"
        message={`Are you sure you want to remove ${coinToRemove?.name || "this coin"} from this list?`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmButtonStyle="danger"
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
  filtersContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
});