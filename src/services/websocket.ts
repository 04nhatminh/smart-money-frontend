import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import { handleIncomingNotification } from "../notification/notificationHandler";

// ==============================
// STATE
// ==============================
let stompClient: Client | null = null;
let isConnected = false;
let isConnecting = false;
let currentUserId: string | null = null;

const jobSubscriptions = new Map<
  string,
  { sub: StompSubscription; callback: (data: any) => void }
>();

let notificationSub: StompSubscription | null = null;

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const WS_URL: string | null = BASE_URL ? `${BASE_URL}/ws` : null;

// ==============================
// INIT
// ==============================
export const initWebSocket = (userId: string): Promise<Client> => {
  return new Promise((resolve, reject) => {
    if (!WS_URL) return reject("❌ WS_URL missing");

    // 🔥 nếu user đổi → reset WS
    if (currentUserId && currentUserId !== userId) {
      disconnectWebSocket();
    }

    currentUserId = userId;

    if (stompClient && isConnected) {
      return resolve(stompClient);
    }

    if (isConnecting) {
      const interval = setInterval(() => {
        if (isConnected && stompClient) {
          clearInterval(interval);
          resolve(stompClient);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        reject("❌ Connection timeout");
      }, 10000);

      return;
    }

    isConnecting = true;

    stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,

      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug: (str) => console.log("[WS]", str),
    });

    // ==========================
    // CONNECT
    // ==========================
    stompClient.onConnect = () => {
      console.log("✅ WebSocket connected");

      isConnected = true;
      isConnecting = false;

      // 🔔 subscribe notification
      subscribeNotifications();

      // 🔁 resubscribe jobs
      jobSubscriptions.forEach((value, jobId) => {
        console.log("🔁 Resubscribe job:", jobId);
        internalSubscribeJob(jobId, value.callback);
      });

      resolve(stompClient!);
    };

    // ==========================
    // DISCONNECT
    // ==========================
    stompClient.onDisconnect = () => {
      console.log("🔌 WebSocket disconnected");
      isConnected = false;
    };

    stompClient.onWebSocketError = (err) => {
      console.error("❌ WS error", err);
      isConnecting = false;
      reject(err);
    };

    stompClient.activate();
  });
};

// ==============================
// 🔔 NOTIFICATION SUBSCRIBE
// ==============================
const subscribeNotifications = () => {
  if (!stompClient || !isConnected || !currentUserId) return;

  if (notificationSub) {
    notificationSub.unsubscribe();
  }

  notificationSub = stompClient.subscribe(
    `/topic/notifications/${currentUserId}`,
    (msg: IMessage) => {
      try {
        const data = JSON.parse(msg.body);
        console.log("🔔 Notification:", data);
        handleIncomingNotification(data);
      } catch (err) {
        console.error("❌ Notification parse error", err);
      }
    }
  );
};

// ==============================
// 🎯 SUBSCRIBE JOB
// ==============================
const internalSubscribeJob = (
  jobId: string,
  callback: (data: any) => void
) => {
  if (!stompClient || !isConnected) return;

  const sub = stompClient.subscribe(`/topic/ai/${jobId}`, (message) => {
    try {
      const data = JSON.parse(message.body);
      callback(data);
    } catch (err) {
      console.error("❌ Parse error", err);
    }
  });

  jobSubscriptions.set(jobId, { sub, callback });
};

export const subscribeJob = (
  jobId: string,
  onResult: (data: any) => void
): (() => void) => {
  if (!stompClient || !isConnected) {
    console.warn("⚠️ WS not ready → skip subscribe:", jobId);
    return () => {};
  }

  if (jobSubscriptions.has(jobId)) {
    console.log("⚠️ Already subscribed:", jobId);
    return () => {};
  }

  internalSubscribeJob(jobId, onResult);

  console.log("✅ Subscribed job:", jobId);

  return () => {
    const item = jobSubscriptions.get(jobId);
    if (item) {
      item.sub.unsubscribe();
      jobSubscriptions.delete(jobId);
      console.log("🧹 Unsubscribed job:", jobId);
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
  }

  isConnected = false;
  isConnecting = false;
  currentUserId = null;

  jobSubscriptions.forEach((item) => item.sub.unsubscribe());
  jobSubscriptions.clear();

  if (notificationSub) {
    notificationSub.unsubscribe();
    notificationSub = null;
  }

  console.log("🔌 WebSocket fully cleaned");
};