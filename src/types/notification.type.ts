export interface SavePushTokenRequest {
  pushToken: string;
  deviceId?: string;
  platform?: string;
}

// ==============================
// Notification Entity
// ==============================
export interface Notification {
  id: string;                // UUID
  userId: string;            // UUID
  content: string;
  createdAt: string;         // ISO date string
  deepLink?: string | null;  // route to navigate to when tapped; null for older notifications
  read: boolean;
}

// ==============================
// Create Notification Request
// ==============================
export interface CreateNotificationRequest {
  content: string;
}

// ==============================
// Generic API Response (CheckResponse)
// ==============================
export interface CheckResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ==============================
// Specific Responses
// ==============================

// POST /notifications
export type CreateNotificationResponse = CheckResponse<Notification>;

// GET /notifications
export type GetNotificationsResponse = CheckResponse<Notification[]>;