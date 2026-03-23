import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/otp" />
      <Stack.Screen name="(tabs)/home" />
      <Stack.Screen name="(tabs)/search" />
      <Stack.Screen name="(tabs)/orders" />
      <Stack.Screen name="(tabs)/profile" />
      <Stack.Screen name="pharmacy/[id]" />
      <Stack.Screen name="prescription/upload" options={{ presentation: 'modal' }} />
      <Stack.Screen name="prescription/results" />
    </Stack>
  );
}
