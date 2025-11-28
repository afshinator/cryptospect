// constants/currency.ts

export const EXCHANGE_RATE_API_BASE_URL = 'https://open.er-api.com/v6/latest/USD'
// Refresh interval moved to constants/apiConfig.ts - re-exported for backward compatibility
export { EXCHANGE_RATES_REFRESH_INTERVAL_MS as DAILY_REFRESH_INTERVAL_MS } from './apiConfig';

export interface ExchangeRateCache {
  timestamp: number;
  rates: { [key: string]: number };
  base: string;
}

export type CurrencyCode = 
  // Fiat Currencies
  | 'usd' // United States Dollar
  | 'aed' // United Arab Emirates Dirham
  | 'ars' // Argentine Peso
  | 'aud' // Australian Dollar
  | 'bdt' // Bangladeshi Taka
  | 'bhd' // Bahraini Dinar
  | 'bmd' // Bermudian Dollar
  | 'brl' // Brazilian Real
  | 'cad' // Canadian Dollar
  | 'chf' // Swiss Franc
  | 'clp' // Chilean Peso
  | 'cny' // Chinese Yuan
  | 'czk' // Czech Koruna
  | 'dkk' // Danish Krone
  | 'eur' // Euro (European Union)
  | 'gbp' // British Pound (United Kingdom)
  | 'gel' // Georgian Lari
  | 'hkd' // Hong Kong Dollar
  | 'huf' // Hungarian Forint
  | 'idr' // Indonesian Rupiah
  | 'ils' // Israeli Shekel
  | 'inr' // Indian Rupee
  | 'jpy' // Japanese Yen
  | 'krw' // South Korean Won
  | 'kwd' // Kuwaiti Dinar
  | 'lkr' // Sri Lankan Rupee
  | 'mmk' // Myanmar Kyat
  | 'mxn' // Mexican Peso
  | 'myr' // Malaysian Ringgit
  | 'ngn' // Nigerian Naira
  | 'nok' // Norwegian Krone
  | 'nzd' // New Zealand Dollar
  | 'php' // Philippine Peso
  | 'pkr' // Pakistani Rupee
  | 'pln' // Polish Zloty
  | 'rub' // Russian Ruble
  | 'sar' // Saudi Riyal
  | 'sek' // Swedish Krona
  | 'sgd' // Singapore Dollar
  | 'thb' // Thai Baht
  | 'try' // Turkish Lira
  | 'twd' // New Taiwan Dollar
  | 'uah' // Ukrainian Hryvnia
  | 'vef' // Venezuelan Bolívar
  | 'vnd' // Vietnamese Dong
  | 'zar' // South African Rand
  // Special Drawing Rights & Precious Metals
  | 'xdr' // Special Drawing Rights (IMF)
  | 'xag' // Silver (troy ounce)
  | 'xau' // Gold (troy ounce)
  // Cryptocurrencies
  | 'btc' // Bitcoin
  | 'eth' // Ethereum
  | 'ltc' // Litecoin
  | 'bch' // Bitcoin Cash
  | 'bnb' // Binance Coin
  | 'eos' // EOS
  | 'xrp' // Ripple (XRP)
  | 'xlm' // Stellar (XLM)
  | 'link' // Chainlink (LINK)
  | 'dot' // Polkadot (DOT)
  | 'yfi'; // Yearn.finance (YFI)


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
  | 'brl' // Brazilian Real
  | 'chf' // Swiss Franc
  | 'hkd' // Hong Kong Dollar
  | 'krw' // South Korean Won
  | 'php' // Philippine Peso
  | 'pkr' // Pakistani Rupee
  | 'rub' // Russian Ruble
  | 'zar' // South African Rand


export const DEFAULT_CURRENCY: SupportedCurrency = 'usd';

/**
 * The array of currency codes to display in the exchange rates list.
 * Includes all fiat SupportedCurrency plus major crypto assets.
 */
export const DISPLAY_CURRENCIES: (SupportedCurrency | 'btc' | 'eth')[] = [
  'usd', 'eur', 'gbp', 'jpy', 'cny', 'inr', 'aud', 'cad', 'ngn', 'try',
  'brl', 'chf', 'hkd', 'krw', 'php', 'pkr', 'rub', 'zar',
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
  brl: 'Brazilian Real',
  chf: 'Swiss Franc',
  hkd: 'Hong Kong Dollar',
  krw: 'South Korean Won',
  php: 'Philippine Peso',
  pkr: 'Pakistani Rupee',
  rub: 'Russian Ruble',
  zar: 'South African Rand',
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
  brl: 'https://flagcdn.com/w160/br.png',
  chf: 'https://flagcdn.com/w160/ch.png',
  hkd: 'https://flagcdn.com/w160/hk.png',
  krw: 'https://flagcdn.com/w160/kr.png',
  php: 'https://flagcdn.com/w160/ph.png',
  pkr: 'https://flagcdn.com/w160/pk.png',
  rub: 'https://flagcdn.com/w160/ru.png',
  zar: 'https://flagcdn.com/w160/za.png',
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
