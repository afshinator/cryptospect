// hooks/use-rates-data.ts

import { CryptoMarketSnapshot } from "@/constants/coinGecko";
import { DISPLAY_CURRENCIES, ExchangeRateCache, SupportedCurrency } from "@/constants/currency";
import { calculateRelativeRate, getCryptoPrice } from "@/utils/currencyCalculations";
import { useMemo } from "react";

export interface RateDataItem {
  id: string;
  code: SupportedCurrency | "btc" | "eth";
  rate: number;
  isSelected: boolean;
  isCrypto: boolean;
}

/**
 * Prepares and sorts rate data for display in the rates screen.
 * Handles all the data transformation logic:
 * - Maps currencies to rate objects
 * - Calculates rates (using cryptoMarket for BTC/ETH when available)
 * - Filters out the selected base currency
 * - Sorts fiat currencies alphabetically
 * - Combines fiat and crypto currencies
 */
export function useRatesData(
  selectedCurrency: SupportedCurrency,
  ratesData: ExchangeRateCache | null | undefined,
  cryptoMarket: CryptoMarketSnapshot | undefined
): RateDataItem[] {
  return useMemo(() => {
    if (!ratesData?.rates) {
      return [];
    }

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
    return [...fiatCurrencies, ...cryptoCurrencies];
  }, [selectedCurrency, ratesData, cryptoMarket]);
}

