import AsyncStorage from "@react-native-async-storage/async-storage";
import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

import { handleIncomingNotification } from "../notification/notificationHandler";

import {
  BudgetAllocationAIMessage,
  BudgetAllocationCategory,
  BudgetAllocationResult,
  RawBudgetAllocationAIMessage,
} from "../types/project.types";

// ==============================
// STATE
// ==============================
let stompClient: Client | null = null;

let isConnected = false;
let isConnecting = false;

let currentUserId: string | null = null;

let connectPromise: Promise<Client> | null = null;
// Store job callbacks keyed by jobId
const jobCallbacks = new Map<string, (data: any) => boolean | void>();

let notificationSub: StompSubscription | null = null;
let aiUserSub: StompSubscription | null = null;

const pendingJobMessages = new Map<string, any>();

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const buildWsUrl = (baseUrl?: string): string | null => {
  if (!baseUrl) return null;

  const normalizedBaseUrl = baseUrl
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/$/, "");

  return `${normalizedBaseUrl}/ws`;
};

const WS_URL: string | null = buildWsUrl(BASE_URL);

// ==============================
// HELPERS
// ==============================
const parseJson = <T,>(raw: string): T => {
  return JSON.parse(raw) as T;
};

const safeParseJson = (value: unknown) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeBudgetAllocationCategories = (
  categories: unknown
): BudgetAllocationCategory[] => {
  if (!Array.isArray(categories)) return [];

  return categories.map((item: any) => ({
    category: String(
      item?.category ??
        item?.categoryName ??
        item?.name ??
        "OTHER"
    ),
    amount: Number(
      item?.amount ??
        item?.allocatedAmount ??
        item?.allocated_amount ??
        item?.amountLimit ??
        item?.budget ??
        item?.limit ??
        0
    ),
    percentage:
      item?.percentage != null
        ? Number(item.percentage)
        : item?.ratioPercent != null
          ? Number(item.ratioPercent)
          : item?.ratio != null
            ? Number(item.ratio) * 100
            : undefined,
    reason: item?.reason ?? item?.description ?? item?.explanation,
  }));
};

const normalizeBudgetAllocationResult = (
  rawData: any,
  parsedResult: any
): BudgetAllocationResult | undefined => {
  const source =
    parsedResult ?? rawData?.result ?? rawData?.data ?? rawData?.budgets;
  const rawCategories = Array.isArray(source)
    ? source
    : source?.categories ?? source?.budgets ?? source?.data;

  console.log(
    "First budget category:",
    JSON.stringify(
      Array.isArray(rawCategories) ? rawCategories[0] : undefined,
      null,
      2
    )
  );

  if (!Array.isArray(rawCategories)) return undefined;

  const categories = normalizeBudgetAllocationCategories(rawCategories);

  return {
    totalBudget: Number(
      source?.totalBudget ??
        source?.total_budget ??
        source?.totalAmount ??
        categories.reduce((sum, item) => sum + item.amount, 0)
    ),
    currency: source?.currency ?? rawData?.currency ?? "VND",
    categories,
  };
};

const parseBudgetAIMessage = (
  rawData: RawBudgetAllocationAIMessage
): BudgetAllocationAIMessage => {
  const rawPayload = rawData as any;

  const rawResult =
    rawPayload.result ?? rawPayload.data ?? rawPayload.budgets ?? null;

  const parsedResult = safeParseJson(rawResult);
  const normalizedResult = normalizeBudgetAllocationResult(
    rawPayload,
    parsedResult
  );

  return {
    ...rawData,
    duty: rawPayload.duty ?? "BUDGET_ALLOCATION_PLAN",
    type: rawPayload.type ?? "BUDGET_ALLOCATION_RESULT",
    status: rawPayload.status ?? "PROCESSING",
    result: normalizedResult,
  };
};

const isClientReady = () => {
  return Boolean(stompClient && isConnected && currentUserId);
};

const removeJob = (jobId: string) => {
  jobCallbacks.delete(jobId);
  pendingJobMessages.delete(jobId);
};

// ==============================
// INIT
// ==============================
export const initWebSocket = async (userId: string): Promise<Client> => {
  if (!WS_URL) {
    return Promise.reject("❌ WS_URL missing");
  }

  if (currentUserId && currentUserId !== userId) {
    disconnectWebSocket();
  }

  currentUserId = userId;

  if (stompClient && isConnected) {
    return stompClient;
  }

  if (connectPromise) {
    return connectPromise;
  }

  const token = await AsyncStorage.getItem("accessToken");

  connectPromise = new Promise((resolve, reject) => {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),

      connectHeaders: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug: (str) => {
        console.log("[WS]", str);
      },
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

    stompClient.onWebSocketClose = (event) => {
      console.log("🔌 WebSocket closed:", event.reason || event.code);

      isConnected = false;
      connectPromise = null;
    };

    stompClient.onStompError = (frame) => {
      console.error("❌ STOMP error:", frame.headers.message);
      console.error("❌ STOMP details:", frame.body);

      isConnected = false;
      connectPromise = null;

      reject(frame);
    };

    stompClient.onWebSocketError = (err) => {
      console.error("❌ WS error:", err);

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
// Topic: /topic/notifications/{userId}
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
        return false;
      }

      const status = String((data as any).status ?? "").toUpperCase();
      const type = String((data as any).type ?? "");

      const rawPayload = data as any;

      const hasResult = Boolean(rawPayload.result);

      const isCompleted =
        type === "BUDGET_ALLOCATION_RESULT" &&
        status === "COMPLETED" &&
        hasResult;

      const isFailed = status === "FAILED";

      if (isFailed) {
        console.error("❌ Budget job failed:", data);

        onError?.(data);

        return true;
      }

      if (!isCompleted) {
        console.warn("⚠️ Budget job not completed yet:", data);

        return false;
      }

      console.log("✅ Parsed budget result:", data);

      console.log("5. Normalized budget:", JSON.stringify(data.result, null, 2));

      onResult(data);

      return true;
    } catch (err) {
      console.error("❌ Budget websocket parse error:", err);

      onError?.(err);



      return true;
    }
  });
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
