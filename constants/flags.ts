import { SupportedCurrency } from './currency';

/**
 * Maps currency codes to external PNG flag image URLs.
 * Source: Flagpedia or similar public CDN. These URLs are stable but require an internet connection.
 * We include placeholder icons for cryptocurrencies.
 */
export const CURRENCY_FLAG_URLS: Record<SupportedCurrency, string> = {
  // Fiat Currencies (sourced from Flagpedia or similar country-code based asset repository)
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
  
  // Crypto Placeholders (using icons for contrast)
  // You will likely replace these with custom, locally bundled assets later.
  btc: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.17.2/svg/color/btc.svg',
  eth: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.17.2/svg/color/eth.svg',
};