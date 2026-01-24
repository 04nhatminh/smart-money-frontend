import { Stack } from "expo-router";
import { LanguageProvider } from "../src/i18n/LanguageProvider";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LanguageProvider>
  );
}