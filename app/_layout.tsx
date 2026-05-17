// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator, Text, AppState } from "react-native";
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { OnboardingProvider, useOnboarding } from "../src/context/OnboardingContext";
import { NotificationUIProvider } from '../src/context/NotificationUIContext';
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';
import { NotificationListenerService } from '../src/notification/NotificationListenerService';
import NotificationToast from '../src/components/notification/NotificationToast';
import NotificationNative from "../src/notification/NotificationNative";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { isFirstLaunch, isLoading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        const hasPermission = await NotificationNative.hasPermission();

        if (hasPermission) {
          NotificationListenerService.initialize();
          NotificationNative.notifyJSReady();
        }
      }
    });

    return () => sub.remove();
  }, []);

  // 🔔 Setup notification handlers
  useEffect(() => {    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request notification listener permission (Android only)
    if (isSignedIn) {
      const requestPermission = async () => {
        try {
          console.log("📱 Requesting notification listener permission...");
          // The helper will show UI prompt if needed
          // This is non-blocking and won't interfere with app flow
        } catch (error) {
          console.error("Error requesting permission:", error);
        }
      };
      requestPermission();
    }
  }, [isSignedIn, isFirstLaunch, authLoading, onboardingLoading]);
  
  useEffect(() => {
    if (isFirstLaunch === null || authLoading || onboardingLoading) return;

    SplashScreen.hideAsync(); // ✅ hide sớm

    if (isFirstLaunch) {
      router.replace("/(intro)/intro");
      return;
    }

    if (!isSignedIn) {
      router.replace("/(auth)/auth");
      return;
    }

    router.replace("/(tabs)");
  }, [isSignedIn, isFirstLaunch, authLoading, onboardingLoading]);

  if (isFirstLaunch === null) {
        return (
        <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(wait)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(intro)" />
        <Stack.Screen name="(transactions)" />
      </Stack>
      <NotificationToast />
    </>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <NotificationUIProvider>
              <RootLayoutNav />
            </NotificationUIProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
