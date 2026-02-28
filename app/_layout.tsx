import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useRouter, useSegments } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";

function RootLayoutNav() {
  const { isLoading, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    // Kiểm tra lần đầu mở app
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        // Lần đầu mở app
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    }
  };

  useEffect(() => {
    if (isLoading || isFirstLaunch === null) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inIntroGroup = segments[0] === "(intro)";
    const inTabsGroup = segments[0] === "(tabs)";

    // Logic điều hướng - ưu tiên check isFirstLaunch
    if (isFirstLaunch) {
      // Lần đầu mở app -> chuyển đến Intro (bất kể auth state)
      if (!inIntroGroup) {
        router.replace("/(intro)/intro");
      }
    } else {
      // Không phải lần đầu -> xử lý auth flow
      if (isSignedIn && (inAuthGroup || inIntroGroup)) {
        // Đã đăng nhập và đang ở auth/intro -> chuyển về tabs
        router.replace("/(tabs)");
      } else if (!isSignedIn && !inAuthGroup && !inIntroGroup && inTabsGroup) {
        // Chưa đăng nhập nhưng đang ở tabs -> chuyển đến auth
        router.replace("/(auth)/auth");
      }
    }
  }, [isSignedIn, isLoading, segments, isFirstLaunch]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(intro)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
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