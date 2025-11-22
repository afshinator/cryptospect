// utils/clearNetworkData.ts

/**
 * Utility function to clear all network data from storage.
 * 
 * This clears:
 * - Crypto Market Data (CryptoMarketSnapshot)
 * - Crypto Overview Data (CryptoOverviewSnapshot)
 * - Exchange Rates (ExchangeRates)
 * - Stablecoin Data (StablecoinData)
 * - Saved Outlier Coins (SavedOutlierCoins)
 * 
 * This does NOT clear:
 * - Coin Lists (CoinLists) - preserved as requested
 * - User Preferences (Settings) - preserved to maintain user settings
 */

import {
  CRYPTO_MARKET_CACHE_KEY,
  CRYPTO_OVERVIEW_CACHE_KEY,
  EXCHANGE_RATE_CACHE_KEY,
  STABLECOIN_DATA_CACHE_KEY,
  SAVED_OUTLIER_COINS_CACHE_KEY,
} from '@/constants/misc';
import { removeItem } from '@/utils/asyncStorage';
import { logger } from '@/utils/logger';

/**
 * Clears all network data from storage (except coin lists and preferences).
 * @returns Promise that resolves when all data is cleared
 */
export async function clearNetworkData(): Promise<void> {
  logger('🗑️ [Clear Network Data] Starting network data wipe...', 'log', 'info');
  
  const keysToClear = [
    CRYPTO_MARKET_CACHE_KEY,
    CRYPTO_OVERVIEW_CACHE_KEY,
    EXCHANGE_RATE_CACHE_KEY,
    STABLECOIN_DATA_CACHE_KEY,
    SAVED_OUTLIER_COINS_CACHE_KEY,
  ];

  const clearedKeys: string[] = [];
  const failedKeys: string[] = [];

  for (const key of keysToClear) {
    try {
      await removeItem(key);
      clearedKeys.push(key);
      logger(`   └─ ✅ Cleared: ${key}`, 'log', 'info');
    } catch (error) {
      failedKeys.push(key);
      logger(`   └─ ❌ Failed to clear: ${key}`, 'error', undefined, error);
    }
  }

  logger(`🗑️ [Clear Network Data] Network data wipe complete:`, 'log', 'info');
  logger(`   └─ Cleared: ${clearedKeys.length} keys`, 'log', 'info');
  logger(`   └─ Failed: ${failedKeys.length} keys`, failedKeys.length > 0 ? 'warn' : 'log', 'info');
  
  if (failedKeys.length > 0) {
    logger(`   └─ Failed keys: ${failedKeys.join(', ')}`, 'warn');
  }
}

