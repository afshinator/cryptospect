// utils/cryptoDominance.ts

import { CryptoMarketSnapshot, CryptoOverviewSnapshot } from '@/constants/coinGecko';
import { STABLECOIN_SYMBOLS } from '@/constants/coinTypes';
import { extractAndSaveStablecoinData } from './stablecoinStorage';

export interface DominanceData {
  btc: number;
  eth: number;
  others: number;
  stablecoins: number;
}

/**
 * Calculates crypto dominance percentages from overview and market data
 * @param cryptoOverview - The crypto overview snapshot from CoinGecko /global endpoint (for BTC/ETH percentages and total market cap)
 * @param cryptoMarket - Optional crypto market snapshot from CoinGecko /coins/markets endpoint (for more accurate stablecoin calculation)
 * @returns Dominance percentages for BTC, ETH, stablecoins, and others
 */
export function calculateDominance(
  cryptoOverview: CryptoOverviewSnapshot | undefined | null,
  cryptoMarket?: CryptoMarketSnapshot | undefined | null
): DominanceData | null {
  if (!cryptoOverview?.data?.data?.market_cap_percentage) {
    return null;
  }

  const dominanceData = cryptoOverview.data.data.market_cap_percentage;
  const totalMarketCap = cryptoOverview.data.data.total_market_cap?.usd || 0;

  // 🔍 DEBUG: Log the raw data from CoinGecko
  console.log('🔍 Raw dominance data from CoinGecko:', dominanceData);
  console.log('🔍 Data timestamp:', new Date(cryptoOverview.timestamp).toLocaleString());

  const btc = dominanceData.btc || 0;
  const eth = dominanceData.eth || 0;

  let stablecoins = 0;
  const foundStablecoins: string[] = [];
  const missingStablecoins: string[] = [];

  // If we have market data, calculate stablecoins from individual coin market caps (more accurate)
  if (cryptoMarket?.data && totalMarketCap > 0) {
    let stablecoinMarketCap = 0;
    const stablecoinSymbolsLower = new Set(Array.from(STABLECOIN_SYMBOLS).map(s => s.toLowerCase()));

    for (const coin of cryptoMarket.data) {
      if (coin.market_cap && coin.symbol && stablecoinSymbolsLower.has(coin.symbol.toLowerCase())) {
        stablecoinMarketCap += coin.market_cap;
        if (!foundStablecoins.includes(coin.symbol.toLowerCase())) {
          foundStablecoins.push(coin.symbol.toLowerCase());
        }
      }
    }

    // Calculate percentage from total market cap
    stablecoins = (stablecoinMarketCap / totalMarketCap) * 100;

    // Track which stablecoins from our list weren't found
    for (const symbol of STABLECOIN_SYMBOLS) {
      if (!foundStablecoins.includes(symbol.toLowerCase())) {
        missingStablecoins.push(symbol);
      }
    }

    console.log(`🔍💲 Using market data: Stablecoins found (${foundStablecoins.length}/${STABLECOIN_SYMBOLS.size}):`, foundStablecoins);
    console.log(`🔍💲 Stablecoin market cap: $${stablecoinMarketCap.toLocaleString()}, Total: $${totalMarketCap.toLocaleString()}, Percentage: ${stablecoins.toFixed(2)}%`);

    // Save stablecoin data for widget
    extractAndSaveStablecoinData(
      cryptoMarket,
      totalMarketCap,
      stablecoins,
      foundStablecoins,
      missingStablecoins,
      'market_data'
    ).catch(err => {
      console.error('❌💲Failed to save stablecoin data:', err);
    });
  } else {
    // Fallback to overview data (only top coins)
    for (const symbol of STABLECOIN_SYMBOLS) {
      const percentage = dominanceData[symbol.toLowerCase()];
      if (percentage !== undefined && percentage > 0) {
        stablecoins += percentage;
        foundStablecoins.push(symbol);
      } else {
        missingStablecoins.push(symbol);
      }
    }

    console.log(`🔍💲 Using overview data: Stablecoins found (${foundStablecoins.length}/${STABLECOIN_SYMBOLS.size}):`, foundStablecoins);

    // Save stablecoin data for widget (even with overview data)
    extractAndSaveStablecoinData(
      cryptoMarket,
      totalMarketCap,
      stablecoins,
      foundStablecoins,
      missingStablecoins,
      'overview_data'
    ).catch(err => {
      console.error('❌💲Failed to save stablecoin data:', err);
    });
  }

  if (missingStablecoins.length > 0) {
    console.log(`🔍💲 Stablecoins not in data (${missingStablecoins.length}):`, missingStablecoins);
  }

  // Calculate others (everything else)
  const others = Math.max(0, 100 - btc - eth - stablecoins);

  return {
    btc: Number(btc.toFixed(2)),
    eth: Number(eth.toFixed(2)),
    stablecoins: Number(stablecoins.toFixed(2)),
    others: Number(others.toFixed(2)),
  };
}

/**
 * Formats dominance percentage for display
 * @param value - The dominance percentage
 * @returns Formatted string (e.g., "54.32%")
 */
export function formatDominance(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Gets a short label for dominance type
 */
export function getDominanceLabel(type: keyof DominanceData): string {
  const labels = {
    btc: 'BTC.D',
    eth: 'ETH.D',
    stablecoins: 'STABLE.D',
    others: 'OTHERS.D',
  };
  return labels[type];
}