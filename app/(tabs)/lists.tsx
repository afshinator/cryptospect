// app/(tabs)/lists.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CoinListItem } from "@/components/CoinListItem";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CoinList } from "@/constants/coinLists";
import { Spacing } from "@/constants/theme";
import {
  useCoinLists,
  useCreateCoinList,
  useDeleteCoinList,
  useUpdateCoinList,
} from "@/hooks/use-coin-lists";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  downloadCsvFile,
  exportCoinListsToCsv,
  getDefaultExportFilename,
  importCoinListsFromCsv,
} from "@/utils/csvImportExport";

export default function ListsScreen() {
  const router = useRouter();
  const { data: lists, isLoading } = useCoinLists();
  const createList = useCreateCoinList();
  const deleteList = useDeleteCoinList();
  const updateList = useUpdateCoinList();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [listToDelete, setListToDelete] = useState<{ id: string; name: string } | null>(null);

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
    // Show custom confirmation modal instead of native Alert.alert
    setListToDelete({ id: listId, name: listName });
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    if (!listToDelete) return;

    deleteList.mutate(listToDelete.id, {
      onSuccess: () => {
        setIsConfirmingDelete(false);
        setListToDelete(null);
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to delete list: ${error.message}`);
        setIsConfirmingDelete(false);
        setListToDelete(null);
      },
    });
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
    setListToDelete(null);
  };

  const handleListPress = (listId: string) => {
    router.push(`/list-detail?id=${listId}`);
  };

  const handleExport = () => {
    if (!lists || lists.length === 0) {
      Alert.alert("No Lists", "There are no lists to export.");
      return;
    }

    if (Platform.OS === "web") {
      // For web, prompt for filename
      const defaultFilename = getDefaultExportFilename();
      const filename = prompt("Enter filename for export:", defaultFilename) || defaultFilename;
      
      if (filename) {
        try {
          const csvContent = exportCoinListsToCsv(lists);
          downloadCsvFile(csvContent, filename);
          Alert.alert("Success", "Lists exported successfully!");
        } catch (error) {
          Alert.alert("Error", `Failed to export lists: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    } else {
      // For mobile, show a message (file system integration can be added later)
      Alert.alert(
        "Export",
        "Export functionality is currently available on web only. Mobile support coming soon.",
        [{ text: "OK" }]
      );
    }
  };

  const handleImport = () => {
    if (Platform.OS === "web") {
      // Create file input element
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv";
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          const importedLists = importCoinListsFromCsv(text);

          if (importedLists.length === 0) {
            Alert.alert("Error", "No valid lists found in the CSV file.");
            return;
          }

          // Check for duplicate names
          const existingListNames = new Set((lists || []).map((l) => l.name.toLowerCase()));
          const duplicateNames = importedLists
            .filter((list) => existingListNames.has(list.name.toLowerCase()))
            .map((list) => list.name);

          if (duplicateNames.length > 0) {
            Alert.alert(
              "Duplicate Lists Found",
              `The following lists already exist: ${duplicateNames.join(", ")}\n\nDo you want to replace them?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Replace",
                  onPress: () => performImport(importedLists, duplicateNames),
                },
              ]
            );
          } else {
            performImport(importedLists, []);
          }
        } catch (error) {
          Alert.alert(
            "Import Error",
            `Failed to import lists: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      };
      input.click();
    } else {
      // For mobile, show a message (file system integration can be added later)
      Alert.alert(
        "Import",
        "Import functionality is currently available on web only. Mobile support coming soon.",
        [{ text: "OK" }]
      );
    }
  };

  const performImport = async (
    importedLists: CoinList[],
    duplicateNames: string[]
  ) => {
    if (!lists) return;

    try {
      // For duplicates, update existing lists; for new ones, create
      const existingLists = [...lists];
      const listsToCreate: Omit<CoinList, "id" | "createdAt" | "updatedAt">[] = [];

      for (const importedList of importedLists) {
        const existingList = existingLists.find(
          (l) => l.name.toLowerCase() === importedList.name.toLowerCase()
        );

        if (existingList) {
          // Update existing list
          await updateList.mutateAsync({
            id: existingList.id,
            updates: {
              notes: importedList.notes,
              coins: importedList.coins,
            },
          });
        } else {
          // Create new list (extract only the fields needed for creation)
          listsToCreate.push({
            name: importedList.name,
            notes: importedList.notes,
            coins: importedList.coins,
          });
        }
      }

      // Create new lists
      for (const listToCreate of listsToCreate) {
        await createList.mutateAsync(listToCreate);
      }

      const replacedCount = duplicateNames.length;
      const createdCount = listsToCreate.length;
      
      let message = "";
      if (replacedCount > 0 && createdCount > 0) {
        message = `Successfully imported ${createdCount} new list(s) and replaced ${replacedCount} existing list(s).`;
      } else if (replacedCount > 0) {
        message = `Successfully replaced ${replacedCount} existing list(s).`;
      } else {
        message = `Successfully imported ${createdCount} new list(s).`;
      }

      Alert.alert("Success", message);
    } catch (error) {
      Alert.alert(
        "Import Error",
        `Failed to import lists: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
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
                <CoinListItem
                  key={list.id}
                  list={list}
                  onPress={handleListPress}
                  showDeleteButton={true}
                  onDelete={handleDelete}
                  showNotes={true}
                  variant="lists"
                />
              ))
            ) : (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText type="body" variant="secondary">
                  No lists yet. Create your first list to get started!
                </ThemedText>
              </ThemedView>
            )}
          </ScrollView>

          {/* Import/Export Buttons */}
          <ThemedView style={styles.importExportContainer}>
            <Pressable
              onPress={handleExport}
              style={[styles.importExportButton, { borderColor }]}
            >
              <IconSymbol name="square.and.arrow.up" size={20} color={tintColor} />
              <ThemedText type="bodySemibold" style={{ marginLeft: Spacing.xs }}>
                Export Lists
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleImport}
              style={[styles.importExportButton, { borderColor }]}
            >
              <IconSymbol name="square.and.arrow.down" size={20} color={tintColor} />
              <ThemedText type="bodySemibold" style={{ marginLeft: Spacing.xs }}>
                Import Lists
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ScreenContainer>

      {/* RENDER CUSTOM MODAL AT THE TOP LEVEL */}
      <ConfirmationModal
        visible={isConfirmingDelete}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete List"
        message={`Are you sure you want to delete "${listToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
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
    marginBottom: Spacing.sm,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  importExportContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  importExportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
});
