import AsyncStorage from "@react-native-async-storage/async-storage";
import SockJS from "sockjs-client";
import { Client, IMessage, StompSubscription } from "@stomp/stompjs";

import { handleIncomingNotification } from "../notification/notificationHandler";
import  PendingStorage, {ProcessingStatus, ProcessingEvent, pendingEventBus} from "../storage/pendingTransactionStorage";

import {
  BudgetAllocationAIMessage,
  BudgetAllocationCategory,
  BudgetAllocationResult,
  RawBudgetAllocationAIMessage,
} from "../types/project.types";
import { normalizeAIResult } from "../utils/normalizeAIResult";
import DeduplicationService from "../utils/DeduplicationService";
import TransactionParser from "../utils/transactionParser";
import { formatDateTime } from "../utils/dateFormatter";
import { TransactionType } from "../types/transaction.types";
import { CloudinaryService } from "./cloudinary.service";
import AIAPI from "../api/ai.api";

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
const processingJobs = new Set<string>();
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

// Helper phát sự kiện
async function emitStatus(pendingId: string, status: ProcessingStatus, error?: string) {
    await PendingStorage.update(pendingId, {
        processingStatus: status,
        processingError: error,
    });
    const event: ProcessingEvent = { pendingId, status, error };
    pendingEventBus.emit('processing_update', event);
}

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

      // Pending nào còn kẹt ở trạng thái processing (app bị kill / miss WS event)
      // thì rebind job + poll lại kết quả, không đợi user mở Pending Modal.
      recoverPendingJobs();

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
// 🎯 AI RESULT HANDLER (dùng chung cho WS message + recovery poll)
// ==============================
// jobMap chỉ nằm trong RAM — sau khi app bị kill phải fallback qua jobId persist trên item.
const resolvePendingId = (jobId: string): string | undefined => {
  return PendingStorage.getPendingId(jobId) ?? PendingStorage.findByJobId(jobId)?.id;
};

// Export để background task (headless, không có WS) tái sử dụng khi poll được kết quả.
export const handleAIResultData = async (data: any) => {
  const jobId: string | null = data?.jobId ?? null;

  if (!jobId) {
    console.warn("Missing jobId");
    return;
  }

  if (processingJobs.has(jobId)) {
    console.log("⏭️ Job already processing:", jobId);
    return;
  }

  processingJobs.add(jobId);

  try {
    const pendingId = resolvePendingId(jobId);
    let source: "camera" | "voice" | "notification" = "notification";

    if (pendingId) {

      const pending = PendingStorage.find(pendingId);

      if (pending) {

        source = pending.source;
      }
    }

    // Job FAILED → mở khóa pending (failed không còn isProcessing) để user reject/sửa được
    const jobStatus = String(data?.status ?? "").toUpperCase();

    if (jobStatus === "FAILED") {
      console.error("❌ AI job failed:", jobId);

      if (pendingId) {
        await emitStatus(pendingId, "failed", data?.error ?? "AI processing failed");
        PendingStorage.unbindJob(jobId);
      }

      const failCallback = jobCallbacks.get(jobId);
      if (failCallback) {
        failCallback(data);
      } else {
        pendingJobMessages.set(jobId, data);
      }
      return;
    }

    const normalized = normalizeAIResult(data);

    console.log("Normalized AI result:", JSON.stringify(normalized, null, 2));



    if (pendingId) {
      const pending = PendingStorage.find(pendingId);

      if (pending?.cloudinaryPublicId) {
        await CloudinaryService.deleteImage(
          pending.cloudinaryPublicId,
          pending.cloudinaryResourceType!
        );
      }

      await PendingStorage.remove(pendingId);
      PendingStorage.unbindJob(jobId);
    }

    for (const tx of normalized.transactions) {
      const amount = TransactionParser.parseAmount(tx.expense);

      console.log("check")

      if (amount === null || amount <= 0) {
        continue;
      }

      const candidateDate = normalized.date || formatDateTime(new Date());

      const candidate = {
        amount,
        category: tx.category,
        type: tx.type as TransactionType,
        groupText: tx.description,
        date: candidateDate,
        source,
        jobId
      };

      // 1. Duplicate trong bộ nhớ
      if (DeduplicationService.findDuplicate(candidate)) {
        console.log("⏭️ Duplicate (memory)");
        continue;
      }

      // 2. Duplicate với PendingStorage
      const pendingItems = PendingStorage.getAll();

      const duplicated = pendingItems.some(item => {
        return (
          item.amount === candidate.amount &&
          item.type === candidate.type &&
          Math.abs(
            new Date(item.date).getTime() -
            new Date(candidate.date).getTime()
          ) < 60 * 1000
        );
      });

      if (duplicated) {
        console.log("⏭️ Duplicate (pending storage)");
        continue;
      }

      DeduplicationService.markProcessed(candidate);

      await PendingStorage.add(candidate);
    }

    const callback = jobCallbacks.get(jobId);
    if (callback) {
      callback(data);
    } else {
      console.warn("⚠️ No callback registered for job:", jobId);
      pendingJobMessages.set(jobId, data);
    }
  } catch (err) {
    console.error("❌ Parse error", err);
  }
  finally {
    processingJobs.delete(jobId);
  }
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
    async (msg: IMessage) => {
      try {
        const data = JSON.parse(msg.body);
        await handleAIResultData(data);
      } catch (err) {
        console.error("❌ Parse error", err);
      }
    }
  );
};

// ==============================
// 🎯 PENDING JOB RECOVERY
// Xử lý pending bị kẹt ở uploading/ai_submitting/ai_processing:
// app bị kill giữa chừng hoặc WS event tới lúc app không chạy.
// ==============================
export const IN_PROGRESS_STATUSES: ProcessingStatus[] = [
  "uploading",
  "ai_submitting",
  "ai_processing",
];

// Item bị kill trước khi submit xong job: nếu còn file gốc trên máy thì
// chạy lại toàn bộ flow (re-upload + submit) thay vì đánh failed.
// Lazy require để tránh vòng import (backgroundAIHandler import watchPendingJob từ file này).
export const resumeInterruptedFlow = (item: {
  id: string;
  source: "camera" | "voice" | "notification";
  localFileUri?: string;
}): boolean => {
  if (!item.localFileUri) return false;

  const {
    handleFullAIFlowInBackground,
    handleFullVoiceAIFlowInBackground,
  } = require("./backgroundAIHandler");

  console.log("♻️ Resuming interrupted flow:", item.id, item.source);

  if (item.source === "voice") {
    handleFullVoiceAIFlowInBackground(item.localFileUri, item.id, "voice").catch(
      (err: unknown) => console.error("❌ Resume voice flow error:", err)
    );
  } else {
    handleFullAIFlowInBackground(item.localFileUri, item.id, "camera").catch(
      (err: unknown) => console.error("❌ Resume camera flow error:", err)
    );
  }

  return true;
};

const recoveringJobs = new Set<string>();

const RECOVERY_POLL_ATTEMPTS = 6;
const RECOVERY_POLL_DELAY = 5000;

const pollRecoveredJob = async (jobId: string, pendingId: string) => {
  if (recoveringJobs.has(jobId)) return;
  recoveringJobs.add(jobId);

  try {
    for (let i = 0; i < RECOVERY_POLL_ATTEMPTS; i++) {
      // Item có thể đã được WS resolve trong lúc chờ poll
      const current = PendingStorage.find(pendingId);
      if (!current || !IN_PROGRESS_STATUSES.includes(current.processingStatus!)) {
        return;
      }

      try {
        const res = await AIAPI.getResult(jobId);

        if (res?.success && res.data) {
          console.log("♻️ Recovered AI result for job:", jobId);
          await handleAIResultData({ ...res.data, jobId: res.data?.jobId ?? jobId });
          return;
        }
      } catch (err) {
        console.warn("⚠️ Recovery poll error:", jobId, err);
      }

      await new Promise((r) => setTimeout(r, RECOVERY_POLL_DELAY));
    }

    // Cách cuối: force get result qua getJobResult (không coi 404 là "đang xử lý")
    const beforeForce = PendingStorage.find(pendingId);
    if (beforeForce && IN_PROGRESS_STATUSES.includes(beforeForce.processingStatus!)) {
      try {
        console.log("🔨 Force getting job result:", jobId);
        const forced = await AIAPI.getJobResult(jobId);

        if (forced) {
          await handleAIResultData({ ...forced, jobId: forced?.jobId ?? jobId });
          return;
        }
      } catch (err) {
        console.warn("⚠️ Force get result failed:", jobId, err);
      }
    }

    // Force get cũng không cứu được → đánh dấu failed để user approve/reject được
    const still = PendingStorage.find(pendingId);
    if (still && IN_PROGRESS_STATUSES.includes(still.processingStatus!)) {
      console.warn("⚠️ Job unrecoverable, marking failed:", jobId);
      await emitStatus(pendingId, "failed", "AI result unavailable");
      PendingStorage.unbindJob(jobId);
    }
  } finally {
    recoveringJobs.delete(jobId);
  }
};

// Watchdog cho job vừa submit: WS được ưu tiên xử lý trước (grace period),
// quá hạn không thấy kết quả thì tự poll getResult → force getJobResult → failed.
// Gọi ngay sau bindJob để không phụ thuộc user đang mở màn hình nào.
export const watchPendingJob = (
  jobId: string,
  pendingId: string,
  graceMs = 15000
) => {
  setTimeout(() => {
    pollRecoveredJob(jobId, pendingId).catch((err) =>
      console.error("❌ watchPendingJob error:", err)
    );
  }, graceMs);
};

const recoverPendingJobs = async () => {
  try {
    await PendingStorage.load();

    const stuckItems = PendingStorage.getAll().filter(
      (item) =>
        item.processingStatus &&
        IN_PROGRESS_STATUSES.includes(item.processingStatus)
    );

    if (stuckItems.length === 0) return;

    console.log("♻️ Recovering stuck pending transactions:", stuckItems.length);

    for (const item of stuckItems) {
      if (!item.jobId) {
        // Bị kill trước khi submit job → resume từ file gốc nếu còn,
        // không còn file mới đánh failed.
        if (!resumeInterruptedFlow(item)) {
          await emitStatus(item.id, "failed", "Processing was interrupted");
        }
        continue;
      }

      // Rebind để nếu WS còn bắn kết quả thì handler vẫn tìm được pending
      PendingStorage.bindJob(
        item.jobId,
        item.id,
        item.cloudinaryPublicId,
        item.cloudinaryResourceType
      );

      pollRecoveredJob(item.jobId, item.id);
    }
  } catch (err) {
    console.error("❌ Recover pending jobs error:", err);
  }
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
    return () => { };
  }

  // ✅ ĐẢM BẢO WS READY
  await initWebSocket(currentUserId);

  if (jobCallbacks.has(jobId)) {
    console.log("⚠️ Already subscribed:", jobId);
    return () => { };
  }

  jobCallbacks.set(jobId, onResult);

  const pending = pendingJobMessages.get(jobId);

  if (pending) {
    pendingJobMessages.delete(jobId);

    console.log("⚡ Deliver cached result:", jobId);

    onResult(pending);
  }

  console.log("✅ Registered callback for job:", jobId);

  return () => {
    jobCallbacks.delete(jobId);
    console.log("🧹 Unregistered callback for job:", jobId);
  };
};

export const waitForAIResult = async (
  jobId: string,
  timeoutMs: number = 10000
): Promise<{ status: "SUCCESS" | "TIMEOUT"; data?: any }> => {
  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe: (() => void) | null = null;

    const clearSubscription = () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };

    const settle = (status: "SUCCESS" | "TIMEOUT", data?: any) => {
      if (settled) return;

      settled = true;
      clearTimeout(timeoutId);
      clearSubscription();
      resolve({ status, data });
    };

    const timeoutId = setTimeout(() => {
      console.log("⚠️ WS timeout → fallback polling");
      settle("TIMEOUT");
    }, timeoutMs);

    subscribeJob(jobId, (data) => {
      console.log("🔥 WS CALLBACK:", data);
      settle("SUCCESS", data);
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch((err) => {
        console.error("❌ Subscription error:", err);
        settle("TIMEOUT");
      });
  });
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

// ==============================
// 🎯 GENERIC TOPIC SUBSCRIBE
// ==============================
export const subscribeToTopic = (
  topic: string,
  onMessage: (data: any) => void
): (() => void) => {
  if (!stompClient || !isConnected) {
    console.warn("⚠️ WebSocket not connected, cannot subscribe to:", topic);
    return () => { };
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
