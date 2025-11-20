// components/CoinAutocomplete.tsx

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CoinGeckoMarketData } from "@/constants/coinGecko";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useThemeColor } from "@/hooks/use-theme-color";
import React, { useEffect, useMemo, useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

interface CoinAutocompleteProps {
  onSelect: (coin: CoinGeckoMarketData) => void;
  excludeCoinIds?: string[]; // Coins to exclude from results (e.g., already in list)
  placeholder?: string;
}

export function CoinAutocomplete({
  onSelect,
  excludeCoinIds = [],
  placeholder = "Search by name or symbol",
}: CoinAutocompleteProps) {
  const { cryptoMarket } = useAppInitialization();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const inputRef = React.useRef<TextInput>(null);
  
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const tintColor = useThemeColor({}, "tint");

  // Filter and search coins
  const filteredCoins = useMemo(() => {
    if (!cryptoMarket?.data) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    const availableCoins = cryptoMarket.data.filter(
      (coin) => !excludeCoinIds.includes(coin.id)
    );

    return availableCoins.filter((coin) => {
      const nameMatch = coin.name.toLowerCase().includes(query);
      const symbolMatch = coin.symbol.toLowerCase().includes(query);
      return nameMatch || symbolMatch;
    }).slice(0, 50); // Show more results in modal
  }, [searchQuery, cryptoMarket?.data, excludeCoinIds]);

  const handleSelect = (coin: CoinGeckoMarketData) => {
    // Select immediately
    onSelect(coin);
    setSearchQuery("");
    setIsModalVisible(false);
    // Dismiss keyboard after closing modal
    setTimeout(() => {
      Keyboard.dismiss();
      inputRef.current?.blur();
    }, 0);
  };

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSearchQuery("");
    // Dismiss keyboard and blur input when closing modal
    Keyboard.dismiss();
    inputRef.current?.blur();
  };

  // Auto-focus input when modal opens (with delay for mobile)
  useEffect(() => {
    if (isModalVisible) {
      // Small delay to ensure modal is fully rendered before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, Platform.OS === "ios" ? 300 : 100);
      return () => clearTimeout(timer);
    }
  }, [isModalVisible]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={[styles.addButton, { borderColor }]}
      >
        <IconSymbol name="plus.circle.fill" size={24} color={tintColor} />
        <ThemedText type="bodySemibold" style={{ marginLeft: Spacing.sm }}>
          Add Coin
        </ThemedText>
      </Pressable>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlayPressable}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={handleCloseModal}
          />
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ThemedView
              style={[styles.modalContent, { backgroundColor }]}
              onStartShouldSetResponder={() => true}
            >
              {/* Modal Header */}
              <ThemedView style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Search Coins
                </ThemedText>
                <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                  <IconSymbol name="xmark.circle.fill" size={28} color={tintColor} />
                </Pressable>
              </ThemedView>

              {/* Search Input in Modal */}
              <TextInput
                ref={inputRef}
                style={[
                  styles.modalInput,
                  { color: textColor, backgroundColor, borderColor },
                ]}
                placeholder={placeholder}
                placeholderTextColor={placeholderColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={false}
                returnKeyType="search"
              />

              {/* Results List */}
              {filteredCoins.length > 0 ? (
                <ScrollView
                  style={styles.modalScrollView}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalScrollViewContent}
                >
                  {filteredCoins.map((item) => (
                    <Pressable
                      key={item.id}
                      style={({ pressed }) => [
                        styles.modalItem,
                        { borderBottomColor: borderColor },
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleSelect(item)}
                    >
                      {item.image && (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.coinImage}
                        />
                      )}
                      <View style={styles.coinInfo}>
                        <ThemedText type="bodySemibold">{item.name}</ThemedText>
                        <ThemedText type="small" variant="secondary">
                          {item.symbol.toUpperCase()}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : searchQuery ? (
                <ThemedView style={styles.emptyState}>
                  <ThemedText type="body" variant="secondary">
                    No coins found. API lookup coming soon.
                  </ThemedText>
                </ThemedView>
              ) : (
                <ThemedView style={styles.emptyState}>
                  <ThemedText type="body" variant="secondary">
                    Start typing to search for coins...
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  modalOverlayPressable: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  modalContent: {
    borderBottomLeftRadius: Spacing.lg,
    borderBottomRightRadius: Spacing.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: Spacing.lg,
    maxHeight: "85%",
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 44,
    marginBottom: Spacing.md,
  },
  modalScrollView: {
    flex: 1,
    maxHeight: 400,
  },
  modalScrollViewContent: {
    paddingBottom: Spacing.md,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
});

