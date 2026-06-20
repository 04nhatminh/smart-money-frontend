import { useRouter, usePathname } from "expo-router";
import { useCallback, useMemo } from "react";

export type TabKey =
  | "home"
  | "stats"
  | "transaction"
  | "analysis"
  | "project"
  | "assistant";

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

  // Xác định tab đang hoạt động dựa trên tuyến đường (pathname) hiện tại
  const activeTab = useMemo<TabKey>(() => {
    if (pathname.includes("assistant")) return "assistant";
    if (pathname.includes("stats")) return "stats";
    if (pathname.includes("analysis")) return "analysis";
    if (pathname.includes("project")) return "project";
    if (pathname.includes("list") || pathname.includes("detail") || pathname.includes("transaction")) {
      return "transaction";
    }
    return "home";
  }, [pathname]);

  const onHome = useCallback(() => {
    router.replace("/(tabs)/home");
  }, [router]);

  const onStats = useCallback(() => {
    router.navigate("/(tabs)/stats");
  }, [router]);

  const onAnalysis = useCallback(() => {
    router.navigate("/(tabs)/analysis");
  }, [router]);

  const onProject = useCallback(() => {
    router.navigate("/(tabs)/project");
  }, [router]);

  const onTransaction = useCallback(() => {
    router.navigate("/(transactions)/list");
  }, [router]);

  const onChat = useCallback(() => {
    router.navigate("/(tabs)/chat");
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
    onAnalysis,
    onProject,
    onTransaction,
    onChat,
    onAdd,
    onAddByCamera,
    onAddByVoice,
    onAddByForm,
  };
};