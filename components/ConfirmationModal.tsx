// components/ConfirmationModal.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { Modal, Pressable, StyleSheet } from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: "danger" | "default";
}

export function ConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonStyle = "danger",
}: ConfirmationModalProps) {
  const cardColor = useThemeColor({}, "backgroundSecondary");
  const tintColor = useThemeColor({}, "tint");
  const dangerColor = useThemeColor({}, "error");

  const confirmBgColor = confirmButtonStyle === "danger" ? dangerColor : tintColor;
  const confirmBorderColor = confirmButtonStyle === "danger" ? dangerColor : tintColor;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      {/* Set a semi-transparent background color directly on the overlay for reliable dimming */}
      <ThemedView style={styles.overlay}>
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>

          <ThemedView style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { borderColor: tintColor }]}
            >
              <ThemedText style={{ color: tintColor }}>{cancelText}</ThemedText>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={[
                styles.button,
                { backgroundColor: confirmBgColor, borderColor: confirmBorderColor },
              ]}
            >
              <ThemedText type="bodySemibold" style={{ color: "#fff" }}>
                {confirmText}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Manually apply a semi-transparent black background for reliable dimming
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  card: {
    width: "80%",
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

