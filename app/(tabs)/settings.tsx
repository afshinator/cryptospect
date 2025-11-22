import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import { AlertModal } from "@/components/AlertModal";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionContainer } from "@/components/SectionContainer";
import {
  CURRENCY_DISPLAY_NAMES,
  SupportedCurrency,
} from "@/constants/currency";
import {
  CRYPTO_MARKET_QUERY_KEY,
  CRYPTO_OVERVIEW_QUERY_KEY,
  EXCHANGE_RATES_QUERY_KEY,
  STABLECOIN_DATA_QUERY_KEY,
  SAVED_OUTLIER_COINS_QUERY_KEY,
  LightDarkMode,
} from "@/constants/misc";
import { BorderRadius, Spacing } from "@/constants/theme";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";
import { clearNetworkData } from "@/utils/clearNetworkData";

// 💡 🔨 TODO: for Font Size section, add a snap-to-1.0 button
// -- Replace heading like Appearance and Preferred Currency with icons

// Configuration constants
const FONT_SCALE_MIN = 0.5;
const FONT_SCALE_MAX = 1.4;
const FONT_SCALE_STEP = 0.1;
const CONTAINER_PADDING = 16;
const SLIDER_HEIGHT = 40;
const BUTTON_BORDER_WIDTH = 2;

export default function SettingsScreen() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const queryClient = useQueryClient();
  const borderSelectedColor = useThemeColor({}, "tint"); // Use 'tint' for selected border for better visibility
  const sliderThumbColor = useThemeColor({}, "tint");
  const sliderMinColor = useThemeColor({}, "tint");
  const sliderMaxColor = useThemeColor({}, "border");
  const dividerColor = useThemeColor({}, "border");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "border");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const errorColor = useThemeColor({}, "error");

  // Local state for slider value during drag
  const [tempFontScale, setTempFontScale] = useState<number | null>(null);
  
  // Local state for directory input - sync with preferences
  const [directoryInput, setDirectoryInput] = useState<string>("");
  const [alertModal, setAlertModal] = useState<{ title: string; message: string; buttonStyle?: "default" | "danger" | "success" } | null>(null);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  
  // Update directory input when preferences load
  useEffect(() => {
    if (preferences?.defaultImportExportDirectory) {
      setDirectoryInput(preferences.defaultImportExportDirectory);
    }
  }, [preferences?.defaultImportExportDirectory]);

  if (isLoading || !preferences) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading preferences...</ThemedText>
      </ThemedView>
    );
  }

  const themeOptions: LightDarkMode[] = ["system", "light", "dark"] as const;
  const supportedCurrencies = Object.keys(
    CURRENCY_DISPLAY_NAMES
  ) as SupportedCurrency[];

  // Font scale logic
  const displayFontScale = tempFontScale ?? preferences.fontScale;
  const previewScaleFactor = displayFontScale / preferences.fontScale;
  
  // To prevent font scaling on the settings page itself, we need to cancel out
  // the base fontScale by using its inverse. The preview area will use
  // previewScaleFactor to show the effect of the font scale change.
  const inverseFontScale = 1.0 / preferences.fontScale;

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]} edges={["top"]}>
      <ScreenContainer>
        <ThemedText type="large" style={styles.title} propFontScale={inverseFontScale}>
          Settings
        </ThemedText>

        {/* Appearance */}
        <SectionContainer>
          <ThemedText type="subtitle" propFontScale={inverseFontScale}>Appearance</ThemedText>
          <ThemedText
            variant="secondary"
            type="small"
            style={styles.sectionDescription}
            propFontScale={inverseFontScale}
          >
            Choose your preferred theme
          </ThemedText>

          <View style={styles.buttonRow}>
            {themeOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() =>
                  updatePreferences.mutate({ lightDarkMode: option })
                }
                style={styles.buttonPressable}
              >
                <ThemedView
                  shadow="sm"
                  style={[
                    styles.button,
                    preferences.lightDarkMode === option && {
                      borderColor: borderSelectedColor,
                    },
                  ]}
                >
                  <ThemedText
                    type="bodySemibold"
                    variant={
                      preferences.lightDarkMode === option
                        ? "default"
                        : "secondary"
                    }
                    propFontScale={inverseFontScale}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </View>
        </SectionContainer>

        {/* Font Scale */}
        <SectionContainer>
          <View style={styles.fontSizeTitleRow}>
            <ThemedText type="subtitle" propFontScale={inverseFontScale}>Font Size</ThemedText>
            <Pressable
              onPress={() => {
                setTempFontScale(null);
                updatePreferences.mutate({ fontScale: 1.0 });
              }}
              disabled={preferences.fontScale === 1.0}
              style={styles.resetButtonPressable}
            >
              <ThemedView 
                shadow="sm" 
                style={[
                  styles.resetButton,
                  preferences.fontScale === 1.0 && styles.resetButtonDisabled,
                ]}
              >
                <ThemedText type="small" variant="link" propFontScale={inverseFontScale}>
                  Reset
                </ThemedText>
              </ThemedView>
            </Pressable>
          </View>
          <ThemedText
            variant="secondary"
            type="small"
            style={styles.sectionDescription}
            propFontScale={inverseFontScale}
          >
            Current size: {displayFontScale.toFixed(1)}x
          </ThemedText>

          <ThemedView style={styles.sliderContainer}>
            <ThemedText type="small" variant="secondary" propFontScale={inverseFontScale}>
              {FONT_SCALE_MIN}×
            </ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={FONT_SCALE_MIN}
              maximumValue={FONT_SCALE_MAX}
              step={FONT_SCALE_STEP}
              value={preferences.fontScale}
              onValueChange={(value) =>
                setTempFontScale(
                  Math.round(value / FONT_SCALE_STEP) * FONT_SCALE_STEP
                )
              }
              onSlidingComplete={(value) => {
                const rounded =
                  Math.round(value / FONT_SCALE_STEP) * FONT_SCALE_STEP;
                setTempFontScale(null);
                updatePreferences.mutate({ fontScale: rounded });
              }}
              minimumTrackTintColor={sliderMinColor}
              maximumTrackTintColor={sliderMaxColor}
              thumbTintColor={sliderThumbColor}
            />
            <ThemedText type="small" variant="secondary" propFontScale={inverseFontScale}>
              {FONT_SCALE_MAX}×
            </ThemedText>
        </ThemedView>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Preview */}
          <ThemedView style={styles.previewContent}>
            <ThemedText
              type="caption"
              variant="secondary"
              propFontScale={previewScaleFactor}
            >
              PREVIEW
            </ThemedText>
            <ThemedText type="title" propFontScale={previewScaleFactor}>
              Title Text
            </ThemedText>
            <ThemedText type="body" propFontScale={previewScaleFactor}>
              This is body text to preview your settings.
            </ThemedText>
            <ThemedText
              type="small"
              variant="secondary"
              propFontScale={previewScaleFactor}
            >
              Small secondary text
            </ThemedText>
          </ThemedView>
        </SectionContainer>

        {/* Currency Selection */}
        <SectionContainer>
          <ThemedText type="subtitle" propFontScale={inverseFontScale}>Preferred Currency</ThemedText>
          <ThemedText
            variant="secondary"
            type="small"
            style={styles.sectionDescription}
            propFontScale={inverseFontScale}
          >
            Used for displaying monetary values.
          </ThemedText>

          <View style={styles.currencyRow}>
            {supportedCurrencies.map((currencyCode) => (
              <Pressable
                key={currencyCode}
                onPress={() =>
                  updatePreferences.mutate({ currency: currencyCode })
                }
                style={styles.currencyPressable}
              >
                <ThemedView
                  shadow="sm"
                  style={[
                    styles.button,
                    styles.currencyButton,
                    preferences.currency === currencyCode && {
                      borderColor: borderSelectedColor,
                    },
                  ]}
                >
                  <ThemedText
                    type="bodySemibold"
                    variant={
                      preferences.currency === currencyCode
                        ? "default"
                        : "secondary"
                    }
                    propFontScale={inverseFontScale}
                  >
                    {currencyCode.toUpperCase()}
                  </ThemedText>
                  <ThemedText type="caption" variant="secondary" propFontScale={inverseFontScale}>
                    {CURRENCY_DISPLAY_NAMES[currencyCode]}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </View>
        </SectionContainer>

        {/* Import/Export Directory */}
        <SectionContainer>
          <ThemedText type="subtitle" propFontScale={inverseFontScale}>
            Import/Export Directory
          </ThemedText>
          <ThemedText
            variant="secondary"
            type="small"
            style={styles.sectionDescription}
            propFontScale={inverseFontScale}
          >
            {Platform.OS === "web"
              ? "Default directory path for CSV file operations (browser may override)"
              : "Default directory path for CSV file operations"}
          </ThemedText>

          <View style={styles.directoryInputContainer}>
            <TextInput
              style={[
                styles.directoryInput,
                { color: textColor, backgroundColor, borderColor },
              ]}
              placeholder="Enter directory path (e.g., /Users/name/Documents)"
              placeholderTextColor={placeholderColor}
              value={directoryInput}
              onChangeText={setDirectoryInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => {
                const trimmed = directoryInput.trim();
                updatePreferences.mutate({
                  defaultImportExportDirectory: trimmed || undefined,
                });
                if (Platform.OS === "web") {
                  Alert.alert("Success", "Directory preference saved.");
                } else {
                  setAlertModal({ title: "Success", message: "Directory preference saved.", buttonStyle: "success" });
                }
              }}
              style={styles.saveDirectoryButton}
            >
              <ThemedText type="bodySemibold" propFontScale={inverseFontScale}>
                Save
          </ThemedText>
            </Pressable>
          </View>

          {preferences.defaultImportExportDirectory && (
          <ThemedText
            type="small"
            variant="secondary"
              style={styles.currentDirectory}
              propFontScale={inverseFontScale}
          >
              Current: {preferences.defaultImportExportDirectory}
          </ThemedText>
          )}
        </SectionContainer>

        {/* Reset Network Data */}
        <SectionContainer>
          <ThemedText type="subtitle" propFontScale={inverseFontScale}>
            Reset Network Data
          </ThemedText>
          <ThemedText
            variant="secondary"
            type="small"
            style={styles.sectionDescription}
            propFontScale={inverseFontScale}
          >
            Clear all cached network data (market data, exchange rates, etc.). Your coin lists and preferences will be preserved.
          </ThemedText>

          <Pressable
            onPress={() => setShowResetConfirmation(true)}
            style={styles.resetNetworkDataButton}
          >
            <ThemedView
              shadow="sm"
              style={[
                styles.resetNetworkDataButtonContent,
                { borderColor: errorColor },
              ]}
            >
              <ThemedText type="bodySemibold" propFontScale={inverseFontScale}>
                ⚠️ Reset Network Data
              </ThemedText>
            </ThemedView>
          </Pressable>
        </SectionContainer>
      </ScreenContainer>
      <ConfirmationModal
        visible={showResetConfirmation}
        onConfirm={async () => {
          setShowResetConfirmation(false);
          try {
            await clearNetworkData();
            
            // Invalidate React Query cache to trigger refetch
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: CRYPTO_MARKET_QUERY_KEY }),
              queryClient.invalidateQueries({ queryKey: CRYPTO_OVERVIEW_QUERY_KEY }),
              queryClient.invalidateQueries({ queryKey: EXCHANGE_RATES_QUERY_KEY }),
              queryClient.invalidateQueries({ queryKey: STABLECOIN_DATA_QUERY_KEY }),
              queryClient.invalidateQueries({ queryKey: SAVED_OUTLIER_COINS_QUERY_KEY }),
            ]);

            setAlertModal({
              title: "Success",
              message: "Network data has been cleared. The app will refetch fresh data.",
              buttonStyle: "success",
            });
          } catch (error) {
            setAlertModal({
              title: "Error",
              message: "Failed to clear network data. Please try again.",
              buttonStyle: "danger",
            });
          }
        }}
        onCancel={() => setShowResetConfirmation(false)}
        title="⚠️ Reset Network Data"
        message="This will clear all cached network data including:\n• Market data\n• Exchange rates\n• Stablecoin data\n• Saved outlier coins\n\nYour coin lists and preferences will be preserved.\n\nThis action cannot be undone. Continue?"
        confirmText="Reset"
        cancelText="Cancel"
        confirmButtonStyle="danger"
      />
      <AlertModal
        visible={alertModal !== null}
        onDismiss={() => setAlertModal(null)}
        title={alertModal?.title || ""}
        message={alertModal?.message || ""}
        buttonStyle={alertModal?.buttonStyle || "default"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: CONTAINER_PADDING,
    paddingHorizontal: CONTAINER_PADDING,
  },
  scrollContent: {
    padding: CONTAINER_PADDING,
  },
  title: {
    marginBottom: Spacing.lg,
  },
  sectionDescription: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  fontSizeTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  resetButtonPressable: {
    // No additional styles needed, Pressable handles press state
  },
  resetButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: BUTTON_BORDER_WIDTH,
    borderColor: "transparent",
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "flex-start",
  },
  buttonPressable: {
    flex: 1,
  },
  currencyPressable: {
    width: "30%", // Roughly 3 buttons per row on wider screens
    minWidth: 90,
  },
  button: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: BUTTON_BORDER_WIDTH,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  currencyButton: {
    paddingVertical: Spacing.sm,
    height: 60,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  slider: {
    flex: 1,
    height: SLIDER_HEIGHT,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '80%',
    alignSelf: 'center',
    marginVertical: Spacing.md,
  },
  previewContent: {
    gap: Spacing.sm,
  },
  directoryInputContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  directoryInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 16,
    minHeight: 44,
  },
  saveDirectoryButton: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  currentDirectory: {
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  resetNetworkDataButton: {
    marginTop: Spacing.sm,
  },
  resetNetworkDataButtonContent: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: BUTTON_BORDER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
});

