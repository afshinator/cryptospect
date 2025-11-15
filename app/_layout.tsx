import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
 
import { EXCHANGE_RATES_QUERY_KEY } from "@/constants/currency";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePreferences } from "@/hooks/use-preference";
import { getExchangeRates } from "@/utils/currencyApi";
import { ActivityIndicator, Platform, View } from "react-native";

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(tabs)",
};

const LoadingGuard = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

function RootLayoutContent() {
  // 1. Fetch User Preferences (This remains the critical, blocking dependency)
  const { data: prefs, isPending: isPrefsPending } = usePreferences();
  
  // 2. Fetch Exchange Rates (Fetch EAGERLY, but non-blocking)
  // We call useQuery here to immediately initiate the check-cache-then-fetch logic.
  // We do NOT use the resulting isPending state to block the UI.
  const { 
    data: rates, 
    isPending: isRatesPending 
  } = useQuery({
    queryKey: EXCHANGE_RATES_QUERY_KEY,
    queryFn: getExchangeRates,
    staleTime: 0, // Forces the queryFn to run on mount/refocus and check the cache timestamp
    // We rely on getExchangeRates to handle cache fallbacks and errors gracefully.
  });

  const resolvedColorScheme = useColorScheme();

  // Loading Guard: ONLY Wait for user preferences to be ready.
  // The app will now render the tabs immediately after prefs are available,
  // even if exchange rates are still loading in the background.
  if (isPrefsPending || !prefs) {
    return <LoadingGuard />;
  }

  const theme = resolvedColorScheme === "dark" ? DarkTheme : DefaultTheme;
  const statusBarStyle = resolvedColorScheme === "dark" ? "light" : "dark";

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <StatusBar style={statusBarStyle} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutContent />
      
      {Platform.OS === 'web' && process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}