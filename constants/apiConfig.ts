// constants/apiConfig.ts
/**
 * Centralized API Configuration
 * 
 * This file contains all timing constants, delays, refresh intervals, and rate limiting
 * configurations for API calls throughout the application.
 * 
 * All values are in milliseconds unless otherwise specified.
 */

// ============================================================================
// REFRESH INTERVALS - How often data is considered stale and needs refreshing
// ============================================================================

/** Exchange Rates API - Refresh interval (24 hours) */
export const EXCHANGE_RATES_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Crypto Market Data (CoinGecko /coins/markets) - Refresh interval (6 minutes) */
export const CRYPTO_MARKET_REFRESH_INTERVAL_MS = 6 * 60 * 1000; // 6 minutes

/** Crypto Overview Data (CoinGecko /global) - Refresh interval (5 minutes) */
export const CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/** Backend Historical Dominance - Refresh interval (24 hours, backend-side) */
export const BACKEND_DOMINANCE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// RATE LIMITING - Delays between API calls to respect rate limits
// ============================================================================

/**
 * Crypto Market Data Pagination
 * When fetching multiple pages of market data, delays are applied between requests
 */

/** Delay between each page request (1.2 seconds) */
export const MARKET_DATA_DELAY_BETWEEN_PAGES_MS = 1200; // 1.2 seconds

/** Longer delay applied after every N pages (10 seconds) */
export const MARKET_DATA_LONG_DELAY_MS = 10000; // 10 seconds

/** Number of pages to fetch before switching to longer delays for all subsequent pages */
export const MARKET_DATA_PAGES_BEFORE_LONG_DELAY = 2;

/** Maximum retry attempts for failed requests */
export const MARKET_DATA_MAX_RETRIES = 3;

/** Base retry delay when rate limited (60 seconds) */
export const MARKET_DATA_BASE_RETRY_DELAY_MS = 60000; // 60 seconds

/**
 * Crypto Overview Data Rate Limiting
 * When rate limited, wait before retrying
 */

/** Maximum retry attempts for overview data when rate limited */
export const OVERVIEW_DATA_MAX_RETRIES = 3;

/** Base retry delay when rate limited (60 seconds) */
export const OVERVIEW_DATA_BASE_RETRY_DELAY_MS = 60000; // 60 seconds

// ============================================================================
// STARTUP COIN FETCH - Background fetching of coins not in main cache
// ============================================================================

/**
 * Startup Coin Fetch Configuration
 * After app initialization, fetches data for coins in user lists that aren't in main cache
 */

/** Delay after initial fetching completes before starting startup fetch (5 seconds) */
export const STARTUP_FETCH_DELAY_MS = 5000; // 5 seconds

/** Delay between batches of coin fetches (1 second) */
export const STARTUP_FETCH_BATCH_DELAY_MS = 1000; // 1 second

/** Number of coins to fetch in parallel per batch */
export const STARTUP_FETCH_BATCH_SIZE = 5;

// ============================================================================
// SEARCH & USER INTERACTION - Debouncing and delays for user-triggered actions
// ============================================================================

/**
 * Coin Search (CoinGecko /search endpoint)
 * Debouncing prevents excessive API calls while user is typing
 */

/** Debounce delay for search input (500ms after user stops typing) */
export const SEARCH_DEBOUNCE_DELAY_MS = 500; // 500ms

/** Minimum query length before triggering API search */
export const SEARCH_MIN_QUERY_LENGTH = 2;

/**
 * UI Interaction Delays
 * Small delays for better UX (modal rendering, async operations)
 */

/** Delay for async storage operations to complete (100ms) */
export const ASYNC_STORAGE_OPERATION_DELAY_MS = 100; // 100ms

/** Delay for modal to fully render before focusing input (iOS: 300ms, Android: 100ms) */
export const MODAL_FOCUS_DELAY_IOS_MS = 300;
export const MODAL_FOCUS_DELAY_ANDROID_MS = 100;

// ============================================================================
// API CALL ORDER & DEPENDENCIES
// ============================================================================

/**
 * App Initialization Order:
 * 
 * 1. User Preferences (blocking) - Required for currency selection
 * 2. Exchange Rates (non-blocking) - Can load in parallel
 * 3. Crypto Market Data (non-blocking) - Requires preferences.currency
 * 4. Crypto Overview (non-blocking) - Can load in parallel
 * 
 * After all initial fetching completes:
 * 5. Startup Coin Fetch (waits STARTUP_FETCH_DELAY_MS, then fetches coins in lists)
 */

// ============================================================================
// WHAT EACH API CALL AFFECTS
// ============================================================================

/**
 * Exchange Rates API:
 * - Affects: Currency conversion display throughout app
 * - Refresh: Every 24 hours
 * - Location: constants/currency.ts, utils/currencyApi.ts
 * 
 * Crypto Market Data (/coins/markets):
 * - Affects: Coin prices, market caps, 24h changes, coin lists, filtering
 * - Refresh: Every 6 minutes, also on window focus
 * - Location: utils/coinGeckoApi.ts, hooks/use-app-initializations.ts
 * - Rate Limiting: 1.2s between pages, 10s delay every 3 pages
 * 
 * Crypto Overview (/global):
 * - Affects: Global market stats, dominance calculations
 * - Refresh: Every 5 minutes, also on window focus
 * - Location: utils/coinGeckoOverviewApi.ts, hooks/use-app-initializations.ts
 * 
 * Backend Dominance (/api/dominance):
 * - Affects: Historical dominance charts (180 days)
 * - Refresh: Every 24 hours (backend-side caching)
 * - Location: utils/backendApi.ts
 * 
 * Coin Search (/search):
 * - Affects: User search results when adding coins
 * - Refresh: On-demand (debounced 500ms)
 * - Location: utils/coinGeckoApi.ts, components/CoinAutocomplete.tsx
 * 
 * Individual Coin Fetch (/coins/{id}):
 * - Affects: Full market data for searched coins, startup fetch
 * - Refresh: On-demand (when coin selected or in startup fetch)
 * - Location: utils/coinGeckoApi.ts, hooks/use-startup-coin-fetch.ts
 * - Rate Limiting: Returns null on 429, retries handled by caller
 */

