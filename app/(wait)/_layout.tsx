import { Stack } from 'expo-router';

export default function WaitLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="wait" />
    </Stack>
  );
}