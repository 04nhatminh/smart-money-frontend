import React, { useEffect, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator, AppState } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from 'expo-notifications';
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { OnboardingProvider, useOnboarding } from "../src/context/OnboardingContext";
import { NotificationUIProvider } from '../src/context/NotificationUIContext';
import { NotificationListenerService } from '../src/notification/NotificationListenerService';
import NotificationNative from "../src/notification/NotificationNative";
import NotificationToast from '../src/components/notification/NotificationToast';
import PendingTransactionPanel, { PendingPanelRef } from "../src/components/transactions/PendingTransactionPanel";
import { AISuggestionProvider } from "../src/context/AISuggestionContext";
import { useAISuggestions } from "../src/context/AISuggestionContext";
import { InteractionManager } from "react-native";
import { resolveDeepLink } from "../src/utils/notificationDeepLink";

export const panelRef = React.createRef<PendingPanelRef>();

SplashScreen.preventAutoHideAsync().catch(() => { });

function RootLayoutNav() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { isFirstLaunch, isLoading: onboardingLoading } = useOnboarding();
  const { preload } = useAISuggestions();
  const isSignedInRef = useRef(isSignedIn);
  const hasColdStartChecked = useRef(false);

  const router = useRouter();
  const segments = useSegments();

  const isLoading =
    isFirstLaunch === null || authLoading || onboardingLoading;

  useEffect(() => {
    isSignedInRef.current = isSignedIn;
  }, [isSignedIn]);

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

  // Cold-start: app was killed, user tapped notification → listener isn't attached yet,
  // so the response is only available via getLastNotificationResponseAsync.
  // Fire once, after auth finishes loading and the user is confirmed signed in.
  useEffect(() => {
    if (isLoading || hasColdStartChecked.current || !isSignedIn) return;
    hasColdStartChecked.current = true;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) resolveDeepLink(url);
    });
  }, [isLoading, isSignedIn]);

  // Live listener: foreground banner tap + background→foreground tap.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isSignedInRef.current) return;
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) resolveDeepLink(url);
    });
    return () => sub.remove();
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
    // 👉 ĐẠT TRẠNG THÁI KHÁC
    if (!isFirstLaunch && isSignedIn && !inTabs && segment !== "(transactions)" && segment !== "(wait)" && segment !== "accept-invite" && segment !== "group-invite" && segment !== "group" && segment !== "group-project") {
      router.replace("/(tabs)");
      return;
    }

  }, [isFirstLaunch, isSignedIn, isLoading, segments]);

  useEffect(() => {
    if (!isSignedIn) return;

    const task = InteractionManager.runAfterInteractions(() => {
      preload();
    });

    return () => task.cancel();
  }, [isSignedIn]);

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
        <Stack.Screen name="(wait)" />
        <Stack.Screen name="(intro)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(transactions)" />
        <Stack.Screen name="accept-invite" />
        <Stack.Screen name="group-invite" />
        <Stack.Screen name="group" />
        <Stack.Screen name="group-project" />
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
              <AISuggestionProvider>
                <RootLayoutNav />
              </AISuggestionProvider>
            </NotificationUIProvider>
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}