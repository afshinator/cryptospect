// hooks/use-app-initialization.ts

import { DEFAULT_CURRENCY, EXCHANGE_RATES_QUERY_KEY } from "@/constants/currency";
import { MARKET_DATA_QUERY_KEY, MARKET_DATA_REFRESH_INTERVAL_MS } from "@/constants/misc";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePreferences } from "@/hooks/use-preference";
import { getMarketData } from "@/utils/coinGeckoApi";
import { getExchangeRates } from "@/utils/currencyApi";
import { useQuery } from "@tanstack/react-query";

/**
 * Centralized app initialization logic.
 * Handles all data fetching for app startup: preferences, exchange rates, and market data.
 * 
 * @returns Object containing all initialization state and data
 */
export function useAppInitialization() {
  // 1. Fetch User Preferences (blocking dependency)
  const { data: prefs, isPending: isPrefsPending } = usePreferences();
  
  // 2. Fetch Exchange Rates (non-blocking)
  const { 
    data: rates, 
    isPending: isRatesPending 
  } = useQuery({
    queryKey: EXCHANGE_RATES_QUERY_KEY,
    queryFn: getExchangeRates,
    staleTime: 0,
  });

  // 3. Fetch Market Data (non-blocking, enabled only after prefs load)
  const { 
    data: marketData, 
    isPending: isMarketDataPending 
  } = useQuery({
    queryKey: [...MARKET_DATA_QUERY_KEY, prefs?.currency],
    queryFn: () => getMarketData(prefs?.currency || DEFAULT_CURRENCY),
    staleTime: 0,
    enabled: !!prefs,
    refetchInterval: MARKET_DATA_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const resolvedColorScheme = useColorScheme();

  return {
    // Preferences
    prefs,
    isPrefsPending,
    
    // Exchange Rates
    rates,
    isRatesPending,
    
    // Market Data
    marketData,
    isMarketDataPending,
    
    // Theme
    resolvedColorScheme,
    
    // Computed state
    isReady: !isPrefsPending && !!prefs,
  };
}