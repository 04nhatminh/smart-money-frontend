import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { NotificationListenerPermissionHelper } from "../utils/notificationListenerPermissionHelper";

interface UseNotificationListenerPermissionReturn {
  isGranted: boolean;
  isLoading: boolean;
  request: () => Promise<boolean>;
  openGuide: () => void;
}

/**
 * Hook to check and request NotificationListener permission
 */
export const useNotificationListenerPermission =
  (): UseNotificationListenerPermissionReturn => {
    const [isGranted, setIsGranted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check permission on mount
    useEffect(() => {
      checkPermission();
    }, []);

    const checkPermission = async () => {
      if (Platform.OS !== "android") {
        setIsGranted(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const hasPermission =
          await NotificationListenerPermissionHelper.checkPermission();
        setIsGranted(hasPermission);
        console.log("✅ Permission check result:", hasPermission);
      } catch (error) {
        console.error("Error checking permission:", error);
        setIsGranted(false);
      } finally {
        setIsLoading(false);
      }
    };

    const request = async (): Promise<boolean> => {
      try {
        setIsLoading(true);
        const result =
          await NotificationListenerPermissionHelper.requestPermission();
        setIsGranted(result);
        return result;
      } catch (error) {
        console.error("Error requesting permission:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    const openGuide = () => {
      NotificationListenerPermissionHelper.showEnableGuide();
    };

    return {
      isGranted,
      isLoading,
      request,
      openGuide,
    };
  };
