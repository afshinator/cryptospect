import { Stack } from 'expo-router';

export default function TestsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}>
      <Stack.Screen name="index" options={{ title: 'Tests' }} />
      <Stack.Screen name="themed-text-demo" options={{ title: 'ThemedText Demo' }} />
    </Stack>
  );
}

