// _layout.tsx

import { usePrefsStore } from '@/stores/prefsStore';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, useColorScheme as useDeviceColorScheme } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};


function getAppTheme(
  lightDarkMode: 'system' | 'light' | 'dark',
  systemColorScheme: 'light' | 'dark' | null | undefined
) {
  let schemeToUse = lightDarkMode;

  if (schemeToUse === 'system') {
    schemeToUse = systemColorScheme ?? 'light'; // Default to 'light' if system is null
  }

  return schemeToUse === 'dark' ? DarkTheme : DefaultTheme;
}

export default function RootLayout() {
  const systemColorScheme = useDeviceColorScheme();
  const { lightDarkMode, _hasHydrated } = usePrefsStore();
  const finalTheme = getAppTheme(lightDarkMode, systemColorScheme);

  if (!_hasHydrated) {
    // While the store is loading (fetching data from AsyncStorage/LocalStorage), 
    // we show nothing or a specific loading indicator.
    // Expo Router usually handles the initial splash screen for you, 
    // but here we ensure no flicker with the wrong theme.
    return <View />; // Render an empty, non-interactive view
  }

  // 5. Render the fully hydrated app structure
  return (
    <ThemeProvider value={finalTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* Set StatusBar style based on the determined theme */}
      <StatusBar style={finalTheme.dark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}