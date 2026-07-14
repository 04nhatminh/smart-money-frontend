import AIAPI from "../api/ai.api";
import { waitForAIResult } from "./aiWebSocketHelper";
import PendingStorage from "../storage/pendingTransactionStorage";
import { CloudinaryService } from "./cloudinary.service";
import AIJobStorage, { AIJobRecord } from "../storage/aiJobStorage";
import { formatDateTime, parseDDMMYYYYHHMM } from "../utils/dateFormatter";
import { normalizeAIResult } from "../utils/normalizeAIResult";
import { pendingEventBus, ProcessingEvent, ProcessingStatus } from "../storage/pendingTransactionStorage";

/**
 * Parse and format date from AI result
 * Handles: ISO strings, timestamps, dd/MM/yyyy, or returns current time
 */
function formatAIDate(dateInput: any): string {
    if (!dateInput) {
        return formatDateTime(new Date());
    }

    try {
        let date: Date;

        if (typeof dateInput === "string") {
            // Try ISO format first (2026-06-08T14:30:00Z or 2026-06-08 14:30:00)
            if (dateInput.includes("T") || dateInput.includes("-")) {
                date = new Date(dateInput);
            } else if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                // Try dd/MM/yyyy or dd/MM/yyyy HH:mm format
                date = parseDDMMYYYYHHMM(dateInput);
            } else {
                // Try as timestamp
                const parsed = parseInt(dateInput, 10);
                date = new Date(isNaN(parsed) ? dateInput : parsed);
            }
        } else if (typeof dateInput === "number") {
            // Timestamp
            date = new Date(dateInput);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            return formatDateTime(new Date());
        }

        // Validate date
        if (isNaN(date.getTime())) {
            console.warn("⚠️ Invalid date from AI:", dateInput);
            return formatDateTime(new Date());
        }

        return formatDateTime(date);
    } catch (err) {
        console.error("❌ Date parsing error:", err);
        return formatDateTime(new Date());
    }
}

// Helper phát sự kiện
async function emitStatus(pendingId: string, status: ProcessingStatus, error?: string) {
    await PendingStorage.update(pendingId,{
        processingStatus: status,
        processingError: error,
    });
    const event: ProcessingEvent = { pendingId, status, error };
  pendingEventBus.emit('processing_update', event);
}


/**
 * Handle AI result processing in the background
 * - Wait for AI result (WS or polling)
 * - Update pending transaction with AI data
 * - Clean up cloudinary image
 */
export async function handleAIResultInBackground(
    jobId: string,
    pendingTxId: string,
    cloudinaryPublicId: string,
    source: "camera" | "voice"
) {
    let globalTimeout: ReturnType<typeof setTimeout> | null = null;
    let timedOut = false;

    // ✅ Save job record in case app dies
    const jobRecord: AIJobRecord = {
        jobId,
        pendingTxId,
        cloudinaryPublicId,
        createdAt: new Date().toISOString(),
        source
    };

    await AIJobStorage.add(jobRecord);

    try {
        console.log("🌀 Background AI handler started for job:", jobId);

        // ⏱️ Global timeout 90s
        globalTimeout = setTimeout(() => {
            timedOut = true;
            console.error("❌ Background timeout reached");
        }, 90000);

        // ✅ Try instant result first
        const instant = await AIAPI.getResult(jobId);

        if (instant?.success && instant.data) {
            console.log("⚡ AI instant result:", instant.data);
            if (globalTimeout) clearTimeout(globalTimeout);
            await AIJobStorage.remove(jobId); // ✅ Mark job as done
            return updatePendingTransaction(pendingTxId, instant.data, cloudinaryPublicId, source);
        }

        console.log("⏳ Waiting for WS result...");

        // ✅ Wait for WS result
        const waitPromise = waitForAIResult(jobId, 60000);
        const wsResult = await waitPromise;

        if (timedOut) {
            throw new Error("Processing timeout");
        }

        console.log("📊 WS result status:", wsResult.status);

        if (wsResult.status === "SUCCESS") {
            console.log("⚡ AI result via WS:", wsResult.data);
            if (globalTimeout) clearTimeout(globalTimeout);
            await AIJobStorage.remove(jobId); // ✅ Mark job as done
            return updatePendingTransaction(pendingTxId, wsResult.data, cloudinaryPublicId, source);
        }

        console.log("⚠️ WS timeout → fallback polling");

        // 🔄 Fallback polling with retry
        let fallbackAttempts = 0;
        const maxAttempts = 12; // 12 attempts × 5s = 60s

        while (fallbackAttempts < maxAttempts) {
            try {
                const fallback = await AIAPI.getResult(jobId);

                if (fallback?.success && fallback.data) {
                    console.log("⚡ AI result via fallback (attempt:", fallbackAttempts + 1, ")");
                    if (globalTimeout) clearTimeout(globalTimeout);
                    await AIJobStorage.remove(jobId); // ✅ Mark job as done
                    return updatePendingTransaction(pendingTxId, fallback.data, cloudinaryPublicId, source);
                }
            } catch (err: any) {
                if (err?.response?.status !== 404) {
                    throw err;
                }
            }

            fallbackAttempts++;

            if (fallbackAttempts < maxAttempts) {
                console.log(
                    "⏳ Fallback attempt",
                    fallbackAttempts,
                    "- waiting 5s..."
                );
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }

        console.error("❌ AI timeout - no response");
        throw new Error("AI processing timeout");

    } catch (error: any) {
        console.error("❌ Background handler error:", error?.message);

        // 🔙 Update pending transaction with error state
        const pending = PendingStorage.find(pendingTxId);
        if (pending) {
            await PendingStorage.remove(pendingTxId);
            console.log("🗑️ Removed failed pending transaction:", pendingTxId);
        }

    } finally {
        if (globalTimeout) clearTimeout(globalTimeout);

        // 🧹 Clean up cloudinary image
        if (cloudinaryPublicId) {
            try {
                await CloudinaryService.deleteImage(cloudinaryPublicId, "image");
                console.log("🗑️ Cleaned up cloudinary image");
            } catch (err) {
                console.error("❌ Cleanup error:", err);
            }
        }

        // ✅ Make sure job is removed from storage
        await AIJobStorage.remove(jobId);
    }
}

/**
 * Update pending transaction with AI result data
 */
async function updatePendingTransaction(
    pendingTxId: string,
    resultData: any,
    cloudinaryPublicId: string,
    source: "camera" | "voice"
) {
    try {
        const pending = PendingStorage.find(pendingTxId);

        if (!pending) {
            console.warn("⚠️ Pending transaction not found:", pendingTxId);
            return;
        }


        if (resultData?.error) {
            emitStatus(
                pendingTxId,
                "failed",
                resultData.error
            );

            // nếu muốn giữ pending để user thấy lỗi
            await PendingStorage.update(pendingTxId, {
                processingStatus: "failed",
                processingError: resultData.error,
            });

            return;
        }

        // ✅ Remove old one
        await PendingStorage.remove(pendingTxId);


        const created = [];

        const normalized = normalizeAIResult(resultData);

        console.log("debug1:", normalized)

        for (const tx of normalized.transactions) {
            const pending = await PendingStorage.add({
                amount: tx.expense,
                category: tx.category,
                type: tx.type,
                date: formatAIDate(normalized.date),

                source,

                groupId: normalized.jobId,
                groupText: tx.description,
            });

            created.push(pending);
        }

        created.forEach(tx => emitStatus(tx.id, "completed"));

        console.log("📊 AI data:", resultData);

    } catch (error: any) {
        console.error("❌ Update pending error:", error?.message);
        emitStatus(pendingTxId, 'failed', error?.message || "Failed to update transaction with AI data");
    }
}

/**
 * Resume unfinished AI jobs from storage (call on app restart)
 * This prevents jobs from being lost if app dies
 */
export async function resumeUnfinishedJobs() {
    try {
        console.log("🔄 Resuming unfinished AI jobs...");

        await AIJobStorage.load();
        const jobs = AIJobStorage.getAll();

        console.log("📋 Found", jobs.length, "unfinished jobs");

        for (const job of jobs) {
            console.log("▶️ Resuming job:", job.jobId);

            // Resume each job without awaiting
            handleAIResultInBackground(
                job.jobId,
                job.pendingTxId,
                job.cloudinaryPublicId,
                job.source
            ).catch((err) => {
                console.error("❌ Resume job error:", err);
            });
        }

    } catch (error: any) {
        console.error("❌ Resume unfinished jobs error:", error?.message);
    }
}

export async function handleFullAIFlowInBackground(
    photoUri: string,
    pendingTxId: string,
    source: "camera" | "voice"
) {
    let publicId = "";

    try {
        console.log("🌀 Start full AI flow");


        // Upload image
        emitStatus(pendingTxId, 'uploading', 'Uploading receipt image...');
        const upload = await CloudinaryService.uploadReceiptImage(photoUri);
        publicId = upload.publicId;

        // 📤 Submit AI
        emitStatus(pendingTxId, 'ai_submitting', 'Submitting to AI...');
        const submit = await AIAPI.submitImageReceipt(upload.fileUrl);
        if (!submit.success || !submit.data) {
            throw new Error("Failed to submit AI job");
        }

        const jobId = submit.data.jobId;

        // 🧠 Wait result (reuse code cũ)
        emitStatus(pendingTxId, 'ai_processing', 'AI processing receipt...');
        await handleAIResultInBackground(jobId, pendingTxId, publicId, source);

    } catch (err) {
        console.error("❌ Full flow error:", err);

    } finally {
        // 🧹 Clean up image if it was uploaded
        if (publicId) {
            try {
                await CloudinaryService.deleteImage(publicId, "image");
                console.log("🗑️ Cleaned up cloudinary image after full flow");
            } catch (err) {
                console.error("❌ Cleanup error after full flow:", err);
            }
        }
    }

   
}

 export async function handleFullVoiceAIFlowInBackground(
        audioUri: string,
        pendingTxId: string,
        source: "camera" | "voice"
    ) {
        let publicId = "";

        try {
            console.log("🌀 Start full VOICE AI flow");

            // 📤 Upload audio
            emitStatus(pendingTxId, 'uploading', 'Uploading audio...');
            const upload = await CloudinaryService.uploadTransactionVoice(audioUri);
            publicId = upload.publicId;

            // 📤 Submit AI
            emitStatus(pendingTxId, 'ai_submitting', 'Submitting to AI...');
            const submit = await AIAPI.submitVoiceAudio(upload.fileUrl);

            if (!submit.success || !submit.data) {
                throw new Error("Failed to submit voice");
            }

            const jobId = submit.data.jobId;

            // 🧠 Reuse existing handler
            emitStatus(pendingTxId, 'ai_processing', 'AI processing voice...');
            await handleAIResultInBackground(jobId, pendingTxId, publicId, source);

        } catch (err) {
            console.error("❌ Full voice flow error:", err);
            emitStatus(pendingTxId, 'failed', undefined);

        } finally {
            // 🧹 Clean up audio if it was uploaded
            if (publicId) {
                try {
                    await CloudinaryService.deleteImage(publicId, "voice");
                    console.log("🗑️ Cleaned up cloudinary audio after full flow");
                } catch (err) {
                    console.error("❌ Cleanup error after full voice flow:", err);
                }
            }
        }
    }
