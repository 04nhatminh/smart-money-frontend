import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { handleIncomingNotification } from "../notification/notificationHandler";
import { BudgetAllocationAIMessage, BudgetAllocationResult, RawBudgetAllocationAIMessage } from "../types/project.types";

let stompClient: Client | null = null;
let isConnected = false;
let isConnecting = false;
let notificationCallback: ((notification: any) => void) | null = null;

// lưu subscriptions
const jobSubscriptions = new Map<string, StompSubscription>();

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const WS_URL: string | null = BASE_URL ? `${BASE_URL}/ws` : null;

type ConnectWebSocketOptions = {
  userId: string;
  jobIds?: string[];
  onNotification?: (notification: any) => void;
  onResult?: (jobId: string, data: any) => void;
};

// ==============================
// HELPERS
// ==============================

const parseBudgetAIMessage = (body: string): BudgetAllocationAIMessage => {
  const data = JSON.parse(body) as RawBudgetAllocationAIMessage;

  const parsedResult =
    typeof data.result === "string"
      ? JSON.parse(data.result)
      : data.result;

  return {
    ...data,
    result: parsedResult,
  };
};

// ==============================
// 🚀 INIT (singleton)
// ==============================
export const initWebSocket = (userId: string): Promise<Client> => {
  return new Promise((resolve, reject) => {
    if (!WS_URL) {
      reject("❌ WS_URL missing");
      return;
    }

    // ✅ nếu đã connect rồi
    if (stompClient && isConnected) {
      resolve(stompClient);
      return;
    }

    // ✅ nếu đang connect thì chờ
    if (isConnecting) {
      const interval = setInterval(() => {
        if (isConnected && stompClient) {
          clearInterval(interval);
          resolve(stompClient);
        }
      }, 100);
      return;
    }

    isConnecting = true;

    const socket = new SockJS(WS_URL);

    stompClient = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      debug: (str: string) => console.log("[WS]", str),
    });

    stompClient.onConnect = () => {
      console.log("✅ WebSocket connected");
      isConnected = true;
      isConnecting = false;

      // 🔔 subscribe notification 1 lần
      stompClient?.subscribe(`/topic/notifications/${userId}`, (msg: IMessage) => {
        try {
          const data = JSON.parse(msg.body);
          console.log("🔔 Received notification:", data);
          if (notificationCallback) {
            notificationCallback(data);
          } else {
            handleIncomingNotification(data);
          }
        } catch (err) {
          console.error("❌ Notification parse error", err);
        }
      });

      resolve(stompClient!);
    };

    stompClient.onWebSocketError = (err: Event) => {
      console.error("❌ WS error", err);
      isConnecting = false;
      reject(err);
    };

    stompClient.activate();
  });
};

// ==============================
// 🔄 COMPAT API (legacy callers)
// ==============================
export const connectWebSocket = async ({
  userId,
  jobIds = [],
  onNotification,
  onResult,
}: ConnectWebSocketOptions): Promise<() => void> => {
  if (onNotification) {
    notificationCallback = onNotification;
  }

  await initWebSocket(userId);

  const unsubscribers: Array<() => void> = [];
  if (onResult) {
    for (const jobId of jobIds) {
      unsubscribers.push(subscribeJob(jobId, (data) => onResult(jobId, data)));
    }
  }

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
};

// ==============================
// 🎯 SUBSCRIBE JOB
// ==============================
export const subscribeJob = (
  jobId: string,
  onResult: (data: any) => void
): (() => void) => {
  if (!stompClient || !isConnected) {
    throw new Error("WebSocket not connected");
  }

  // ❗ nếu đã subscribe rồi → không tạo lại
  if (jobSubscriptions.has(jobId)) {
    console.log("⚠️ Already subscribed:", jobId);
    return () => {};
  }

  const sub = stompClient.subscribe(`/topic/ai/${jobId}`, (message: IMessage) => {
    try {
      console.log("📨 Received job:", jobId);
      const data = JSON.parse(message.body);
      onResult(data);
    } catch (err) {
      console.error("❌ Parse error", err);
    }
  });

  jobSubscriptions.set(jobId, sub);

  console.log("✅ Subscribed job:", jobId);

  // ✅ cleanup
  return () => {
    const s = jobSubscriptions.get(jobId);
    if (s) {
      s.unsubscribe();
      jobSubscriptions.delete(jobId);
      console.log("🧹 Unsubscribed job:", jobId);
    }
  };
};

// ==============================
// BUDGET JOB SUBSCRIBE
// Dùng riêng cho BUDGET_ALLOCATION_PLAN
// ==============================

export const subscribeBudgetJob = (
  jobId: string,
  onResult: (data: BudgetAllocationAIMessage) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  if (!stompClient || !isConnected) {
    throw new Error("WebSocket not connected");
  }

  if (jobSubscriptions.has(jobId)) {
    console.log("⚠️ Already subscribed budget job:", jobId);
    return () => {};
  }

  const sub = stompClient.subscribe(`/topic/ai/${jobId}`, (message: IMessage) => {
    try {
      console.log("📨 Received budget job:", jobId);
      console.log("📨 Raw budget message:", message.body);

      const data = parseBudgetAIMessage(message.body);

      if (data.jobId !== jobId) {
        console.warn("⚠️ Ignore another job:", data.jobId);
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

  jobSubscriptions.set(jobId, sub);

  console.log("✅ Subscribed budget job:", jobId);

  return () => {
    const s = jobSubscriptions.get(jobId);

    if (s) {
      s.unsubscribe();
      jobSubscriptions.delete(jobId);

      console.log("🧹 Unsubscribed budget job:", jobId);
    }
  };
};

// ==============================
// 🔌 DISCONNECT
// ==============================
export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    isConnected = false;
    isConnecting = false;
    notificationCallback = null;
    jobSubscriptions.clear();

    console.log("🔌 WebSocket disconnected");
  }
};