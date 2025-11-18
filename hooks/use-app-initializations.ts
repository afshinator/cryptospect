import {
  DEFAULT_CURRENCY,
  EXCHANGE_RATES_QUERY_KEY,
} from "@/constants/currency";
import {
  CRYPTO_MARKET_QUERY_KEY,
  CRYPTO_MARKET_REFRESH_INTERVAL_MS,
  CRYPTO_OVERVIEW_QUERY_KEY,
  CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS
} from "@/constants/misc";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePreferences } from "@/hooks/use-preference";
import { getCryptoMarket } from "@/utils/coinGeckoApi";
import { getCryptoOverview } from "@/utils/coinGeckoOverviewApi";
import { getExchangeRates } from "@/utils/currencyApi";
import { useQuery } from "@tanstack/react-query";

/**
 * Centralized app initialization logic.
 * Handles all data fetching for app startup: preferences, exchange rates, crypto market data, and crypto overview.
 * * @returns Object containing all initialization state and data
 */
export function useAppInitialization() {
  // 1. Fetch User Preferences (blocking dependency)
  const { data: prefs, isPending: isPrefsPending } = usePreferences();

  // 2. Fetch Exchange Rates (non-blocking)
  const { data: rates, isPending: isRatesPending } = useQuery({
    queryKey: EXCHANGE_RATES_QUERY_KEY,
    queryFn: getExchangeRates,
    staleTime: 0,
  });

  // 3. Fetch Crypto Market Data (non-blocking, enabled only after prefs load)
  const { data: cryptoMarket, isPending: isCryptoMarketPending } = useQuery({
    queryKey: [...CRYPTO_MARKET_QUERY_KEY, prefs?.currency],
    queryFn: () => getCryptoMarket(prefs?.currency || DEFAULT_CURRENCY),
    staleTime: 0,
    enabled: !!prefs,
    refetchInterval: CRYPTO_MARKET_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  // 4. Fetch Crypto Overview Data (non-blocking, for current dominance)
  const { data: cryptoOverview, isPending: isCryptoOverviewPending } = useQuery(
    {
      queryKey: CRYPTO_OVERVIEW_QUERY_KEY,
      queryFn: getCryptoOverview,
      staleTime: 0,
      refetchInterval: CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS,
      refetchOnWindowFocus: true,
    }
  );

  const resolvedColorScheme = useColorScheme();

  return {
    // Preferences
    prefs,
    isPrefsPending,

    // Exchange Rates
    rates,
    isRatesPending,

    // Crypto Market Data
    cryptoMarket,
    isCryptoMarketPending,

    // Crypto Overview Data
    cryptoOverview,
    isCryptoOverviewPending,

    // Theme
    resolvedColorScheme,

    // Computed state
    isReady: !isPrefsPending && !!prefs,
  };
}
