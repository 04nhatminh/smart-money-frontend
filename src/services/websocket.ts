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

// Store job callbacks keyed by jobId
const jobCallbacks = new Map<
  string,
  (data: any) => void
>();

let notificationSub: StompSubscription | null = null;
let aiUserSub: StompSubscription | null = null;

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const WS_URL: string | null = BASE_URL ? `${BASE_URL}/ws` : null;

// ==============================
// INIT
// ==============================
let connectPromise: Promise<Client> | null = null;

export const initWebSocket = (userId: string): Promise<Client> => {
  if (!WS_URL) return Promise.reject("❌ WS_URL missing");

  // ✅ nếu đã connect → dùng lại
  if (stompClient && isConnected) {
    return Promise.resolve(stompClient);
  }

  // ✅ nếu đang connect → return promise cũ
  if (connectPromise) {
    return connectPromise;
  }

  currentUserId = userId;

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

    stompClient.onWebSocketError = (err) => {
      console.error("❌ WS error", err);
      connectPromise = null;
      reject(err);
    };

    stompClient.activate();
  });

  return connectPromise;
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
// 🎯 USER AI TOPIC SUBSCRIBE
// ==============================
const subscribeUserAI = () => {
  if (!stompClient || !isConnected || !currentUserId) return;

  if (aiUserSub) {
    aiUserSub.unsubscribe();
  }

  aiUserSub = stompClient.subscribe(
    `/topic/ai/user/${currentUserId}`,
    (msg: IMessage) => {
      try {
        const data = JSON.parse(msg.body);
        const jobId = data.jobId;

        console.log("🎯 AI result for job:", jobId);

        // Route to the registered callback for this job
        const callback = jobCallbacks.get(jobId);
        if (callback) {
          callback(data);
          jobCallbacks.delete(jobId); // ✅ Unregister after callback is called
        } else {
          console.warn("⚠️ No callback registered for job:", jobId);
        }
      } catch (err) {
        console.error("❌ Parse error", err);
      }
    }
  );
};

// ==============================
// 🎯 JOB CALLBACK MANAGEMENT
// ==============================
export const subscribeJob = async (
  jobId: string,
  onResult: (data: any) => void
): Promise<() => void> => {

  if (!currentUserId) {
    console.warn("⚠️ No userId");
    return () => {};
  }

  // ✅ ĐẢM BẢO WS READY
  await initWebSocket(currentUserId);

  if (jobCallbacks.has(jobId)) {
    console.log("⚠️ Already subscribed:", jobId);
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

  jobCallbacks.clear();

  if (notificationSub) {
    notificationSub.unsubscribe();
    notificationSub = null;
  }

  if (aiUserSub) {
    aiUserSub.unsubscribe();
    aiUserSub = null;
  }

  console.log("🔌 WebSocket fully cleaned");
};

// ==============================
// 🎯 GENERIC TOPIC SUBSCRIBE
// ==============================
export const subscribeToTopic = (
  topic: string,
  onMessage: (data: any) => void
): (() => void) => {
  if (!stompClient || !isConnected) {
    console.warn("⚠️ WebSocket not connected, cannot subscribe to:", topic);
    return () => {};
  }

  console.log("📡 Subscribing to topic:", topic);
  const sub = stompClient.subscribe(topic, (msg: IMessage) => {
    try {
      const data = JSON.parse(msg.body);
      onMessage(data);
    } catch (err) {
      console.error(`❌ Parse error on topic ${topic}:`, err);
    }
  });

  return () => {
    console.log("🧹 Unsubscribing from topic:", topic);
    sub.unsubscribe();
  };
};