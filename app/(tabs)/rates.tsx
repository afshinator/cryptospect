// app/(tabs)/rates.tsx

import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CurrencySelectorModal } from "@/components/CurrencySelectorModal";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { MAX_ROW_WIDTH, RateRow } from "@/components/RateRow";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CURRENCY_DISPLAY_NAMES, CURRENCY_SYMBOLS, SupportedCurrency } from "@/constants/currency";
import { Spacing } from "@/constants/theme";
import { useAppInitialization } from "@/hooks/use-app-initializations";
import { useExchangeRates } from "@/hooks/use-exchange-rates";
import { usePreferences } from "@/hooks/use-preference";
import { useRatesData } from "@/hooks/use-rates-data";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function RatesScreen() {
  const { data: prefs, isPending: isPrefsPending } = usePreferences();
  const {
    data: ratesData,
    isLoading: isRatesLoading,
    error,
  } = useExchangeRates();
  const { cryptoMarket } = useAppInitialization();

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

  // Prepare rates data using custom hook
  const dataForList = useRatesData(selectedCurrency, ratesData, cryptoMarket);

  // Guard Clauses for Loading/Error
  if (isPrefsPending || isRatesLoading || !prefs) {
    return <LoadingState message="Loading exchange rates..." />;
  }

  if (error || !ratesData || !ratesData.rates) {
    return (
      <ErrorState
        title="Failed to load exchange rates."
        message={`Base currency: ${ratesData?.base || "N/A"}`}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]} edges={["top"]}>
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
            <ThemedText type="xsmall" variant="secondary" style={styles.dropdownArrow}>
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
        <CurrencySelectorModal
          visible={showCurrencyModal}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
          onClose={() => setShowCurrencyModal(false)}
        />

        {/* Rates List Container - Constrained and centered */}
        <ThemedView style={styles.listContainer}>
          <FlatList
            data={dataForList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RateRow
                code={item.code}
                rate={item.rate}
                isSelected={item.isSelected}
                isCrypto={item.isCrypto}
                fullPrecision={fullPrecision}
              />
            )}
            scrollEnabled={false}
          />
        </ThemedView>

        <ThemedView style={styles.footerNote}>
          <ThemedText style={styles.centered}>
            Base currency is {ratesData.base}, cached 24 hours.
          </ThemedText>
          <ThemedText style={styles.centered}>Last updated: {new Date(ratesData.timestamp).toLocaleTimeString()}</ThemedText>
          <ThemedText style={styles.centered}>
            {fullPrecision
              ? "Fiat currency rates show full precision. "
              : "Fiat currency rates are rounded to the smallest currency denomination."}
          </ThemedText>
          <ThemedText style={styles.centered}>
            {fullPrecision
              ? "Cryptocurrency rates (BTC, ETH) always show full precision."
              : "Cryptocurrency rates (BTC, ETH) show full precision without rounding."}
          </ThemedText>
        </ThemedView>
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: "center",
  },
  container: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  listContainer: {
    width: "100%",
    maxWidth: MAX_ROW_WIDTH,
    alignSelf: "center",
  },
  footerNote: {
    padding: Spacing.sm,
    borderRadius: Spacing.sm,
    marginTop: Spacing.lg,
  },
  controlsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  currencySelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
    borderWidth: 1,
    minHeight: 56,
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
    minHeight: 56,
  },
  precisionLabel: {
    marginRight: Spacing.xs,
  },
});
