import notificationApi from "../api/notification.api";
import { Notification, CreateNotificationRequest } from "../types/notification.type";

class NotificationService {



  // ==============================
  //  Save push token
  // ==============================
  async savePushTokenToServer(token: string, userId: string): Promise<void> {
    const data = { pushToken: token, deviceId: undefined, platform: undefined };
    const res = await notificationApi.savePushToken(data);
    if (!res.success) {
      throw new Error(res.message || "Failed to save push token");
    } else {
      console.log("Push token saved successfully");
    }
  }

  // ==============================
  // Get all notifications
  // ==============================

  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications();

    return notifications.filter(n => !n.read).length;
  }

  async getNotifications(): Promise<Notification[]> {
    const res = await notificationApi.getNotifications();

    if (!res.success) {
      throw new Error(res.message || "Failed to fetch notifications");
    }

    return res.data || [];
  }

  // ==============================
  // Create notification
  // ==============================
  async createNotification(
    data: CreateNotificationRequest
  ): Promise<Notification> {
    const res = await notificationApi.createNotification(data);

    if (!res.success) {
      throw new Error(res.message || "Failed to create notification");
    }

    return res.data;
  }

  // ==============================
  // Mark as read
  // ==============================
  async markAsRead(id: string): Promise<void> {
    const res = await notificationApi.markAsRead(id);

    if (!res.success) {
      throw new Error(res.message || "Failed to mark notification as read");
    }
  }


  // ==============================
  // Mark all as read
  // ==============================
  async markAllAsRead(ids: string[]): Promise<void> {
    const res = await notificationApi.markAllAsRead(ids);

    if (!res.success) {
      throw new Error(res.message || "Failed to mark notification as read");
    }
  }


  // ==============================
  // Batch mark as read
  // ==============================
  async markManyAsRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const res = await notificationApi.markManyAsRead(ids);

    if (!res.success) {
      throw new Error(res.message || "Failed to batch-mark notifications as read");
    }
  }

  // ==============================
  // Delete notification
  // ==============================
  async deleteNotification(id: string): Promise<void> {
    const res = await notificationApi.deleteNotification(id);

    if (!res.success) {
      throw new Error(res.message || "Failed to delete notification");
    }
  }
}

export default new NotificationService();