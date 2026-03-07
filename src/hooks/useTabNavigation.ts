import { useRouter, usePathname } from 'expo-router';
import { useCallback } from 'react';

type TabKey = 'home' | 'stats' | 'transaction' | 'wallet' | 'profile';

export const useTabNavigation = (onCameraOpen?: () => void) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current active tab
  const getActiveTab = useCallback((): TabKey => {
    if (pathname.includes('profile')) return 'profile';
    if (pathname.includes('transaction')) return 'transaction';
    if (pathname.includes('stats')) return 'stats';
    if (pathname.includes('wallet')) return 'wallet';
    return 'home';
  }, [pathname]);

  // Navigation handlers
  const navigateToHome = useCallback(() => {
    router.replace('/(tabs)/home');
  }, [router]);

  const navigateToStats = useCallback(() => {
    router.navigate('/(tabs)/stats');
  }, [router]);

  const navigateToTransaction = useCallback(() => {
    router.navigate('/(tabs)/transaction');
  }, [router]);

  const navigateToWallet = useCallback(() => {
    router.navigate('/(tabs)/wallet');
  }, [router]);

  const navigateToProfile = useCallback(() => {
    router.navigate('/(tabs)/profile');
  }, [router]);

  const handleCameraOpen = useCallback(() => {
    onCameraOpen?.();
  }, [onCameraOpen]);

  return {
    activeTab: getActiveTab(),
    onHome: navigateToHome,
    onStats: navigateToStats,
    onTransaction: navigateToTransaction,
    onAdd: handleCameraOpen,
    onWallet: navigateToWallet,
    onProfile: navigateToProfile,
  };
};
