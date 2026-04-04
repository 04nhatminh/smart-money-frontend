import * as Notifications from 'expo-notifications';
import { Notification } from "../types/notification.type";
import { notificationStorage } from "../storage/notificationStorage";
import React, { useEffect, useState } from "react";

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
      options?.setUnread?.((prev) => {
        const newCount = prev + 1;
        notificationStorage.setUnreadCount(newCount);
        return newCount;
      });
    }

    // 4. 🔔 push local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 New Notification",
        body: newNotification.content,
        data: {
        id: newNotification.id,
        content: newNotification.content,
        }
      },
      trigger: null,
    });

  } catch (err) {
    console.log("handleIncomingNotification error:", err);
  }
};