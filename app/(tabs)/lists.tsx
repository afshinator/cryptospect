// app/(tabs)/lists.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Spacing } from "@/constants/theme";
import {
  useCoinLists,
  useCreateCoinList,
  useDeleteCoinList,
} from "@/hooks/use-coin-lists";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function ListsScreen() {
  const router = useRouter();
  const { data: lists, isLoading } = useCoinLists();
  const createList = useCreateCoinList();
  const deleteList = useDeleteCoinList();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");

  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");

  const handleCreate = () => {
    if (!newListName.trim()) {
      Alert.alert("Error", "Please enter a list name");
      return;
    }

    const trimmedName = newListName.trim();
    const nameExists = lists?.some(
      (list) => list.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      Alert.alert("Error", "A list with this name already exists");
      return;
    }

    createList.mutate(
      {
        name: trimmedName,
        coins: [],
        notes: "",
      },
      {
        onSuccess: () => {
          setNewListName("");
          setIsCreating(false);
        },
        onError: (error) => {
          Alert.alert("Error", `Failed to create list: ${error.message}`);
        },
      }
    );
  };

  const handleDelete = (listId: string, listName: string) => {
    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${listName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteList.mutate(listId, {
              onError: (error) => {
                Alert.alert("Error", `Failed to delete list: ${error.message}`);
              },
            });
          },
        },
      ]
    );
  };

  const handleListPress = (listId: string) => {
    router.push(`/list-detail?id=${listId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenContainer>
          <ThemedView style={styles.centerContainer}>
            <ActivityIndicator size="large" />
            <ThemedText style={{ marginTop: Spacing.md }}>
              Loading lists...
            </ThemedText>
          </ThemedView>
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenContainer>
        <ThemedView style={styles.container}>
          <ThemedText type="large" style={styles.title}>
            Coin Lists
          </ThemedText>

          {/* Create New List */}
          {isCreating ? (
            <ThemedView style={styles.createContainer}>
              <TextInput
                style={[
                  styles.input,
                  { color: textColor, backgroundColor, borderColor },
                ]}
                placeholder="Enter list name"
                placeholderTextColor={placeholderColor}
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
              />
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={handleCreate}
                  style={styles.createButton}
                  disabled={createList.isPending}
                >
                  <ThemedText type="bodySemibold">Create</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setIsCreating(false);
                    setNewListName("");
                  }}
                  style={styles.cancelButton}
                >
                  <ThemedText type="body" variant="secondary">
                    Cancel
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          ) : (
            <Pressable
              onPress={() => setIsCreating(true)}
              style={[styles.addButton, { borderColor }]}
            >
              <IconSymbol name="plus.circle.fill" size={24} color={tintColor} />
              <ThemedText
                type="bodySemibold"
                style={{ marginLeft: Spacing.sm }}
              >
                Create New List
              </ThemedText>
            </Pressable>
          )}

          {/* Lists */}
          <ScrollView style={styles.listsContainer}>
            {lists && lists.length > 0 ? (
              lists.map((list) => (
                <Pressable
                  key={list.id}
                  onPress={() => handleListPress(list.id)}
                  style={[styles.listItem, { borderColor }]}
                >
                  <ThemedView style={styles.listItemContent}>
                    <ThemedView style={styles.listItemHeader}>
                      <ThemedText type="subtitle">{list.name}</ThemedText>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(list.id, list.name);
                        }}
                        style={styles.deleteButton}
                      >
                        <IconSymbol
                          name="trash.fill"
                          size={30}
                          color={tintColor}
                        />
                      </Pressable>
                    </ThemedView>
                    <ThemedText type="small" variant="secondary">
                      {list.coins.length} coin
                      {list.coins.length !== 1 ? "s" : ""}
                    </ThemedText>
                    {list.notes && (
                      <ThemedText
                        type="small"
                        variant="secondary"
                        numberOfLines={1}
                      >
                        {list.notes}
                      </ThemedText>
                    )}
                  </ThemedView>
                </Pressable>
              ))
            ) : (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText type="body" variant="secondary">
                  No lists yet. Create your first list to get started!
                </ThemedText>
              </ThemedView>
            )}
          </ScrollView>
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
  title: {
    marginBottom: Spacing.lg,
    marginLeft: Spacing.lg,
  },
  createContainer: {
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
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  createButton: {
    backgroundColor: "#0a7ea4",
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
  },
  cancelButton: {
    padding: Spacing.sm,
    alignItems: "center",
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  listsContainer: {
    flex: 1,
  },
  listItem: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  listItemContent: {
    padding: Spacing.md,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
});
