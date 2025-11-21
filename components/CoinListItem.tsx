// components/CoinListItem.tsx
//
// This component displays a COIN LIST item (not an individual crypto coin).
// It shows information about a coin list including:
// - List name
// - Coin count with overlapping coin icons (via CoinListPreview)
// - Optional delete button (for lists page)
// - Optional notes (for lists page)
// - Optional chevron icon (for home page)
//
// Used on both the home page and lists page with different configurations.

import { CoinListPreview } from "@/components/CoinListPreview";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CoinList } from "@/constants/coinLists";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { GestureResponderEvent, Pressable, StyleSheet } from "react-native";

interface CoinListItemProps {
  list: CoinList;
  onPress: (listId: string) => void;
  showDeleteButton?: boolean;
  onDelete?: (listId: string, listName: string) => void;
  showNotes?: boolean;
  showChevron?: boolean;
  variant?: "home" | "lists"; // Different styling variants
}

/**
 * Reusable coin list item component
 * Used on both home page and lists page with different configurations
 */
export function CoinListItem({
  list,
  onPress,
  showDeleteButton = false,
  onDelete,
  showNotes = false,
  showChevron = false,
  variant = "home",
}: CoinListItemProps) {
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");

  const handleDelete = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(list.id, list.name);
    }
  };

  const isListsVariant = variant === "lists";

  // Capitalize first character of list name
  const capitalizedName = list.name.charAt(0).toUpperCase() + list.name.slice(1);

  return (
    <Pressable
      onPress={() => onPress(list.id)}
      style={[
        styles.listItem,
        isListsVariant ? styles.listItemLists : styles.listItemHome,
        { borderColor },
      ]}
    >
      <ThemedView
        style={[
          styles.listItemContent,
          isListsVariant ? styles.listItemContentLists : styles.listItemContentHome,
        ]}
      >
        {isListsVariant && showDeleteButton ? (
          <ThemedView style={styles.listItemHeader}>
            <ThemedText type="subtitle">{capitalizedName}</ThemedText>
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <IconSymbol name="trash.fill" size={30} color={tintColor} />
            </Pressable>
          </ThemedView>
        ) : (
          <ThemedText type={isListsVariant ? "subtitle" : "bodySemibold"}>
            {capitalizedName}
          </ThemedText>
        )}
        <CoinListPreview list={list} />
        {showNotes && list.notes && list.notes.trim() ? (
          <ThemedText type="small" variant="secondary" numberOfLines={1}>
            {list.notes}
          </ThemedText>
        ) : null}
      </ThemedView>
      {showChevron ? (
        <IconSymbol name="chevron.right" size={20} color={tintColor} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
  },
  listItemHome: {
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  listItemLists: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  listItemContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listItemContentHome: {
    // No additional padding needed for home variant
  },
  listItemContentLists: {
    padding: Spacing.sm,
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
});

