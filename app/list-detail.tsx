// app/list-detail.tsx

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { CoinAutocomplete } from "@/components/CoinAutocomplete";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CoinListItem } from "@/constants/coinLists";
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { SupportedCurrency } from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  useCoinLists,
  useAddCoinToList,
  useRemoveCoinFromList,
  useUpdateCoinList,
} from "@/hooks/use-coin-lists";

export default function ListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: lists } = useCoinLists();
  const { data: preferences } = usePreferences();
  const addCoin = useAddCoinToList();
  const removeCoin = useRemoveCoinFromList();
  const updateList = useUpdateCoinList();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");

  const list = lists?.find((l) => l.id === id);

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

  const handleAddCoin = (coin: CoinGeckoMarketData) => {
    const currency = (preferences?.currency || "usd") as SupportedCurrency;
    const coinItem: Omit<CoinListItem, "addedAt"> = {
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      notes: "",
      vsCurrency: currency,
      apiData: coin,
    };

    addCoin.mutate(
      { listId: list.id, coin: coinItem },
      {
        onError: (error) => {
          Alert.alert("Error", `Failed to add coin: ${error.message}`);
        },
      }
    );
  };

  const handleRemoveCoin = (coinId: string) => {
    Alert.alert(
      "Remove Coin",
      "Are you sure you want to remove this coin from the list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeCoin.mutate(
              { listId: list.id, coinId },
              {
                onError: (error) => {
                  Alert.alert("Error", `Failed to remove coin: ${error.message}`);
                },
              }
            );
          },
        },
      ]
    );
  };

  const handleSaveName = () => {
    if (!editedName.trim()) {
      Alert.alert("Error", "List name cannot be empty");
      return;
    }

    const trimmedName = editedName.trim();
    const nameExists = lists?.some(
      (l) =>
        l.id !== list.id &&
        l.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      Alert.alert("Error", "A list with this name already exists");
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
          Alert.alert("Error", `Failed to update name: ${error.message}`);
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
          Alert.alert("Error", `Failed to update notes: ${error.message}`);
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
                list.coins.map((coin) => (
                  <Pressable
                    key={coin.coinId}
                    onPress={() => handleCoinPress(coin.coinId)}
                    style={[styles.coinItem, { borderColor }]}
                  >
                    {coin.apiData?.image && (
                      <Image
                        source={{ uri: coin.apiData.image }}
                        style={styles.coinImage}
                      />
                    )}
                    <ThemedView style={styles.coinInfo}>
                      <ThemedText type="bodySemibold">{coin.name}</ThemedText>
                      <ThemedText type="small" variant="secondary">
                        {coin.symbol.toUpperCase()}
                      </ThemedText>
                      {coin.notes && (
                        <ThemedText type="small" variant="secondary">
                          {coin.notes}
                        </ThemedText>
                      )}
                    </ThemedView>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemoveCoin(coin.coinId);
                      }}
                      style={styles.removeButton}
                    >
                      <IconSymbol name="trash.fill" size={30} color={tintColor} />
                    </Pressable>
                  </Pressable>
                ))
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
  removeButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
});

