import * as Notifications from 'expo-notifications';
import { Notification } from "../types/notification.type";
import React, { useEffect, useState } from "react";
import { notificationEmitter } from '../utils/notificationEmitter';
import notificationService from "../notification/notificationService";
import { t } from "../i18n"
import { useLanguage } from "../../src/i18n/LanguageProvider";

const CATEGORY_MAP: Record<string, string> = {
  FOOD: t("category.food"),
  TRANSPORT: t("category.transport"),
  SHOPPING: t("category.shopping"),
  ENTERTAINMENT: t("category.entertainment"),
};

const normalizeNotification = (content: string) => {
  const [key, type, amount, category] = content.split("|");

  switch (key) {
    case "notification.notification_done":
      return t(key, {
        type: t(type), // expense -> Spent
        amount: Number(amount).toLocaleString(),
        category: t(`category.${category.toUpperCase()}`),
      });

    default:
      return t(key);
  }
};

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
          body: normalizeNotification(newNotification.content),
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