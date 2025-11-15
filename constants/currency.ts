export const EXCHANGE_RATE_API_BASE_URL = 'https://open.er-api.com/v6/latest/USD'
export const EXCHANGE_RATE_CACHE_KEY = 'ExchangeRates';
export const EXCHANGE_RATES_QUERY_KEY = ['exchangeRates']; // TanStack Query Key
export const DAILY_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface ExchangeRateCache {
  timestamp: number;
  rates: { [key: string]: number };
  base: string;
}

export type CurrencyCode = 
  | 'usd' | 'aed' | 'ars' | 'aud' | 'bdt' | 'bhd' | 'bmd' | 'brl' | 'cad' 
  | 'chf' | 'clp' | 'cny' | 'czk' | 'dkk' | 'eur' | 'gbp' | 'gel' | 'hkd' 
  | 'huf' | 'idr' | 'ils' | 'inr' | 'jpy' | 'krw' | 'kwd' | 'lkr' | 'mmk' 
  | 'mxn' | 'myr' | 'ngn' | 'nok' | 'nzd' | 'php' | 'pkr' | 'pln' | 'rub' 
  | 'sar' | 'sek' | 'sgd' | 'thb' | 'try' | 'twd' | 'uah' | 'vef' | 'vnd' 
  | 'zar' | 'xdr' | 'xag' | 'xau' | 'btc' | 'eth' | 'ltc' | 'bch' | 'bnb' 
  | 'eos' | 'xrp' | 'xlm' | 'link' | 'dot' | 'yfi';


export type SupportedCurrency = 
  | 'usd' // US Dollar
  | 'eur' // Euro
  | 'gbp' // British Pound
  | 'jpy' // Japanese Yen
  | 'cny' // Chinese Yuan
  | 'inr' // Indian Rupee
  | 'aud' // Australian Dollar
  | 'cad' // Canadian Dollar
  | 'ngn' // Nigerian Naira
  | 'try' // Turkish Lira


export const DEFAULT_CURRENCY: SupportedCurrency = 'usd';

/**
 * The array of currency codes to display in the exchange rates list.
 * Includes all fiat SupportedCurrency plus major crypto assets.
 */
export const DISPLAY_CURRENCIES: (SupportedCurrency | 'btc' | 'eth')[] = [
  'usd', 'eur', 'gbp', 'jpy', 'cny', 'inr', 'aud', 'cad', 'ngn', 'try',
  'btc', // Bitcoin (Crypto)
  'eth', // Ethereum (Crypto)
];


export const CURRENCY_DISPLAY_NAMES: Record<SupportedCurrency, string> = {
  usd: 'US Dollar',
  eur: 'Euro',
  gbp: 'British Pound',
  jpy: 'Japanese Yen',
  cny: 'Chinese Yuan',
  inr: 'Indian Rupee',
  aud: 'Australian Dollar',
  cad: 'Canadian Dollar',
  ngn: 'Nigerian Naira',
  try: 'Turkish Lira',
};

/**
 * Map of flag/icon URLs for displayed currencies.
 * Uses a placeholder service for fiat flags and a simple graphic for crypto.
 */
export const CURRENCY_FLAG_URLS: Partial<Record<CurrencyCode, string>> = {
  usd: 'https://flagcdn.com/w320/us.png',
  eur: 'https://flagcdn.com/w320/eu.png',
  gbp: 'https://flagcdn.com/w320/gb.png',
  jpy: 'https://flagcdn.com/w320/jp.png',
  cny: 'https://flagcdn.com/w320/cn.png',
  inr: 'https://flagcdn.com/w320/in.png',
  aud: 'https://flagcdn.com/w320/au.png',
  cad: 'https://flagcdn.com/w320/ca.png',
  ngn: 'https://flagcdn.com/w320/ng.png',
  try: 'https://flagcdn.com/w320/tr.png',
  // Placeholders for Crypto
  btc: 'https://placehold.co/60x60/FF9900/ffffff/png?text=B', 
  eth: 'https://placehold.co/60x60/627EEA/ffffff/png?text=E',
};

const TRILLION = 1e12;
const BILLION = 1e9;
const MILLION = 1e6;

export const FIAT_DECIMAL_PLACES = 2;
export const CRYPTO_DECIMAL_PLACES = 8;

export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  usd: '$',
  eur: '€',
  gbp: '£',
  jpy: '¥',
  cny: '¥',
  krw: '₩',
  inr: '₹',
  rub: '₽',
  aud: 'A$',
  cad: 'C$',
  chf: 'CHF',
  brl: 'R$',
  mxn: 'MX$',
  zar: 'R',
  ngn: '₦',
  try: '₺',
  btc: '₿',
  eth: 'Ξ',
  ltc: 'Ł',
  bch: 'BCH',
  bnb: 'BNB',
  xrp: 'XRP',
};
