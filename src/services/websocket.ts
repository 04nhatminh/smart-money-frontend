import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

import { handleIncomingNotification } from "../notification/notificationHandler";

import {
  BudgetAllocationAIMessage,
  RawBudgetAllocationAIMessage,
} from "../types/project.types";

// ==============================
// STATE
// ==============================
let stompClient: Client | null = null;

let isConnected = false;

let currentUserId: string | null = null;

let connectPromise: Promise<Client> | null = null;

const jobCallbacks = new Map<string, (data: any) => void>();

let notificationSub: StompSubscription | null = null;

let aiUserSub: StompSubscription | null = null;

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const WS_URL: string | null = BASE_URL ? `${BASE_URL}/ws` : null;

// ==============================
// HELPERS
// ==============================
const parseJson = <T,>(raw: string): T => {
  return JSON.parse(raw) as T;
};

const parseBudgetAIMessage = (
  rawData: RawBudgetAllocationAIMessage
): BudgetAllocationAIMessage => {
  const parsedResult =
    typeof rawData.result === "string"
      ? JSON.parse(rawData.result)
      : rawData.result;

  return {
    ...rawData,
    result: parsedResult,
  };
};

// ==============================
// INIT
// ==============================
export const initWebSocket = (userId: string): Promise<Client> => {
  if (!WS_URL) {
    return Promise.reject("❌ WS_URL missing");
  }

  if (currentUserId && currentUserId !== userId) {
    disconnectWebSocket();
  }

  currentUserId = userId;

  if (stompClient && isConnected) {
    return Promise.resolve(stompClient);
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = new Promise((resolve, reject) => {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log("[WS]", str),
    });

    stompClient.onConnect = () => {
      console.log("✅ WebSocket connected");

      isConnected = true;

      subscribeNotifications();

      subscribeUserAI();

      resolve(stompClient!);
    };

    stompClient.onDisconnect = () => {
      console.log("🔌 WebSocket disconnected");

      isConnected = false;

      connectPromise = null;
    };

    stompClient.onStompError = (frame) => {
      console.error("❌ STOMP error:", frame.headers.message);
      console.error("❌ STOMP details:", frame.body);
    };

    stompClient.onWebSocketError = (err) => {
      console.error("❌ WS error", err);

      isConnected = false;

      connectPromise = null;

      reject(err);
    };

    stompClient.activate();
  });

  return connectPromise;
};

// ==============================
// NOTIFICATION SUBSCRIBE
// ==============================
const subscribeNotifications = () => {
  if (!stompClient || !isConnected || !currentUserId) return;

  if (notificationSub) {
    notificationSub.unsubscribe();
    notificationSub = null;
  }

  notificationSub = stompClient.subscribe(
    `/topic/notifications/${currentUserId}`,
    (msg: IMessage) => {
      try {
        const data = parseJson<any>(msg.body);

        console.log("🔔 Notification:", data);

        handleIncomingNotification(data);
      } catch (err) {
        console.error("❌ Notification parse error", err);
      }
    }
  );
};

// ==============================
// USER AI TOPIC SUBSCRIBE
// Route all AI messages by jobId
// Topic: /topic/ai/user/{userId}
// ==============================
const subscribeUserAI = () => {
  if (!stompClient || !isConnected || !currentUserId) return;

  if (aiUserSub) {
    aiUserSub.unsubscribe();
    aiUserSub = null;
  }

  aiUserSub = stompClient.subscribe(
    `/topic/ai/user/${currentUserId}`,
    (msg: IMessage) => {
      try {
        const data = parseJson<any>(msg.body);

        const jobId = data?.jobId;

        if (!jobId) {
          console.warn("⚠️ AI message missing jobId:", data);
          return;
        }

        console.log("🎯 AI result for job:", jobId);

        const callback = jobCallbacks.get(jobId);

        if (!callback) {
          console.warn("⚠️ No callback registered for job:", jobId);
          return;
        }

        callback(data);

        jobCallbacks.delete(jobId);
      } catch (err) {
        console.error("❌ AI message parse error", err);
      }
    }
  );
};

// ==============================
// GENERIC JOB CALLBACK
// ==============================
export const subscribeJob = async (
  jobId: string,
  onResult: (data: any) => void
): Promise<() => void> => {
  if (!currentUserId) {
    console.warn("⚠️ No userId. Call initWebSocket(userId) first.");
    return () => {};
  }

  await initWebSocket(currentUserId);

  if (jobCallbacks.has(jobId)) {
    console.log("⚠️ Already registered callback for job:", jobId);
    return () => {};
  }

  jobCallbacks.set(jobId, onResult);

  console.log("✅ Registered callback for job:", jobId);

  return () => {
    jobCallbacks.delete(jobId);
    console.log("🧹 Unregistered callback for job:", jobId);
  };
};

// ==============================
// BUDGET JOB CALLBACK
// For BUDGET_ALLOCATION result
// Uses user-level topic: /topic/ai/user/{userId}
// ==============================
export const subscribeBudgetJob = async (
  jobId: string,
  onResult: (data: BudgetAllocationAIMessage) => void,
  onError?: (error: unknown) => void
): Promise<() => void> => {
  return subscribeJob(jobId, (rawData) => {
    try {
      console.log("📨 Raw budget job message:", rawData);

      const data = parseBudgetAIMessage(
        rawData as RawBudgetAllocationAIMessage
      );

      if (data.jobId !== jobId) {
        console.warn("⚠️ Ignore another budget job:", data.jobId);
        return;
      }

      if (data.status !== "COMPLETED") {
        console.warn("⚠️ Budget job not completed:", data);
        return;
      }

      console.log("✅ Parsed budget result:", data);

      onResult(data);
    } catch (err) {
      console.error("❌ Budget websocket parse error", err);

      onError?.(err);
    }
  });
};

// ==============================
// DISCONNECT
// ==============================
export const disconnectWebSocket = () => {
  if (notificationSub) {
    notificationSub.unsubscribe();
    notificationSub = null;
  }

  if (aiUserSub) {
    aiUserSub.unsubscribe();
    aiUserSub = null;
  }

  jobCallbacks.clear();

  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }

  isConnected = false;

  currentUserId = null;

  connectPromise = null;

  console.log("🔌 WebSocket fully cleaned");
};