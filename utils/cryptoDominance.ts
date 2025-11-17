// utils/cryptoDominance.ts

import { CryptoOverviewSnapshot } from '@/constants/coinGecko';

export interface DominanceData {
  btc: number;
  eth: number;
  others: number;
  stablecoins: number;
}

/**
 * Calculates crypto dominance percentages from overview data
 * @param cryptoOverview - The crypto overview snapshot from CoinGecko /global endpoint
 * @returns Dominance percentages for BTC, ETH, stablecoins, and others
 */
export function calculateDominance(
  cryptoOverview: CryptoOverviewSnapshot | undefined | null
): DominanceData | null {
  if (!cryptoOverview?.data?.data?.market_cap_percentage) {
    return null;
  }

  const dominanceData = cryptoOverview.data.data.market_cap_percentage;

  // 🔍 DEBUG: Log the raw data from CoinGecko
  console.log('🔍 Raw dominance data from CoinGecko:', dominanceData);
  console.log('🔍 Data timestamp:', new Date(cryptoOverview.timestamp).toLocaleString());

  const btc = dominanceData.btc || 0;
  const eth = dominanceData.eth || 0;

  // Common stablecoins
  const usdt = dominanceData.usdt || 0;
  const usdc = dominanceData.usdc || 0;
  const busd = dominanceData.busd || 0;
  const dai = dominanceData.dai || 0;
  const stablecoins = usdt + usdc + busd + dai;

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
  return `${value.toFixed(2)}%`;
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