import { http } from "./http";
import {
  Notification,
  CreateNotificationRequest,
  CheckResponse,
} from "../types/notification.type";
import { tokenStorage } from "../storage/tokenStorage";

class NotificationApi {

  private async getAuthHeader() {
    const token = await tokenStorage.getAccessToken();

    if (!token) {
      throw new Error("No token found");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // ==============================
  // Save push token
  // ==============================
  async savePushToken(
    data: { pushToken: string; deviceId?: string; platform?: string }
  ): Promise<CheckResponse<void>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.post(
        "/api/v1/push-tokens",
        data,
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || "Save push token failed",
      };
    }
  }

  // ==============================
  // Create notification
  // ==============================
  async createNotification(
    data: CreateNotificationRequest
  ): Promise<CheckResponse<Notification>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.post(
        "/api/v1/notifications",
        data,
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || "Create notification failed",
      };
    }
  }

  // ==============================
  // Get all notifications
  // ==============================
  async getNotifications(): Promise<CheckResponse<Notification[]>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.get(
        "/api/v1/notifications",
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || "Get notifications failed",
      };
    }
  }

  // ==============================
  // (Optional) Mark as read
  // ==============================
  async markAsRead(id: string): Promise<CheckResponse<void>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.patch(
        `/api/v1/notifications/${id}/read`,
        null,
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || "Mark as read failed",
      };
    }
  }

  // ==============================
  // (Optional) Delete notification
  // ==============================
  async deleteNotification(id: string): Promise<CheckResponse<void>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.delete(
        `/api/v1/notifications/${id}`,
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || "Delete notification failed",
      };
    }
  }
}

export default new NotificationApi();