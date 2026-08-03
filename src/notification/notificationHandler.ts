import * as Notifications from 'expo-notifications';
import { Notification } from "../types/notification.type";
import { notificationEmitter } from '../utils/notificationEmitter';
import notificationService from "../notification/notificationService";
import { t } from "../i18n";
import { localizeNotificationContent } from "../i18n/notificationContent";

let isAppInNotificationScreen = false;

export const setNotificationScreenActive = (active: boolean) => {
  isAppInNotificationScreen = active;
};

export const handleIncomingNotification = async (
  newNotification: Notification,
  options?: {
    existingList?: Notification[];
    setList?: (fn: (prev: Notification[]) => Notification[]) => void;
    setUnread?: (fn: (prev: number) => number) => void;
  }
) => {
  try {
    if (options?.existingList?.some(n => n.id === newNotification.id)) {
      return;
    }

    options?.setList?.((prev) => {
      if (prev.some(n => n.id === newNotification.id)) return prev;
      return [newNotification, ...prev];
    });

    if (!isAppInNotificationScreen) {
      const unread = await notificationService.getUnreadCount();

      options?.setUnread?.(() => unread);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("notification.new_notification"),
          body: localizeNotificationContent(newNotification.content),
          data: {
            id: newNotification.id,
            ...(newNotification.deepLink
              ? { url: newNotification.deepLink }
              : {}),
          },
        },
        trigger: null,
      });

      notificationEmitter.emit("NEW_NOTIFICATION", unread);
    }

  } catch (err) {
    console.log("handleIncomingNotification error:", err);
  }
};