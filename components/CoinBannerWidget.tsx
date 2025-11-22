import React, { useState, useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CoinBanner } from "@/components/CoinBanner";
import { SectionContainer } from "@/components/SectionContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CoinList } from "@/constants/coinLists";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useCoinLists } from "@/hooks/use-coin-lists";
import { useThemeColor } from "@/hooks/use-theme-color";

// --- CONSTANTS ---
const MAX_LIST_BUTTONS = 3;
const BUTTON_BORDER_WIDTH = 2;

// Speed options in milliseconds
const SPEED_OPTIONS = [
  { label: "Very Slow", value: 120000 }, // 2 minutes
  { label: "Slow", value: 60000 }, // 1 minute
  { label: "Medium", value: 30000 }, // 30 seconds
  { label: "Fast", value: 15000 }, // 15 seconds
  { label: "Very Fast", value: 8000 }, // 8 seconds
];

interface CoinBannerWidgetProps {
  size?: "default" | "small";
  speed?: number;
  lessText?: boolean;
  hideCoinName?: boolean;
}

export function CoinBannerWidget({
  size = "small",
  speed: initialSpeed = 60000,
  lessText = true,
  hideCoinName,
}: CoinBannerWidgetProps) {
  const { data: lists, isLoading } = useCoinLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false); // Track if any button has been clicked
  const [speed, setSpeed] = useState(initialSpeed);
  const [showSpeedModal, setShowSpeedModal] = useState(false);

  const borderSelectedColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const backgroundColor = useThemeColor({}, "background");
  const backgroundSecondaryColor = useThemeColor({}, "backgroundSecondary");

  // Get up to 3 lists to show as buttons
  const listsToShow = useMemo(() => {
    if (!lists || lists.length === 0) return [];
    return lists.slice(0, MAX_LIST_BUTTONS);
  }, [lists]);

  // Find the selected list
  const selectedList = useMemo(() => {
    if (!selectedListId || !lists) return undefined;
    return lists.find((list) => list.id === selectedListId);
  }, [selectedListId, lists]);

  // Capitalize first character of list name
  const capitalizeName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // Handle button press - set selection and show ticker
  const handleListButtonPress = (listId: string | null) => {
    setSelectedListId(listId);
    setHasSelected(true);
  };

  // Get current speed label
  const currentSpeedLabel = useMemo(() => {
    const option = SPEED_OPTIONS.find((opt) => opt.value === speed);
    return option ? option.label : `${(speed / 1000).toFixed(0)}s`;
  }, [speed]);

  // Show loading state
  if (isLoading) {
    return (
      <SectionContainer>
        <ThemedText type="body" variant="secondary">
          Loading coin lists...
        </ThemedText>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      {/* Title */}
      <ThemedText type="subtitle" style={styles.title}>
        Coin Market Ticker
      </ThemedText>

      {/* Controls Row */}
      <View style={styles.controlsRow}>
        {/* List Selection Buttons */}
        <View style={styles.buttonRow}>
          {/* "All Coins" button */}
          <Pressable
            onPress={() => handleListButtonPress(null)}
            style={styles.buttonPressable}
          >
            <ThemedView
              shadow="sm"
              style={[
                styles.button,
                selectedListId === null && hasSelected && {
                  borderColor: borderSelectedColor,
                },
                { borderColor },
              ]}
            >
              <ThemedText
                type="bodySemibold"
                variant={selectedListId === null && hasSelected ? "default" : "secondary"}
              >
                All Coins
              </ThemedText>
            </ThemedView>
          </Pressable>

          {/* List buttons */}
          {listsToShow.map((list) => (
            <Pressable
              key={list.id}
              onPress={() => handleListButtonPress(list.id)}
              style={styles.buttonPressable}
            >
              <ThemedView
                shadow="sm"
                style={[
                  styles.button,
                  selectedListId === list.id && {
                    borderColor: borderSelectedColor,
                  },
                  { borderColor },
                ]}
              >
                <ThemedText
                  type="bodySemibold"
                  variant={selectedListId === list.id ? "default" : "secondary"}
                >
                  {capitalizeName(list.name)}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>

        {/* Speed Selector */}
        <Pressable
          onPress={() => setShowSpeedModal(true)}
          style={({ pressed }) => [
            styles.speedSelector,
            {
              borderColor,
              backgroundColor: backgroundSecondaryColor,
            },
            pressed && styles.speedSelectorPressed,
          ]}
        >
          <ThemedText type="small" variant="secondary">
            Speed:
          </ThemedText>
          <ThemedText type="bodySemibold" style={styles.speedSelectorText}>
            {currentSpeedLabel}
          </ThemedText>
          <ThemedText type="xsmall" variant="secondary" style={styles.dropdownArrow}>
            ▼
          </ThemedText>
        </Pressable>
      </View>

      {/* Coin Banner - Only show if a button has been clicked */}
      {hasSelected && (
        <CoinBanner
          size={size}
          speed={speed}
          lessText={lessText}
          hideCoinName={hideCoinName}
          coinList={selectedList}
        />
      )}

      {/* Speed Selection Modal */}
      <Modal
        visible={showSpeedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpeedModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSpeedModal(false)}
        >
          <ThemedView
            style={[styles.modalContent, { backgroundColor, borderColor }]}
            onStartShouldSetResponder={() => true}
          >
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Select Speed
            </ThemedText>
            <ScrollView style={styles.modalScrollView}>
              {SPEED_OPTIONS.map((option) => {
                const isSelected = option.value === speed;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setSpeed(option.value);
                      setShowSpeedModal(false);
                    }}
                    style={({ pressed }) => [
                      styles.modalItem,
                      isSelected && {
                        ...styles.modalItemSelected,
                        backgroundColor: backgroundSecondaryColor,
                      },
                      pressed && styles.modalItemPressed,
                    ]}
                  >
                    <ThemedView style={styles.modalItemContent}>
                      <ThemedText
                        type="bodySemibold"
                        variant={isSelected ? "default" : "secondary"}
                      >
                        {option.label}
                      </ThemedText>
                      <ThemedText type="small" variant="secondary">
                        {(option.value / 1000).toFixed(0)} seconds per cycle
                      </ThemedText>
                    </ThemedView>
                    {isSelected && (
                      <ThemedText type="body" style={{ color: borderSelectedColor }}>
                        ✓
                      </ThemedText>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </ThemedView>
        </Pressable>
      </Modal>
    </SectionContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing.md,
  },
  controlsRow: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  buttonPressable: {
    flex: 1,
    minWidth: 80,
  },
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: BUTTON_BORDER_WIDTH,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  speedSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  speedSelectorPressed: {
    opacity: 0.7,
  },
  speedSelectorText: {
    flex: 1,
  },
  dropdownArrow: {
    marginLeft: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  modalTitle: {
    marginBottom: Spacing.md,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemSelected: {
    borderBottomWidth: 0,
  },
  modalItemPressed: {
    opacity: 0.7,
  },
  modalItemContent: {
    flex: 1,
  },
});

