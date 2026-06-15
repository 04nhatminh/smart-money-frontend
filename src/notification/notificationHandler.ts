import * as Notifications from 'expo-notifications';
import { Notification } from "../types/notification.type";
import { notificationStorage } from "../storage/notificationStorage";
import React, { useEffect, useState } from "react";
import { notificationEmitter } from '../utils/notificationEmitter';

let isAppInNotificationScreen = false; // để tránh spam khi đang mở modal

const requestPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  console.log("Permission:", status);
};

useEffect(() => {
  requestPermission();
}, []);

export const setNotificationScreenActive = (active: boolean) => {
  isAppInNotificationScreen = active;
};

// 🔥 function chính
export const handleIncomingNotification = async (
  newNotification: Notification,
  options?: {
    existingList?: Notification[];
    setList?: (fn: (prev: Notification[]) => Notification[]) => void;
    setUnread?: (fn: (prev: number) => number) => void;
  }
) => {
  try {
    // 1. tránh duplicate
    if (options?.existingList?.some(n => n.id === newNotification.id)) {
      return;
    }

    // 2. update list UI nếu có
    options?.setList?.((prev) => {
        if (prev.some(n => n.id === newNotification.id)) return prev;
        return [newNotification, ...prev];
        });

    // 3. update unread count
    if (!isAppInNotificationScreen) {
      const current = await notificationStorage.getUnreadCount();
      const newCount = current + 1;

      await notificationStorage.setUnreadCount(newCount);

      // 🔥 emit để UI update
      notificationEmitter.emit("NEW_NOTIFICATION", newCount);
    }

    // 4. 🔔 push local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 New Notification",
        body: newNotification.content,
        data: {
          id: newNotification.id,
          content: newNotification.content,
          // Backend sends the deep link as `deepLink` over REST/WebSocket; the
          // OS notification payload carries it under the `url` key so the tap
          // listener in _layout can feed it to the deep-link resolver.
          ...(newNotification.deepLink ? { url: newNotification.deepLink } : {}),
        },
      },
      trigger: null,
    });

  } catch (err) {
    console.log("handleIncomingNotification error:", err);
  }

  
};