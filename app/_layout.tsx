import { useEffect } from "react";
import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";

function RootLayoutNav() {
  const { isLoading, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // if (!isSignedIn && !inAuthGroup) {
    //   router.replace("/(auth)/login");
    // } else if (isSignedIn && inAuthGroup) {
    //   router.replace("/(tabs)/home");
    // }
    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [isSignedIn, isLoading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}