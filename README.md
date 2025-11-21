# CryptoSpect

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Set up environment variables

   Create a `.env` file in the root directory with your backend API key:

   ```bash
   EXPO_PUBLIC_BACKEND_API_KEY=your_backend_api_key_here
   ```

   **Important:** The `.env` file is gitignored and will not be committed to version control. 
   See `.env.example` for a template (create it if it doesn't exist).

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

The app makes API calls to four different endpoints to retrieve market data, exchange rates, and historical dominance information.

### 1. Backend API - Historical Dominance Data

**Endpoint:** `https://cryptospect-backend.vercel.app/api/dominance`

**Method:** `GET`

**Headers:**
- `x-api-key: crypto_spect_2024_abc123xyz789`

**Cache Duration:** 24 hours (backend-side caching)

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
- `per_page`: `250` (free tier maximum)
- `page`: `1`
- `sparkline`: `false`

**Cache Duration:** 5 minutes (client-side AsyncStorage)

**Data Retrieved:**
- Array of up to 250 cryptocurrencies with comprehensive market data:
  - Basic info: `id`, `symbol`, `name`, `image` (coin icon URL)
  - Pricing: `current_price`, `price_change_24h`, `price_change_percentage_24h`
  - Market metrics: `market_cap`, `market_cap_rank`, `total_volume`
  - 24h stats: `high_24h`, `low_24h`, `market_cap_change_24h`, `market_cap_change_percentage_24h`
  - Supply data: `circulating_supply`, `total_supply`, `max_supply`
  - Historical extremes: `ath`, `ath_change_percentage`, `ath_date`, `atl`, `atl_change_percentage`, `atl_date`
  - Metadata: `last_updated`

**Usage:** Provides current prices and market data for cryptocurrencies in the user's preferred currency.

---

### 3. CoinGecko API - Global Crypto Overview

**Endpoint:** `https://api.coingecko.com/api/v3/global`

**Method:** `GET`

**Cache Duration:** 5 minutes (client-side AsyncStorage)

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

## API Summary Table

| API | Endpoint | Refresh Interval | Purpose |
|-----|----------|------------------|---------|
| Backend | `/api/dominance` | 24 hours | Historical dominance data (180 days) |
| CoinGecko | `/coins/markets` | 5 minutes | Top 250 cryptocurrencies market data |
| CoinGecko | `/global` | 5 minutes | Global crypto market overview |
| Exchange Rate API | `/v6/latest/USD` | 24 hours | Fiat currency exchange rates |

**Note:** All APIs implement client-side caching using AsyncStorage with graceful fallback to stale cache if fresh data fails to fetch.