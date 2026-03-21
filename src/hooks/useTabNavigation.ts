import { useRouter, usePathname } from "expo-router";
import { useCallback, useMemo } from "react";

export type TabKey = "home" | "stats" | "transaction" | "wallet" | "profile";

interface UseTabNavigationOptions {
  onCameraOpen?: () => void;
  onVoiceOpen?: () => void;
  onFormOpen?: () => void;
}

export const useTabNavigation = ({
  onCameraOpen,
  onVoiceOpen,
  onFormOpen,
}: UseTabNavigationOptions = {}) => {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = useMemo<TabKey>(() => {
    if (pathname.includes("profile")) return "profile";
    if (pathname.includes("transaction")) return "transaction";
    if (pathname.includes("stats")) return "stats";
    if (pathname.includes("wallet")) return "wallet";
    return "home";
  }, [pathname]);

  const onHome = useCallback(() => {
    router.replace("/(tabs)/home");
  }, [router]);

  const onStats = useCallback(() => {
    router.navigate("/(tabs)/stats");
  }, [router]);

  const onTransaction = useCallback(() => {
    router.navigate("/(tabs)/transaction");
  }, [router]);

  const onWallet = useCallback(() => {
    router.navigate("/(tabs)/wallet");
  }, [router]);

  const onProfile = useCallback(() => {
    router.navigate("/(tabs)/profile");
  }, [router]);

  const onAdd = useCallback(() => {
    onCameraOpen?.();
  }, [onCameraOpen]);

  const onAddByCamera = useCallback(() => {
    onCameraOpen?.();
  }, [onCameraOpen]);

  const onAddByVoice = useCallback(() => {
    onVoiceOpen?.();
  }, [onVoiceOpen]);

  const onAddByForm = useCallback(() => {
    onFormOpen?.();
  }, [onFormOpen]);

  return {
    activeTab,
    onHome,
    onStats,
    onTransaction,
    onWallet,
    onProfile,
    onAdd,
    onAddByCamera,
    onAddByVoice,
    onAddByForm,
  };
};