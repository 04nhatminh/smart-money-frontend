import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { OnboardingProvider, useOnboarding } from "../src/context/OnboardingContext";
import { NotificationUIProvider } from '../src/context/NotificationUIContext';
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';
import { AppState } from "react-native";
import { NotificationListenerService } from '../src/notification/NotificationListenerService';
import NotificationNative from "../src/notification/NotificationNative";
import NotificationToast from '../src/components/notification/NotificationToast';
import PendingTransactionPanel, { PendingPanelRef } from "../src/components/transactions/PendingTransactionPanel";

export const panelRef = React.createRef<PendingPanelRef>();

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { isFirstLaunch, isLoading: onboardingLoading } = useOnboarding();

  const router = useRouter();
  const segments = useSegments();

  const isLoading =
    isFirstLaunch === null || authLoading || onboardingLoading;

  // ✅ Hide splash
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

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
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setTimeout(async () => {
          try {
            if (!NotificationNative || !NotificationNative.hasPermission) {
              console.warn("⚠️ NotificationNative not available");
              return;
            }

            const hasPermission = await NotificationNative.hasPermission();

            if (hasPermission) {
              NotificationListenerService?.initialize?.();
              NotificationNative?.notifyJSReady?.();
            }
          } catch (e) {
            console.error("❌ Notification crash:", e);
          }
        }, 500);
      }
    });

    return () => sub.remove();
  }, []);


  // ✅ 🔥 REDIRECT LOGIC (QUAN TRỌNG NHẤT)
  useEffect(() => {
    if (isLoading) return;

    const segment = segments[0];

    const inIntro = segment === "(intro)";
    const inAuth = segment === "(auth)";
    const inTabs = segment === "(tabs)";

    console.log("🔍 segments:", segments);
    console.log("🔍 state:", { isFirstLaunch, isSignedIn });

    // 👉 FIRST LAUNCH
    if (isFirstLaunch && !inIntro) {
      router.replace("/(intro)/intro");
      return;
    }

    // 👉 CHƯA LOGIN
    if (!isFirstLaunch && !isSignedIn && !inAuth) {
      router.replace("/(auth)/auth");
      return;
    }

    // 👉 ĐÃ LOGIN
    if (!isFirstLaunch && isSignedIn && !inTabs && segment !== "(transactions)" && segment !== "(wait)") {
      router.replace("/(tabs)");
      return;
    }

  }, [isFirstLaunch, isSignedIn, isLoading, segments]);

  // ✅ Loading UI
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // ✅ Stack đơn giản (KHÔNG condition nữa)
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(intro)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(transactions)" />
        <Stack.Screen name="(wait)" />
      </Stack>

      <NotificationToast />
      <PendingTransactionPanel ref={panelRef} />
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