// components/AlertModal.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { Modal, Pressable, StyleSheet } from "react-native";

interface AlertModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  message: string;
  buttonText?: string;
  buttonStyle?: "default" | "danger" | "success";
}

export function AlertModal({
  visible,
  onDismiss,
  title,
  message,
  buttonText = "OK",
  buttonStyle = "default",
}: AlertModalProps) {
  const cardColor = useThemeColor({}, "backgroundSecondary");
  const tintColor = useThemeColor({}, "tint");
  const dangerColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");

  let buttonBgColor = tintColor;
  let buttonBorderColor = tintColor;

  if (buttonStyle === "danger") {
    buttonBgColor = dangerColor;
    buttonBorderColor = dangerColor;
  } else if (buttonStyle === "success") {
    buttonBgColor = successColor;
    buttonBorderColor = successColor;
  }

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
    >
      <ThemedView style={styles.overlay}>
        <ThemedView style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText style={styles.message}>{message}</ThemedText>

          <Pressable
            onPress={onDismiss}
            style={[
              styles.button,
              { backgroundColor: buttonBgColor, borderColor: buttonBorderColor },
            ]}
          >
            <ThemedText type="bodySemibold" style={{ color: "#fff" }}>
              {buttonText}
            </ThemedText>
          </Pressable>
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
  button: {
    padding: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
});

