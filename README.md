# CryptoSpect

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

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