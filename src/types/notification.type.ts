// ==============================
// Notification Entity
// ==============================
export interface Notification {
  id: string;          // UUID
  userId: string;      // UUID
  content: string;
  createdAt: string;   // ISO date string
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