import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors, Spacing } from "@/constants/theme";

import { ScreenContainer } from "@/components/ScreenContainer";
import { Collapsible } from "@/components/ui/collapsible";
import { CryptoMarketSnapshot } from "@/constants/coinGecko";
import {
  CURRENCY_DISPLAY_NAMES,
  CURRENCY_FLAG_URLS,
  CURRENCY_SYMBOLS,
  DISPLAY_CURRENCIES,
  ExchangeRateCache,
  SupportedCurrency,
} from "@/constants/currency";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { usePreferences } from "@/hooks/use-preference";
import { useThemeColor } from "@/hooks/use-theme-color";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// =========================================================================
// CONSTANTS
// =========================================================================

// UI Constants
const MAX_ROW_WIDTH = 290;
const SELECTED_TEXT_COLOR = Colors.dark.text;

// Decimal Places Configuration (for crypto precision calculation)
const MAX_DECIMAL_PLACES = 20; // Maximum decimal places for very small crypto values

// Crypto Coin IDs from CoinGecko API
const COINGECKO_BTC_ID = "bitcoin";
const COINGECKO_ETH_ID = "ethereum";

// Local map for display names not present in CURRENCY_DISPLAY_NAMES (e.g., crypto)
const ADDITIONAL_DISPLAY_NAMES: Partial<
  Record<SupportedCurrency | "btc" | "eth", string>
> = {
  btc: "Bitcoin",
  eth: "Ethereum",
};


// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

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

/**
 * Formats a rate value with appropriate decimal places.
 * For crypto: Shows full precision (no rounding) - up to 15 significant digits
 * For fiat: Rounds based on fullPrecision flag (2 decimal places if false, full precision if true)
 * @param rate The rate value to format
 * @param isCrypto Whether this is a cryptocurrency
 * @param fullPrecision Whether to show full precision for fiat currencies
 * @returns Object with formatted string and whether it's approximate
 */
function formatRate(rate: number, isCrypto: boolean, fullPrecision: boolean = false): { formatted: string; isApproximate: boolean } {
  if (isCrypto) {
    // For crypto, show full precision without rounding
    if (rate === 0) {
      return { formatted: '0', isApproximate: false };
    }
    
    // Use enough decimal places to show full precision
    // For very small numbers, calculate based on magnitude
    const absRate = Math.abs(rate);
    let decimalPlaces = 12; // Default precision
    
    if (absRate < 1) {
      // For numbers less than 1, calculate decimal places needed
      // Use log10 to determine how many leading zeros
      const log10 = Math.log10(absRate);
      if (log10 < 0) {
        // Add extra precision for very small numbers
        decimalPlaces = Math.ceil(-log10) + 10;
      }
    }
    
    // Cap at MAX_DECIMAL_PLACES for display
    decimalPlaces = Math.min(decimalPlaces, MAX_DECIMAL_PLACES);
    
    // Format with calculated precision
    let formatted = rate.toFixed(decimalPlaces);
    
    // Remove trailing zeros but preserve the decimal point if there are significant digits
    formatted = formatted.replace(/\.?0+$/, '');
    
    return { formatted, isApproximate: false };
  }

  // For fiat currencies
  if (fullPrecision) {
    // Show full precision for fiat currencies
    // Use enough decimal places to show significant digits
    const absRate = Math.abs(rate);
    let decimalPlaces = 4; // Default precision
    
    if (absRate < 1) {
      const log10 = Math.log10(absRate);
      if (log10 < 0) {
        decimalPlaces = Math.ceil(-log10) + 4;
      }
    }
    
    decimalPlaces = Math.min(decimalPlaces, MAX_DECIMAL_PLACES);
    let formatted = rate.toFixed(decimalPlaces);
    formatted = formatted.replace(/\.?0+$/, '');
    return { formatted, isApproximate: false };
  } else {
    // Round to 2 decimal places (smallest denomination)
    const rounded = Math.round(rate * 100) / 100;
    const formatted = rounded.toFixed(2);
    const isApproximate = Math.abs(rate - rounded) > 0.0001;
    return { formatted, isApproximate };
  }
}

/**
 * Gets BTC or ETH price from cryptoMarket data.
 * @param cryptoMarket The crypto market snapshot from CoinGecko
 * @param coinId Either "btc" or "eth"
 * @returns The current price in the market's currency, or null if not found
 */
function getCryptoPrice(
  cryptoMarket: CryptoMarketSnapshot | undefined,
  coinId: "btc" | "eth"
): number | null {
  if (!cryptoMarket?.data || !Array.isArray(cryptoMarket.data)) {
    return null;
  }

  const coingeckoId = coinId === "btc" ? COINGECKO_BTC_ID : COINGECKO_ETH_ID;
  const coin = cryptoMarket.data.find((item) => item.id === coingeckoId);
  
  return coin?.current_price ?? null;
}

// =========================================================================
// COMPONENTS
// =========================================================================

/**
 * Renders a single row in the rates list.
 */
function RateRow({
  code,
  rate,
  isSelected,
  isCrypto,
  fullPrecision,
}: {
  code: SupportedCurrency | "btc" | "eth";
  rate: number;
  isSelected: boolean;
  isCrypto: boolean;
  fullPrecision: boolean;
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
  const { formatted: formattedRate } = formatRate(rate, isCrypto, fullPrecision);

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
          // Use 'cover' to ensure consistent sizing and fill the container
          resizeMode="cover"
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
  const { cryptoMarket } = useAppInitialization();
  const loadingTintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const backgroundSecondaryColor = useThemeColor({}, "backgroundSecondary");
  
  // Local state for currency selection (defaults to app preference, only fiat currencies)
  const [selectedCurrency, setSelectedCurrency] = React.useState<SupportedCurrency>(
    prefs?.currency || "usd"
  );
  const [showCurrencyModal, setShowCurrencyModal] = React.useState(false);
  const [fullPrecision, setFullPrecision] = React.useState(false);

  // Update selectedCurrency when prefs load
  React.useEffect(() => {
    if (prefs?.currency) {
      setSelectedCurrency(prefs.currency);
    }
  }, [prefs?.currency]);

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
    let rate: number;

    // For BTC and ETH, use prices from cryptoMarket API if available and currency matches
    if (isCrypto && cryptoMarket && cryptoMarket.currency === selectedCurrency) {
      const cryptoPrice = getCryptoPrice(cryptoMarket, code);
      if (cryptoPrice !== null && cryptoPrice > 0) {
        // cryptoPrice is the price of 1 BTC/ETH in the selected currency
        // We need to invert it: 1 unit of selected currency = 1/cryptoPrice BTC/ETH
        rate = 1 / cryptoPrice;
      } else {
        // Fallback to exchange rate calculation if cryptoMarket data not available
        rate = calculateRelativeRate(selectedCurrency, code, ratesData.rates);
      }
    } else {
      // For fiat currencies or if cryptoMarket currency doesn't match, calculate relative rate
      rate = calculateRelativeRate(selectedCurrency, code, ratesData.rates);
    }

    return {
      id: code,
      code: code,
      rate: rate,
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

        {/* Currency Selector and Precision Toggle - Single Row */}
        <ThemedView style={styles.controlsContainer}>
          {/* Currency Dropdown */}
          <Pressable
            onPress={() => setShowCurrencyModal(true)}
            style={({ pressed }) => [
              styles.currencySelector,
              { 
                borderColor: borderColor,
                backgroundColor: backgroundSecondaryColor,
              },
              pressed && styles.currencySelectorPressed,
            ]}
          >
            <ThemedView style={styles.currencySelectorContent}>
              <ThemedText type="bodySemibold" style={styles.currencySelectorText} numberOfLines={1}>
                1 {CURRENCY_SYMBOLS[selectedCurrency]} {selectedCurrency.toUpperCase()}
              </ThemedText>
              <ThemedText type="small" variant="secondary" numberOfLines={1}>
                {CURRENCY_DISPLAY_NAMES[selectedCurrency]}
              </ThemedText>
            </ThemedView>
            <ThemedText type="small" variant="secondary" style={styles.dropdownArrow}>
              ▼
            </ThemedText>
          </Pressable>

          {/* Precision Toggle - Compact */}
          <ThemedView style={[
            styles.precisionToggle,
            {
              borderColor: borderColor,
              backgroundColor: backgroundSecondaryColor,
            }
          ]}>
            <ThemedText type="small" variant="secondary" style={styles.precisionLabel}>
              Precision
            </ThemedText>
            <Switch
              value={fullPrecision}
              onValueChange={setFullPrecision}
              trackColor={{ false: borderColor, true: tintColor }}
              thumbColor={backgroundColor}
            />
          </ThemedView>
        </ThemedView>

        {/* Currency Selection Modal */}
        <Modal
          visible={showCurrencyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowCurrencyModal(false)}
          >
            <ThemedView style={[
              styles.modalContent,
              { backgroundColor: backgroundColor }
            ]}>
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
                        setSelectedCurrency(currencyCode);
                        setShowCurrencyModal(false);
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
                fullPrecision={fullPrecision}
              />
            )}
            scrollEnabled={false}
          />
        </ThemedView>

        <ThemedText type="small" variant="secondary" style={styles.footerNote}>
          Base currency is {ratesData.base}, cached locally for 24 hours. Last
          updated: {new Date(ratesData.timestamp).toLocaleTimeString()}
        </ThemedText>
        <ThemedText type="small" variant="secondary" style={styles.footerNote}>
          {fullPrecision 
            ? "Fiat currency rates show full precision. Cryptocurrency rates (BTC, ETH) always show full precision."
            : "Fiat currency rates are rounded to the smallest currency denomination. Cryptocurrency rates (BTC, ETH) show full precision without rounding."}
        </ThemedText>
      </ScreenContainer>
    </SafeAreaView>
  );
}

// =========================================================================
// STYLES
// =========================================================================
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
  controlsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  currencySelector: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 1,
    minHeight: 56, // Ensure consistent height
  },
  currencySelectorPressed: {
    opacity: 0.7,
  },
  currencySelectorContent: {
    flex: 1,
  },
  currencySelectorText: {
    marginBottom: 2,
  },
  dropdownArrow: {
    marginLeft: Spacing.xs,
    fontSize: 10,
  },
  precisionToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 1,
    minHeight: 56, // Match currency selector height
  },
  precisionLabel: {
    marginRight: Spacing.xs,
  },
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