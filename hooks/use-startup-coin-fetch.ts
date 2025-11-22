// hooks/use-startup-coin-fetch.ts

import { useEffect, useRef, useState } from 'react';
import { getCoinLists } from '@/utils/coinListStorage';
import { getCryptoMarket } from '@/utils/coinGeckoApi';
import { fetchCoinMarketData } from '@/utils/coinGeckoApi';
import { saveSearchedCoin } from '@/utils/searchedCoinsStorage';
import { useAppInitialization } from './use-app-initializations';
import { useCoinLists } from './use-coin-lists';
import { usePreferences } from './use-preference';
import { SupportedCurrency } from '@/constants/currency';

// --- CONFIGURATION CONSTANTS ---
const STARTUP_FETCH_DELAY_MS = 5000; // Wait 5 seconds after initial fetching completes
const FETCH_BATCH_DELAY_MS = 1000; // Delay between batches to avoid rate limits
const BATCH_SIZE = 5; // Number of coins to fetch in parallel per batch

interface StartupFetchState {
  isFetching: boolean;
  isComplete: boolean;
  totalCoins: number;
  fetchedCoins: number;
  failedCoins: number;
}

/**
 * Hook that handles background fetching of coin data for all coins in lists
 * that are not in the main CryptoMarketSnapshot.
 * 
 * This runs after app startup:
 * 1. Waits for all initial fetching to complete
 * 2. Waits X seconds (STARTUP_FETCH_DELAY_MS)
 * 3. Collects all coins from all lists
 * 4. Filters out coins already in CryptoMarketSnapshot
 * 5. Fetches data for remaining coins in batches
 */
export function useStartupCoinFetch() {
  const { cryptoMarket, isCryptoMarketPending, isRatesPending, isCryptoOverviewPending, isPrefsPending } = useAppInitialization();
  const { data: lists } = useCoinLists();
  const { data: preferences } = usePreferences();
  
  const [state, setState] = useState<StartupFetchState>({
    isFetching: false,
    isComplete: false,
    totalCoins: 0,
    fetchedCoins: 0,
    failedCoins: 0,
  });
  
  const hasStartedRef = useRef(false);
  const fetchedCoinIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Don't start if we've already started
    if (hasStartedRef.current) return;
    
    // Wait for all initial fetching to complete
    const isInitialFetchingComplete = 
      !isPrefsPending && 
      !isRatesPending && 
      !isCryptoMarketPending && 
      !isCryptoOverviewPending &&
      !!cryptoMarket?.data &&
      !!lists &&
      !!preferences;

    if (!isInitialFetchingComplete) {
      return;
    }

    // Mark as started to prevent duplicate runs
    hasStartedRef.current = true;

    // Wait for delay, then start fetching
    const delayTimer = setTimeout(async () => {
      console.log('🚀 Starting startup coin fetch...');
      
      try {
        // Get all coins from all lists
        const allLists = await getCoinLists();
        const allCoinIds = new Set<string>();
        
        allLists.forEach(list => {
          list.coins.forEach(coin => {
            allCoinIds.add(coin.coinId.toLowerCase());
          });
        });

        // Filter out coins that are already in CryptoMarketSnapshot
        const marketDataMap = new Set(
          cryptoMarket.data.map(coin => coin.id.toLowerCase())
        );
        
        const coinsToFetch = Array.from(allCoinIds).filter(
          coinId => !marketDataMap.has(coinId)
        );

        if (coinsToFetch.length === 0) {
          console.log('✅ No coins to fetch - all coins are in main cache');
          setState({
            isFetching: false,
            isComplete: true,
            totalCoins: 0,
            fetchedCoins: 0,
            failedCoins: 0,
          });
          return;
        }

        console.log(`📊 Found ${coinsToFetch.length} coins to fetch (out of ${allCoinIds.size} total)`);
        
        setState({
          isFetching: true,
          isComplete: false,
          totalCoins: coinsToFetch.length,
          fetchedCoins: 0,
          failedCoins: 0,
        });

        // Fetch coins in batches to avoid rate limits
        const currency = (preferences.currency || 'usd') as SupportedCurrency;
        let fetchedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < coinsToFetch.length; i += BATCH_SIZE) {
          const batch = coinsToFetch.slice(i, i + BATCH_SIZE);
          
          console.log(`📦 Fetching batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} coins)...`);
          
          // Fetch all coins in batch in parallel
          const batchPromises = batch.map(async (coinId) => {
            // Skip if already fetched
            if (fetchedCoinIdsRef.current.has(coinId)) {
              return { coinId, success: true, skipped: true };
            }

            try {
              const coinData = await fetchCoinMarketData(coinId, currency);
              
              if (coinData) {
                // Save to SearchedCoins storage
                await saveSearchedCoin(coinData);
                fetchedCoinIdsRef.current.add(coinId);
                return { coinId, success: true, skipped: false };
              } else {
                // Rate limit or other error - don't count as failure, just skip
                console.warn(`⚠️ No data returned for ${coinId} (likely rate limit)`);
                return { coinId, success: false, skipped: false };
              }
            } catch (error) {
              console.error(`❌ Error fetching ${coinId}:`, error);
              return { coinId, success: false, skipped: false };
            }
          });

          const results = await Promise.all(batchPromises);
          
          results.forEach(result => {
            if (result.success && !result.skipped) {
              fetchedCount++;
            } else if (!result.success && !result.skipped) {
              failedCount++;
            }
          });

          // Update state
          setState({
            isFetching: true,
            isComplete: false,
            totalCoins: coinsToFetch.length,
            fetchedCoins: fetchedCount,
            failedCoins: failedCount,
          });

          // Wait before next batch (except for last batch)
          if (i + BATCH_SIZE < coinsToFetch.length) {
            await new Promise(resolve => setTimeout(resolve, FETCH_BATCH_DELAY_MS));
          }
        }

        console.log(`✅ Startup coin fetch complete: ${fetchedCount} fetched, ${failedCount} failed`);
        
        setState({
          isFetching: false,
          isComplete: true,
          totalCoins: coinsToFetch.length,
          fetchedCoins: fetchedCount,
          failedCoins: failedCount,
        });
      } catch (error) {
        console.error('❌ Error in startup coin fetch:', error);
        setState(prev => ({
          ...prev,
          isFetching: false,
          isComplete: true,
        }));
      }
    }, STARTUP_FETCH_DELAY_MS);

    return () => {
      clearTimeout(delayTimer);
    };
  }, [
    isPrefsPending,
    isRatesPending,
    isCryptoMarketPending,
    isCryptoOverviewPending,
    cryptoMarket?.data,
    lists,
    preferences,
  ]);

  return state;
}

