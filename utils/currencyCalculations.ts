// utils/currencyCalculations.ts

import { CryptoMarketSnapshot } from "@/constants/coinGecko";
import { ExchangeRateCache, SupportedCurrency } from "@/constants/currency";

// Crypto Coin IDs from CoinGecko API
const COINGECKO_BTC_ID = "bitcoin";
const COINGECKO_ETH_ID = "ethereum";

/**
 * Calculates the exchange rate of a target currency relative to a selected base currency.
 * This is a shared utility used by both the rates screen and currency banner.
 * 
 * @param selectedCurrency The user's preferred currency (the new base, e.g., NGN).
 * @param targetCurrency The currency to convert to (e.g., USD).
 * @param rates The USD-based exchange rates object from the API.
 * @returns The converted rate (how many units of targetCurrency equal 1 unit of selectedCurrency).
 */
export function calculateRelativeRate(
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
 * Gets BTC or ETH price from cryptoMarket data.
 * @param cryptoMarket The crypto market snapshot from CoinGecko
 * @param coinId Either "btc" or "eth"
 * @returns The current price in the market's currency, or null if not found
 */
export function getCryptoPrice(
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

