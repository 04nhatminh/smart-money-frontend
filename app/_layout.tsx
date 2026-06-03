// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { OnboardingProvider, useOnboarding } from "../src/context/OnboardingContext";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { isFirstLaunch, isLoading: onboardingLoading } = useOnboarding();

  const router = useRouter();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);
  
  useEffect(() => {
    if (authLoading || onboardingLoading || isFirstLaunch === null) return;
    SplashScreen.hideAsync();
    // 1️⃣ Lần đầu mở app → intro
    if (isFirstLaunch && !authLoading) {
      console.log("🚀 First launch detected, navigating to intro...");
      router.replace("/(intro)/intro");
      SplashScreen.hideAsync();
      return;
    }

    // 2️⃣ Chưa login → auth
    if (!isSignedIn) {
      router.replace("/(auth)/auth");
      SplashScreen.hideAsync();
      return;
    }

    // 3️⃣ Login rồi → home
    router.replace("/(tabs)");
    SplashScreen.hideAsync();
  }, [isSignedIn, isFirstLaunch, authLoading, onboardingLoading]);

  if (authLoading || onboardingLoading || isFirstLaunch === null) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown:false }}>
      <Stack.Screen name="(wait)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(intro)" />
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