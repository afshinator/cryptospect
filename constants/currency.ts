// constants/currency.ts

/**
 * Supported currency codes for CoinGecko API
 */
export type CurrencyCode = 
  | 'usd' | 'aed' | 'ars' | 'aud' | 'bdt' | 'bhd' | 'bmd' | 'brl' | 'cad' 
  | 'chf' | 'clp' | 'cny' | 'czk' | 'dkk' | 'eur' | 'gbp' | 'gel' | 'hkd' 
  | 'huf' | 'idr' | 'ils' | 'inr' | 'jpy' | 'krw' | 'kwd' | 'lkr' | 'mmk' 
  | 'mxn' | 'myr' | 'ngn' | 'nok' | 'nzd' | 'php' | 'pkr' | 'pln' | 'rub' 
  | 'sar' | 'sek' | 'sgd' | 'thb' | 'try' | 'twd' | 'uah' | 'vef' | 'vnd' 
  | 'zar' | 'xdr' | 'xag' | 'xau' | 'btc' | 'eth' | 'ltc' | 'bch' | 'bnb' 
  | 'eos' | 'xrp' | 'xlm' | 'link' | 'dot' | 'yfi';

/**
 * Default currency used throughout the app
 */
export const DEFAULT_CURRENCY: CurrencyCode = 'usd';

/**
 * Popular fiat currencies to show at the top of currency pickers
 */
export const POPULAR_FIAT_CURRENCIES: CurrencyCode[] = [
  'usd', 'eur', 'gbp', 'jpy', 'cny', 'inr', 'aud', 'cad'
];

/**
 * All supported fiat currencies
 */
export const ALL_FIAT_CURRENCIES: CurrencyCode[] = [
  'usd', 'aed', 'ars', 'aud', 'bdt', 'bhd', 'bmd', 'brl', 'cad',
  'chf', 'clp', 'cny', 'czk', 'dkk', 'eur', 'gbp', 'gel', 'hkd',
  'huf', 'idr', 'ils', 'inr', 'jpy', 'krw', 'kwd', 'lkr', 'mmk',
  'mxn', 'myr', 'ngn', 'nok', 'nzd', 'php', 'pkr', 'pln', 'rub',
  'sar', 'sek', 'sgd', 'thb', 'try', 'twd', 'uah', 'vef', 'vnd',
  'zar', 'xdr', 'xag', 'xau'
];

/**
 * All supported cryptocurrency currencies
 */
export const ALL_CRYPTO_CURRENCIES: CurrencyCode[] = [
  'btc', 'eth', 'ltc', 'bch', 'bnb', 'eos', 'xrp', 'xlm', 'link', 'dot', 'yfi'
];

/**
 * All supported currencies (fiat + crypto)
 */
export const ALL_CURRENCIES: CurrencyCode[] = [
  ...ALL_FIAT_CURRENCIES,
  ...ALL_CRYPTO_CURRENCIES
];

/**
 * List of cryptocurrency codes (used to distinguish from fiat currencies)
 */
const CRYPTO_CURRENCIES = ['btc', 'eth', 'ltc', 'bch', 'bnb', 'eos', 'xrp', 'xlm', 'link', 'dot', 'yfi'];

/**
 * Number formatting thresholds
 */
const TRILLION = 1e12;
const BILLION = 1e9;
const MILLION = 1e6;

/**
 * Formatting precision constants
 */
const FIAT_DECIMAL_PLACES = 2;
const CRYPTO_DECIMAL_PLACES = 8;

/**
 * Maps currency codes to their display symbols
 */
export const CURRENCY_SYMBOLS: { [key: string]: string } = {
  // Fiat currencies
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
  // Crypto currencies
  btc: '₿',
  eth: 'Ξ',
  ltc: 'Ł',
  bch: 'BCH',
  bnb: 'BNB',
  xrp: 'XRP',
};