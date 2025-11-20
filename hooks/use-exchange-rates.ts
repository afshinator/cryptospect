import { useQuery, UseQueryResult } from '@tanstack/react-query';
 
import { ExchangeRateCache } from '@/constants/currency';
import { EXCHANGE_RATES_QUERY_KEY } from '@/constants/misc';
import { getExchangeRates } from '@/utils/currencyApi';

/**
 * Custom hook to fetch and manage currency exchange rates using TanStack Query.
 * * It uses a query function (`getExchangeRates`) that handles the complex logic 
 * of checking AsyncStorage cache freshness, fetching from the network if necessary,
 * and gracefully falling back to stale data on network failure.
 * * Setting `staleTime: 0` ensures that TanStack Query always runs `getExchangeRates`
 * on mount or focus, delegating the decision to actually fetch from the API to 
 * the internal logic of `getExchangeRates`.
 * * @returns UseQueryResult<ExchangeRateCache, Error>
 */
export function useExchangeRates(): UseQueryResult<ExchangeRateCache, Error> {
  return useQuery<ExchangeRateCache, Error>({
    queryKey: EXCHANGE_RATES_QUERY_KEY,
    queryFn: getExchangeRates,
    // Forces the queryFn to run on mount/refocus to check the cache timestamp
    staleTime: 0, 
    // Enable refetch on window focus to capture updates more reliably
    refetchOnWindowFocus: true, 
  });
}