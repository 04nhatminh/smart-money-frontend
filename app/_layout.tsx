// app/_layout.tsx
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { OnboardingProvider, useOnboarding } from "../src/context/OnboardingContext";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { isFirstLaunch, isLoading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading || onboardingLoading || isFirstLaunch === null) return;

    const currentGroup = segments[0] ?? "";
    const isPublicGroup = currentGroup === "(intro)" || currentGroup === "(auth)";
    const targetRoute = isFirstLaunch
      ? "/(intro)/intro"
      : isSignedIn
      ? "/(tabs)"
      : "/(auth)/auth";

    const shouldRedirect =
      (targetRoute === "/(intro)/intro" && currentGroup !== "(intro)") ||
      (targetRoute === "/(auth)/auth" && currentGroup !== "(auth)") ||
      // Signed-in users can access any private group (tabs, transactions, ...),
      // but should be redirected away from public groups.
      (targetRoute === "/(tabs)" && (currentGroup === "" || isPublicGroup));

    if (shouldRedirect) {
      router.replace(targetRoute);
    }

    SplashScreen.hideAsync().catch(() => {
      // Splash screen might already be hidden in fast refresh or re-mount scenarios.
    });
  }, [authLoading, onboardingLoading, isFirstLaunch, isSignedIn, segments, router]);

  // Hiển thị loading khi chưa sẵn sàng
  if (authLoading || onboardingLoading || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(intro)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(transactions)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <RootLayoutNav />
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}