// constants/currency.ts

export const EXCHANGE_RATE_API_BASE_URL = 'https://open.er-api.com/v6/latest/USD'
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
 * Uses flagcdn.com for fiat flags (consistent w160 size) and CoinGecko for crypto icons.
 */
export const CURRENCY_FLAG_URLS: Partial<Record<CurrencyCode, string>> = {
  // Fiat currencies - using w160 for consistent sizing
  usd: 'https://flagcdn.com/w160/us.png',
  eur: 'https://flagcdn.com/w160/eu.png',
  gbp: 'https://flagcdn.com/w160/gb.png',
  jpy: 'https://flagcdn.com/w160/jp.png',
  cny: 'https://flagcdn.com/w160/cn.png',
  inr: 'https://flagcdn.com/w160/in.png',
  aud: 'https://flagcdn.com/w160/au.png',
  cad: 'https://flagcdn.com/w160/ca.png',
  ngn: 'https://flagcdn.com/w160/ng.png',
  try: 'https://flagcdn.com/w160/tr.png',
  // Crypto icons from CoinGecko
  btc: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  eth: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
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
