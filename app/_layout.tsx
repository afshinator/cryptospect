// app/_layout.tsx

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
 
 
import { useAppInitialization } from "@/hooks/use-app-initializations";
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
  const { isReady, resolvedColorScheme } = useAppInitialization();

  if (!isReady) {
    return <LoadingGuard />;
  }

  const theme = resolvedColorScheme === "dark" ? DarkTheme : DefaultTheme;
  const statusBarStyle = resolvedColorScheme === "dark" ? "light" : "dark";

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="list-detail"
          options={{ presentation: "card", title: "List Details", headerShown: true, headerTitleAlign: "center" }}
        />
        <Stack.Screen
          name="coin-detail"
          options={{ presentation: "card", title: "Coin Details", headerShown: true, headerTitleAlign: "center" }}
        />
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