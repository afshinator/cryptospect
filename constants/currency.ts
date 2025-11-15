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
