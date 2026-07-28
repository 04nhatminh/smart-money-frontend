import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as Notifications from "expo-notifications";

import PendingStorage from "../storage/pendingTransactionStorage";
import { tokenStorage } from "../storage/tokenStorage";
import AIAPI from "../api/ai.api";
import {
  handleAIResultData,
  IN_PROGRESS_STATUSES,
} from "./websocket";
import {
  handleFullAIFlowInBackground,
  handleFullVoiceAIFlowInBackground,
} from "./backgroundAIHandler";

// ==============================
// 🌙 PENDING TX BACKGROUND TASK
//
// handleFullAIFlowInBackground chỉ "background" trong JS thread — app bị kill
// là mất. Task này chạy headless qua expo-task-manager (Android: WorkManager,
// stopOnTerminate=false nên vẫn chạy định kỳ sau khi user kill app; iOS: BG fetch
// theo heuristic của hệ thống) để:
//   1. Poll kết quả AI cho pending đã có jobId (không cần WebSocket).
//   2. Resume upload + submit cho pending bị kill trước khi có jobId
//      (nhờ localFileUri đã persist).
// ==============================

export const PENDING_TX_TASK = "pending-transaction-background-task";

// Phải define ở global scope (module top-level) để headless JS tìm thấy task
// sau khi app bị kill — không được define trong component/effect.
TaskManager.defineTask(PENDING_TX_TASK, async () => {
  try {
    console.log("🌙 [BG] Pending tx background task started");

    // Chưa đăng nhập → không có gì để làm
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    await PendingStorage.load();

    const stuckItems = PendingStorage.getAll().filter(
      (item) =>
        item.processingStatus &&
        IN_PROGRESS_STATUSES.includes(item.processingStatus)
    );

    if (stuckItems.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log("🌙 [BG] Stuck pending items:", stuckItems.length);

    let resolvedCount = 0;
    let resumedCount = 0;

    for (const item of stuckItems) {
      if (item.jobId) {
        // jobMap trong RAM đã mất sau kill → rebind để handleAIResultData
        // resolve được pendingId từ jobId.
        PendingStorage.bindJob(
          item.jobId,
          item.id,
          item.cloudinaryPublicId,
          item.cloudinaryResourceType
        );

        try {
          const res = await AIAPI.getResult(item.jobId);

          if (res?.success && res.data) {
            await handleAIResultData({
              ...res.data,
              jobId: res.data?.jobId ?? item.jobId,
            });
            resolvedCount++;
          }
          // res === null → AI chưa xong, chờ chu kỳ fetch sau
        } catch (err) {
          console.warn("⚠️ [BG] Poll job failed:", item.jobId, err);
        }
      } else if (item.localFileUri) {
        // Bị kill trước khi submit job → chạy lại flow từ file gốc.
        // Await để headless context sống đủ lâu cho upload + submit xong.
        try {
          if (item.source === "voice") {
            await handleFullVoiceAIFlowInBackground(item.localFileUri, item.id, "voice");
          } else {
            await handleFullAIFlowInBackground(item.localFileUri, item.id, "camera");
          }
          resumedCount++;
        } catch (err) {
          console.warn("⚠️ [BG] Resume flow failed:", item.id, err);
        }
      }
    }

    if (resolvedCount > 0) {
      await notifyPendingProcessed(resolvedCount);
    }

    console.log(
      `🌙 [BG] Done — resolved: ${resolvedCount}, resumed: ${resumedCount}`
    );

    return resolvedCount > 0 || resumedCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error("❌ [BG] Background task error:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const notifyPendingProcessed = async (count: number) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Giao dịch đã được xử lý",
        body:
          count === 1
            ? "1 giao dịch từ ảnh/giọng nói đã sẵn sàng. Mở app để xác nhận."
            : `${count} giao dịch từ ảnh/giọng nói đã sẵn sàng. Mở app để xác nhận.`,
      },
      trigger: null,
    });
  } catch (err) {
    console.warn("⚠️ [BG] Notify failed:", err);
  }
};

export const registerPendingTxBackgroundTask = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();

    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn("⚠️ Background fetch unavailable:", status);
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(PENDING_TX_TASK);
    if (isRegistered) {
      return;
    }

    await BackgroundFetch.registerTaskAsync(PENDING_TX_TASK, {
      minimumInterval: 15 * 60, // hệ thống không cho chạy dày hơn ~15 phút
      stopOnTerminate: false, // Android: tiếp tục chạy sau khi user kill app
      startOnBoot: true, // Android: tự chạy lại sau khi reboot máy
    });

    console.log("✅ Pending tx background task registered");
  } catch (err) {
    console.error("❌ Register background task failed:", err);
  }
};

export const unregisterPendingTxBackgroundTask = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(PENDING_TX_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(PENDING_TX_TASK);
    }
  } catch (err) {
    console.warn("⚠️ Unregister background task failed:", err);
  }
};
