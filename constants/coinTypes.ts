// constants/coinTypes.ts


// Types as-in category of crypto coin
export const STABLECOIN_SYMBOLS = new Set([
    'usdt',  // Tether
    'usdc',  // USD Coin
    'busd',  // Binance USD
    'dai',   // Dai
    'tusd',  // TrueUSD
    'usdp',  // Pax Dollar
    'usdd',  // USDD
    'gusd',  // Gemini Dollar
    'pyusd', // PayPal USD
    'fdusd', // First Digital USD
    'frax',  // Frax
    'lusd',  // Liquity USD
    'susd',  // sUSD
    'eurs',  // STASIS EURO
    'eurt',  // Tether EUR
    // Add more as needed
  ]);
  
  export function isStablecoin(symbol: string): boolean {
    return STABLECOIN_SYMBOLS.has(symbol.toLowerCase());
  }