// components/CurrencySelectorModal.tsx

import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CURRENCY_DISPLAY_NAMES, SupportedCurrency } from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

interface CurrencySelectorModalProps {
  visible: boolean;
  selectedCurrency: SupportedCurrency;
  onSelectCurrency: (currency: SupportedCurrency) => void;
  onClose: () => void;
}

/**
 * Modal component for selecting a currency.
 * Displays all available fiat currencies in a scrollable list.
 */
export function CurrencySelectorModal({
  visible,
  selectedCurrency,
  onSelectCurrency,
  onClose,
}: CurrencySelectorModalProps) {
  const backgroundColor = useThemeColor({}, "background");
  const backgroundSecondaryColor = useThemeColor({}, "backgroundSecondary");
  const tintColor = useThemeColor({}, "tint");

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <ThemedView style={[styles.modalContent, { backgroundColor }]}>
          <ThemedText type="subtitle" style={styles.modalTitle}>
            Select Currency
          </ThemedText>
          <ScrollView style={styles.modalScrollView}>
            {Object.keys(CURRENCY_DISPLAY_NAMES).map((code) => {
              const currencyCode = code as SupportedCurrency;
              const displayName = CURRENCY_DISPLAY_NAMES[currencyCode];
              const isSelected = currencyCode === selectedCurrency;

              return (
                <Pressable
                  key={currencyCode}
                  onPress={() => {
                    onSelectCurrency(currencyCode);
                    onClose();
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
                      {currencyCode.toUpperCase()}
                    </ThemedText>
                    <ThemedText type="small" variant="secondary">
                      {displayName}
                    </ThemedText>
                  </ThemedView>
                  {isSelected && (
                    <ThemedText type="body" style={{ color: tintColor }}>
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
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: Spacing.lg,
    borderTopRightRadius: Spacing.lg,
    padding: Spacing.lg,
    maxHeight: "80%",
  },
  modalTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  modalItemSelected: {
    // backgroundColor set dynamically in component
  },
  modalItemPressed: {
    opacity: 0.7,
  },
  modalItemContent: {
    flex: 1,
  },
});

