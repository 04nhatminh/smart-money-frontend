// useNotificationHandler.ts
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

export const useNotificationPermission = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const request = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log("Permission:", status);
    };

    request();
  }, [enabled]);
};