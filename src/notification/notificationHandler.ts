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
  // Anything without the "notification." prefix is a server-narrated sentence.
  if (!content.startsWith("notification.")) {
    return content;
  }

  const [key, ...args] = content.split("|");
  let params: Record<string, string> = {};

  switch (key) {
    case "notification.notification_done":
      return t(key, {
        type: t(args[0]), // expense -> Spent
        amount: Number(args[1]).toLocaleString(),
        category: t(`category.${args[2].toUpperCase()}`),
      });

    case "notification.settlement.project_completed":
    case "notification.settlement.project_frozen":
    case "notification.settlement.project_expired":
    case "notification.group.project_started":
    case "notification.group.project_completed":
    case "notification.group.project_expired":
    case "notification.group.sponsorship_failed":
      params = { projectName: args[0] };
      break;

    case "notification.group.invited":
      params = { groupName: args[0] };
      break;

    case "notification.group.member_dropped":
      params = { username: args[0], projectName: args[1] };
      break;

    case "notification.group.sponsorship_survey":
    case "notification.group.sponsorship_new_round":
      params = {
        proposed: Number(args[0]).toLocaleString(),
        original: Number(args[1]).toLocaleString(),
      };
      break;

    default:
      break;
  }

  return t(key, { ...params, defaultValue: content });
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