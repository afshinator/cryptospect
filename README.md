# CryptoSpect

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Create a `.env` file in the root directory with your backend configuration:

   ```bash
   EXPO_PUBLIC_BACKEND_API_KEY=your_backend_api_key_here
   EXPO_PUBLIC_BACKEND_BASE_URL=https://your-backend-url.vercel.app
   ```

   **Important:** The `.env` file is gitignored and will not be committed to version control. 
   See `.env.example` for a template.

3. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo


### CoinGecko data - frontend real-time snapshot vs backend historical

A. The Historical Feed (/api/dominance Vercel Backend)

Source: fetchRawHistoricalData in lib/coinGeckoFetcher.ts.

Data Endpoint: Primarily uses the CoinGecko Market Chart endpoint (.../market_chart?days=180).

Timing/Delay: Data from the market_chart endpoint is aggregated hourly and is often delayed by 1 to 2 hours from the current moment.

- Caching: Backend caches the entire historical array for up to CACHE_LIFETIME_MS (24 hours by default). This means the last point 
could be 1 hour old plus up to 24 hours stale.


B. The Real-Time Snapshot (getCryptoOverview Frontend)

Source: getCryptoOverview in utils/coinGeckoOverviewApi.ts.

Data Endpoint: Directly calls the CoinGecko Global endpoint (/global).

Timing/Delay: This endpoint provides the most current, live data that CoinGecko publishes. It is typically updated every few minutes.

Caching: The frontend cache for this data is very short (CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS, likely 60 seconds).

## API Calls & Data Sources

The app makes API calls to multiple endpoints to retrieve market data, exchange rates, and historical dominance information.

**⚠️ IMPORTANT: All API timing constants, delays, and refresh intervals are centralized in `constants/apiConfig.ts` for easy configuration and adjustment.**

### API Configuration Overview

All timing constants, delays, refresh intervals, and rate limiting configurations are located in **`constants/apiConfig.ts`**. This file contains:

- **Refresh Intervals**: How often data is considered stale
- **Rate Limiting**: Delays between API calls
- **Startup Fetch**: Background fetching configuration
- **Search & UI**: Debouncing and interaction delays
- **API Call Order**: Documentation of initialization sequence
- **What Each API Affects**: Detailed impact documentation

**To adjust any timing or delay values, edit `constants/apiConfig.ts`.**

---

### 1. Backend API - Historical Dominance Data

**Endpoint:** `{BACKEND_BASE_URL}/api/dominance` (configured via environment variable)

**Method:** `GET`

**Headers:**
- `x-api-key: {BACKEND_API_KEY}` (configured via environment variable)

**Cache Duration:** 24 hours (backend-side caching)
- **Note:** Cache duration is configured on the backend (Vercel serverless function). Check backend code for `CACHE_LIFETIME_MS` constant.

**Data Retrieved:**
- Array of historical dominance snapshots (180 days)
- Each snapshot contains:
  - `date`: number (timestamp)
  - `btcDominance`: number (Bitcoin market cap percentage)
  - `ethDominance`: number (Ethereum market cap percentage)
  - `usdtDominance`: number (USDT market cap percentage)
  - `othersDominance`: number (Other cryptocurrencies market cap percentage)

**Usage:** Used in the Dominance Dashboard screen to display historical trends and ratio distributions.

---

### 2. CoinGecko API - Crypto Market Data

**Endpoint:** `https://api.coingecko.com/api/v3/coins/markets`

**Method:** `GET`

**Query Parameters:**
- `vs_currency`: User's selected currency (e.g., USD, EUR, NGN)
- `order`: `market_cap_desc`
- `per_page`: `250` (free tier maximum per page)
- `page`: `1`, `2`, `3`, `4`, `5` (fetches 5 pages sequentially)
- `sparkline`: `false`

**Cache Duration:** 6 minutes (client-side AsyncStorage)
- **Constant Location:** `constants/apiConfig.ts` → `CRYPTO_MARKET_REFRESH_INTERVAL_MS = 6 * 60 * 1000`

**Fetching Algorithm:**

The app fetches market data for up to 1,250 cryptocurrencies (5 pages × 250 per page) using a rate-limited sequential fetching strategy:

1. **Sequential Page Fetching**: Pages are fetched one at a time (not in parallel) to respect CoinGecko's rate limits.
   - **Number of pages:** 5 pages
   - **Coins per page:** 250 (free tier maximum)
   - **Constant Locations:**
     - `constants/coinGecko.ts` → `MARKET_DATA_PAGES_TO_FETCH = 5`
     - `constants/coinGecko.ts` → `MARKET_DATA_PER_PAGE = 250`

2. **Rate Limiting Delays**:
   - **Between pages**: 1.2 seconds delay between each page request
     - **Constant Location:** `constants/apiConfig.ts` → `MARKET_DATA_DELAY_BETWEEN_PAGES_MS = 1200`
   - **After every 3 pages**: 10 seconds longer delay before continuing
     - **Constant Locations:** 
       - `constants/apiConfig.ts` → `MARKET_DATA_LONG_DELAY_MS = 10000`
       - `constants/apiConfig.ts` → `MARKET_DATA_PAGES_BEFORE_LONG_DELAY = 3`
   - **On rate limit (HTTP 429)**: Respects `Retry-After` header, with exponential backoff up to 3 retries
     - **Constant Locations:**
       - `constants/apiConfig.ts` → `MARKET_DATA_MAX_RETRIES = 3`
       - `constants/apiConfig.ts` → `MARKET_DATA_BASE_RETRY_DELAY_MS = 60000` (60 seconds)

3. **Data Preservation**:
   - Existing cached data is preserved until new data is validated as complete
   - New data is only persisted if:
     - All 5 pages are successfully fetched, OR
     - The new data has more coins than the existing cache
   - If fetching fails or is incomplete, the old cache is preserved and returned (graceful degradation)
   - **Implementation:** `utils/coinGeckoApi.ts` → `fetchAndPersistCryptoMarket()`

4. **Refresh Triggers**:
   - **At app startup**: If cache is missing or stale (older than 6 minutes)
   - **Automatic**: Every 6 minutes via `refetchInterval`
     - **Constant Location:** `constants/apiConfig.ts` → `CRYPTO_MARKET_REFRESH_INTERVAL_MS`
     - **Usage:** `hooks/use-app-initializations.ts` → `useQuery` with `refetchInterval`
   - **On window focus**: When the app regains focus (`refetchOnWindowFocus`)
   - **On access**: If cached data is older than 6 minutes when accessed
   - **Implementation:** `utils/coinGeckoApi.ts` → `getCryptoMarket()`

5. **Timestamp Validation**: Each snapshot includes a `timestamp` field that tracks when the data was fetched. The cache is considered stale if `currentTime - timestamp > 6 minutes`.
   - **Type Definition:** `constants/coinGecko.ts` → `CryptoMarketSnapshot.timestamp: number`

**Data Retrieved:**
- Array of up to 1,250 cryptocurrencies (5 pages × 250 per page) with comprehensive market data:
  - Basic info: `id`, `symbol`, `name`, `image` (coin icon URL)
  - Pricing: `current_price`, `price_change_24h`, `price_change_percentage_24h`
  - Market metrics: `market_cap`, `market_cap_rank`, `total_volume`
  - 24h stats: `high_24h`, `low_24h`, `market_cap_change_24h`, `market_cap_change_percentage_24h`
  - Supply data: `circulating_supply`, `total_supply`, `max_supply`
  - Historical extremes: `ath`, `ath_change_percentage`, `ath_date`, `atl`, `atl_change_percentage`, `atl_date`
  - Metadata: `last_updated`

**Usage:** Provides current prices and market data for cryptocurrencies in the user's preferred currency. Used throughout the app for displaying coin information, filtering, and analysis.

---

### 3. CoinGecko API - Global Crypto Overview

**Endpoint:** `https://api.coingecko.com/api/v3/global`

**Method:** `GET`

**Cache Duration:** 5 minutes (client-side AsyncStorage)
- **Constant Location:** `constants/apiConfig.ts` → `CRYPTO_OVERVIEW_REFRESH_INTERVAL_MS = 5 * 60 * 1000`

**Data Retrieved:**
- Global market statistics object:
  - `active_cryptocurrencies`: number
  - `markets`: number
  - `total_market_cap`: Object with market cap values in various currencies
  - `total_volume`: Object with volume values in various currencies
  - `market_cap_percentage`: Object with dominance percentages (BTC, ETH, etc.)
  - `market_cap_change_percentage_24h_usd`: number
  - `updated_at`: number (timestamp)

**Usage:** Used to calculate and display current market dominance percentages (BTC, ETH, stablecoins, others) on the home screen.

---

### 4. Exchange Rate API - Fiat Exchange Rates

**Endpoint:** `https://open.er-api.com/v6/latest/USD`

**Method:** `GET`

**Cache Duration:** 24 hours (client-side AsyncStorage)
- **Constant Location:** `constants/apiConfig.ts` → `EXCHANGE_RATES_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000`

**Data Retrieved:**
- Exchange rate response object:
  - `result`: `'success' | 'error'`
  - `base`: string (typically "USD")
  - `time_last_update_unix`: number (timestamp)
  - `rates`: Object mapping currency codes to exchange rates
    - Includes: USD, EUR, GBP, JPY, CNY, INR, AUD, CAD, NGN, TRY, and many others
    - All rates are relative to USD base currency

**Usage:** Powers the currency banner and exchange rates screen, allowing users to view and convert between different fiat currencies.

---

### 5. CoinGecko API - Coin Search

**Endpoint:** `https://api.coingecko.com/api/v3/search`

**Method:** `GET`

**Query Parameters:**
- `query`: Search term (coin name or symbol, minimum 2 characters)

**Cache Duration:** Persistent (client-side AsyncStorage)
- **Storage Key:** `SavedOutlierCoins` (configured in `constants/misc.ts`)
- **Storage Location:** `utils/searchedCoinsStorage.ts` (legacy filename, contains `SavedOutlierCoins` functions)

**When It's Used:**
- Triggered automatically when a user searches for a coin in the "Add Coin" modal
- Only searches if:
  - The search query is at least 2 characters long
  - No matching coins are found in the local cache (from `/coins/markets` endpoint)
  - User stops typing for 500ms (debounced to avoid excessive API calls)

**Data Retrieved:**
The search endpoint returns a simplified response with limited fields:
- `coins`: Array of matching coins, each containing:
  - `id`: string (CoinGecko coin ID)
  - `name`: string (Full coin name)
  - `symbol`: string (Ticker symbol, e.g., "btc")
  - `api_symbol`: string (API identifier)
  - `market_cap_rank`: number | null (Market cap ranking)
  - `thumb`: string (Small image URL)
  - `large`: string (Large image URL)

**Why Most Fields Are Null:**
The search endpoint (`/search`) is designed for discovery and returns minimal data compared to the markets endpoint (`/coins/markets`). When search results are mapped to the `CoinGeckoMarketData` format used throughout the app, most market data fields are set to `null` because:

1. **Different Purpose**: The search endpoint is optimized for finding coins by name/symbol, not for retrieving full market data
2. **Performance**: Returning minimal data makes search faster and reduces API response size
3. **Data Availability**: Market data (prices, volumes, etc.) requires additional API calls to the `/coins/markets` endpoint

**Fields That Are Populated:**
- ✅ `id`: Coin identifier
- ✅ `name`: Coin name
- ✅ `symbol`: Ticker symbol
- ✅ `image`: Coin icon (from `large` or `thumb` field)
- ✅ `market_cap_rank`: Market cap ranking (if available)

**Fields That Are Null:**
- ❌ `current_price`: Requires market data endpoint
- ❌ `market_cap`: Requires market data endpoint
- ❌ `total_volume`: Requires market data endpoint
- ❌ `price_change_percentage_24h`: Requires market data endpoint
- ❌ `high_24h`, `low_24h`: Requires market data endpoint
- ❌ `circulating_supply`, `total_supply`, `max_supply`: Requires market data endpoint
- ❌ `ath`, `atl`, `ath_date`, `atl_date`: Requires market data endpoint
- ❌ All other market data fields

**Storage and Usage:**
- Searched coins are saved to AsyncStorage when selected by the user
- Stored coins are used to display icons and basic information in:
  - List Details screen (coin icons)
  - Coin Details screen (basic info, with "Limited data available" indicator)
- If a searched coin later appears in the main market cache (from `/coins/markets`), the full market data will be used instead
- **Implementation:** `utils/searchedCoinsStorage.ts` → `saveSavedOutlierCoin()`, `loadSavedOutlierCoins()` (legacy aliases: `saveSearchedCoin()`, `loadSearchedCoins()`)

**Rate Limiting:**
- Search requests are debounced (500ms delay after user stops typing)
  - **Constant Location:** `constants/apiConfig.ts` → `SEARCH_DEBOUNCE_DELAY_MS = 500`
- Minimum query length: 2 characters before triggering API search
  - **Constant Location:** `constants/apiConfig.ts` → `SEARCH_MIN_QUERY_LENGTH = 2`
- No explicit rate limit handling, but debouncing helps prevent excessive calls
- If rate limited (HTTP 429), an error message is displayed to the user

**Usage:** Enables users to find and add coins that aren't in the top 1,250 cryptocurrencies cached from the `/coins/markets` endpoint. Allows discovery of smaller market cap coins, new listings, or coins that have dropped in ranking.

---

## API Summary Table

| API | Endpoint | Refresh Interval | Purpose | Config Location |
|-----|----------|------------------|---------|----------------|
| Backend | `/api/dominance` | 24 hours | Historical dominance data (180 days) | Backend-side |
| CoinGecko | `/coins/markets` | 6 minutes | Top 1,250 cryptocurrencies market data (5 pages) | `apiConfig.ts` |
| CoinGecko | `/global` | 5 minutes | Global crypto market overview | `apiConfig.ts` |
| CoinGecko | `/search` | On-demand (debounced 500ms) | Search for coins by name/symbol (limited data) | `apiConfig.ts` |
| CoinGecko | `/coins/{id}` | On-demand | Full market data for individual coins | `apiConfig.ts` |
| Backend | `/api/coins/{id}` | On-demand | Full market data for individual coins (preferred over CoinGecko) | Backend-side |
| Exchange Rate API | `/v6/latest/USD` | 24 hours | Fiat currency exchange rates | `apiConfig.ts` |

**Note:** All APIs implement client-side caching using AsyncStorage with graceful fallback to stale cache if fresh data fails to fetch.

### Startup Coin Fetch

After app initialization completes, the app automatically fetches full market data for coins in user lists that aren't in the main cache:

- **Delay after initialization:** 5 seconds
  - **Constant Location:** `constants/apiConfig.ts` → `STARTUP_FETCH_DELAY_MS = 5000`
- **Batch size:** 5 coins fetched in parallel per batch
  - **Constant Location:** `constants/apiConfig.ts` → `STARTUP_FETCH_BATCH_SIZE = 5`
- **Delay between batches:** 1 second
  - **Constant Location:** `constants/apiConfig.ts` → `STARTUP_FETCH_BATCH_DELAY_MS = 1000`
- **Implementation:** `hooks/use-startup-coin-fetch.ts`
- **Storage:** Fetched coins are saved to `SavedOutlierCoins` storage

### Outlier Coin Data Fetching Algorithm

When a coin in a user's list is not found in the main `CryptoMarketSnapshot` (top ~1250 coins), the app uses the following algorithm:

1. **Check SavedOutlierCoins Storage First**
   - If coin exists in `SavedOutlierCoins` and has complete data (especially `price_change_percentage_24h`), use it immediately
   - If coin exists but missing price data, trigger background fetch

2. **Fetch Strategy (when data is missing or incomplete):**
   - **STEP 1:** Attempt to fetch from **Backend API** (`/api/coins/{id}`)
     - If successful, save to `SavedOutlierCoins` and use the data
     - If backend fails (404, CORS, network error, etc.), proceed to STEP 2
   - **STEP 2:** Fallback to **CoinGecko API** (`/coins/{id}`)
     - If successful, save to `SavedOutlierCoins` and use the data
     - If both fail, display "Waiting on API..." indicator

3. **Data Merging Rules:**
   - Never overwrite existing non-null values with null values
   - Only update fields where new data is non-null and existing is null
   - Preserve timestamps - only update when new data is actually merged
   - Priority: `price_change_percentage_24h` is the most important field

4. **Storage:**
   - **Storage Key:** `SavedOutlierCoins` (configured in `constants/misc.ts`)
   - **Implementation:** `utils/searchedCoinsStorage.ts` → `saveSavedOutlierCoin()`, `loadSavedOutlierCoins()`
   - Each coin has a `_lastUpdated` timestamp to track when it was last fetched

**This algorithm ensures that:**
- Backend API is tried first (faster, more reliable if available)
- CoinGecko is used as fallback (broader coverage)
- Existing data is never lost or overwritten with nulls
- Users see data immediately if available in storage, even if network is down

### App Initialization Order

1. **User Preferences** (blocking) - Required for currency selection
2. **Exchange Rates** (non-blocking) - Can load in parallel
3. **Crypto Market Data** (non-blocking) - Requires preferences.currency
4. **Crypto Overview** (non-blocking) - Can load in parallel
5. **Startup Coin Fetch** (waits `STARTUP_FETCH_DELAY_MS`, then fetches coins in lists)

**Implementation:** `hooks/use-app-initializations.ts`