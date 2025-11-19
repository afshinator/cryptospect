import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";

import { ScreenContainer } from "@/components/ScreenContainer";
import { Collapsible } from "@/components/ui/collapsible";
import {
  CRYPTO_DECIMAL_PLACES,
  CURRENCY_DISPLAY_NAMES,
  CURRENCY_FLAG_URLS,
  CURRENCY_SYMBOLS,
  DISPLAY_CURRENCIES,
  ExchangeRateCache,
  FIAT_DECIMAL_PLACES,
  SupportedCurrency,
} from "@/constants/currency";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";
import { SafeAreaView } from "react-native-safe-area-context";

// Maximum width of the rate rows and list container
const MAX_ROW_WIDTH = 270;

// Local map for display names not present in CURRENCY_DISPLAY_NAMES (e.g., crypto)
const ADDITIONAL_DISPLAY_NAMES: Partial<
  Record<SupportedCurrency | "btc" | "eth", string>
> = {
  btc: "Bitcoin",
  eth: "Ethereum",
};

// The color to force on text when the row is selected (guaranteed light/white text)
const SELECTED_TEXT_COLOR = Colors.dark.text;


/**
 * Calculates the exchange rate of a target currency relative to the user's selected base currency.
 * @param selectedCurrency The user's preferred currency (the new base, e.g., NGN).
 * @param targetCurrency The currency to convert to (e.g., USD).
 * @param rates The USD-based exchange rates object from the API.
 * @returns The converted rate.
 */
function calculateRelativeRate(
  selectedCurrency: SupportedCurrency,
  targetCurrency: SupportedCurrency | "btc" | "eth",
  rates: ExchangeRateCache["rates"]
): number {
  const selectedCode = selectedCurrency.toUpperCase();
  const targetCode = targetCurrency.toUpperCase();

  // Find the base rate (how many units of the selected currency equal 1 USD)
  const baseRate = rates[selectedCode] ?? 1.0;

  // Find the target rate (how many units of the target currency equal 1 USD)
  // Defaults to 1.0 if the target is a placeholder like BTC/ETH (since base currency for API is USD)
  const targetRate = rates[targetCode] ?? 1.0;

  // Ratio: Target units / Base units
  return targetRate / baseRate;
}

// --- COMPONENTS ---

/**
 * Renders a single row in the rates list.
 */
function RateRow({
  code,
  rate,
  isSelected,
  isCrypto,
}: {
  code: SupportedCurrency | "btc" | "eth";
  rate: number;
  isSelected: boolean;
  isCrypto: boolean;
}) {
  const highlightColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "backgroundSecondary");

  // Determine display properties
  const displayCode = code.toUpperCase();
  // We explicitly check for both CURRENCY_DISPLAY_NAMES (fiat) and ADDITIONAL_DISPLAY_NAMES (crypto)
  const displayName =
    (CURRENCY_DISPLAY_NAMES as Record<string, string>)[code] ||
    ADDITIONAL_DISPLAY_NAMES[code] ||
    displayCode;
  const symbol = CURRENCY_SYMBOLS[code] || "$";
  const decimalPlaces = isCrypto ? CRYPTO_DECIMAL_PLACES : FIAT_DECIMAL_PLACES;
  const formattedRate = rate.toFixed(decimalPlaces);

  // Get flag URL from the imported constant
  const flagUrl = CURRENCY_FLAG_URLS[code];

  // Set color props to force light text when selected, ensuring contrast on 'tint' background
  const textProps = isSelected
    ? {
        lightColor: SELECTED_TEXT_COLOR,
        darkColor: SELECTED_TEXT_COLOR,
      }
    : {};

  return (
    <ThemedView
      style={[
        styles.rateRow,
        { backgroundColor: isSelected ? highlightColor : backgroundColor },
        isSelected && styles.rateRowSelected,
      ]}
      shadow={isSelected ? "md" : "sm"}
    >
      {/* BACKGROUND FLAG/ICON IMAGE (Absolute position for subtle watermark/tile effect) */}
      {flagUrl && (
        <Image
          source={{ uri: flagUrl }}
          style={styles.backgroundFlag}
          // Use 'contain' for flags and 'center' for crypto icons for a better subtle effect
          resizeMode={isCrypto ? "center" : "contain"}
        />
      )}

      {/* Column 1: Currency Code and Name (z-index for foreground visibility) */}
      <View style={styles.codeColumn}>
        <Collapsible
          title={displayCode}
          hideChevron
          style={{ backgroundColor: "transparent" }}
        >
          <ThemedText
            type="small"
            variant={isSelected ? "default" : "secondary"} // Use default (light) or secondary text based on selection
            {...textProps} // Apply forced light text if selected
            style={{ backgroundColor: "transparent" }}
          >
            {displayName}
          </ThemedText>
        </Collapsible>
      </View>

      {/* Column 2: Rate (z-index for foreground visibility) */}
      <View style={styles.rateColumn}>
        <ThemedText
          type="body"
          propFontScale={1.3}
          {...textProps} // Apply forced light text if selected
        >
          {symbol} {formattedRate}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export default function RatesScreen() {
  const { data: prefs, isPending: isPrefsPending } = usePreferences();
  const {
    data: ratesData,
    isLoading: isRatesLoading,
    error,
  } = useExchangeRates();
  const loadingTintColor = useThemeColor({}, "tint");

  // Guard Clauses for Loading/Error
  if (isPrefsPending || isRatesLoading || !prefs) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={loadingTintColor} />
        <ThemedText type="body" style={{ marginTop: Spacing.md }}>
          Loading exchange rates...
        </ThemedText>
      </ThemedView>
    );
  }

  const selectedCurrency = prefs.currency;

  if (error || !ratesData || !ratesData.rates) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText
          type="subtitle"
          variant="error"
          style={{ textAlign: "center" }}
        >
          Failed to load exchange rates.
        </ThemedText>
        <ThemedText
          type="small"
          variant="secondary"
          style={{ marginTop: Spacing.sm }}
        >
          Base currency: {ratesData?.base || "N/A"}
        </ThemedText>
      </ThemedView>
    );
  }

  // --- Prepare and Sort Data for FlatList ---
  // 1. Map all currencies to data objects
  const allMappedData = DISPLAY_CURRENCIES.map((code) => {
    const isCrypto = code === "btc" || code === "eth";

    // Calculate the rate relative to the user's selected currency
    const relativeRate = calculateRelativeRate(
      selectedCurrency,
      code,
      ratesData.rates
    );

    return {
      id: code,
      code: code,
      rate: relativeRate,
      // isSelected flag is no longer strictly necessary since the selected currency is filtered out, but we keep it here just in case.
      isSelected: code === selectedCurrency,
      isCrypto: isCrypto,
    };
  });

  // 2. Filter out the selected base currency (the one that equals 1)
  const filteredData = allMappedData.filter(item => item.code !== selectedCurrency);

  // 3. Separate Fiat and Crypto from the filtered list
  const fiatCurrencies = filteredData.filter(item => !item.isCrypto);
  const cryptoCurrencies = filteredData.filter(item => item.isCrypto);

  // 4. Sort Fiat currencies alphabetically by code
  fiatCurrencies.sort((a, b) => a.code.localeCompare(b.code));

  // 5. Combine: sorted fiat + cryptos at the bottom
  const dataForList = [...fiatCurrencies, ...cryptoCurrencies];
  // --- End Data Prep ---

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenContainer>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="large">Exchange Rates</ThemedText>
        </ThemedView>

        <ThemedText style={styles.description} type="bodySemibold">
          1 {CURRENCY_SYMBOLS[selectedCurrency]}
          {selectedCurrency.toUpperCase()} equals :
        </ThemedText>

        {/* Rates List Container - Constrained and centered */}
        <ThemedView style={styles.listContainer}>
          <FlatList
            data={dataForList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RateRow
                code={item.code}
                rate={item.rate}
                // isSelected will always be false for items in this filtered list
                isSelected={item.isSelected} 
                isCrypto={item.isCrypto}
              />
            )}
            scrollEnabled={false}
          />
        </ThemedView>

        <ThemedText type="small" variant="secondary" style={styles.footerNote}>
          Base currency is {ratesData.base}, cached locally for 24 hours. Last
          updated: {new Date(ratesData.timestamp).toLocaleTimeString()}
        </ThemedText>
      </ScreenContainer>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    minHeight: 300,
  },
  headerImage: {
    bottom: -90,
    left: -35,
    position: "absolute",
    opacity: 0.15,
  },
  titleContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  description: {
    // marginBottom: Spacing.lg,
  },
  // Wrapper for the header row to apply max width and centering
  headerRowWrapper: {
    width: "100%", // Crucial for mobile layout to ensure full width use
    maxWidth: MAX_ROW_WIDTH,
    alignSelf: "center",
    marginBottom: Spacing.sm, // Add space before the list starts
  },
  listContainer: {
    // Container for the list
    width: "100%", // Crucial for mobile layout to ensure full width use
    maxWidth: MAX_ROW_WIDTH, // Constrain width
    alignSelf: "center", // Center the list on wider screens
  },
  listHeader: {
    paddingVertical: Spacing.sm,
    // Use theme color for border
    borderBottomWidth: 1,
    backgroundColor: "transparent",
    borderBottomColor: Colors.light.border, // Explicitly use light border for separator visibility
    // No explicit maxWidth needed here, as it's wrapped in headerRowWrapper
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden", // Ensures flag doesn't bleed out of rounded corners
  },
  rateRowSelected: {
    borderWidth: 1,
    borderColor: Colors.dark.text,
  },
  backgroundFlag: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15, // Low opacity for subtle effect
    width: "100%",
    height: "100%",
  },
  codeColumn: {
    // flex: 1,
    zIndex: 1,
  },
  rateColumn: {
    // flex: 1,
    alignItems: "flex-end",
    zIndex: 1,
  },
  footerNote: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
});