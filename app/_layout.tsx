// app/_layout.tsx
import React, { useEffect, useState } from "react";
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
  
  const [navigationReady, setNavigationReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // Xác định route ban đầu chỉ một lần
  useEffect(() => {
    if (authLoading || onboardingLoading || isFirstLaunch === null) return;

    const determineInitialRoute = () => {
      if (isFirstLaunch) {
        return "/(intro)/intro";
      } else if (!isSignedIn) {
        return "/(auth)/auth";
      } else {
        return "/(tabs)";
      }
    };

    const route = determineInitialRoute();
    setInitialRoute(route);
    
    // Ẩn splash screen sau khi đã xác định route
    SplashScreen.hideAsync();
    
    // Đánh dấu đã sẵn sàng điều hướng
    setTimeout(() => {
      setNavigationReady(true);
    }, 100); // Delay nhỏ để tránh flicker
  }, [authLoading, onboardingLoading, isFirstLaunch, isSignedIn]);

  // Xử lý điều hướng khi đã sẵn sàng
  useEffect(() => {
    if (!navigationReady || !initialRoute) return;

    const currentPath = segments.join('/');
    const shouldRedirect = 
      (initialRoute === "/(intro)/intro" && !currentPath.includes('intro')) ||
      (initialRoute === "/(auth)/auth" && !currentPath.includes('auth') && !currentPath.includes('tabs')) ||
      (initialRoute === "/(tabs)" && !currentPath.includes('tabs'));

    if (shouldRedirect) {
      router.replace(initialRoute);
    }
  }, [navigationReady, initialRoute, segments]);

  // Hiển thị loading khi chưa sẵn sàng
  if (authLoading || onboardingLoading || isFirstLaunch === null || !navigationReady) {
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