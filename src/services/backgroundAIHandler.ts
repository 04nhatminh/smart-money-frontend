import AIAPI from "../api/ai.api";
import { waitForAIResult, watchPendingJob } from "./websocket";
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
    await PendingStorage.update(pendingId, {
        processingStatus: status,
        processingError: error,
    });
    const event: ProcessingEvent = { pendingId, status, error };
    pendingEventBus.emit('processing_update', event);
}

export async function handleFullAIFlowInBackground(
    photoUri: string,
    pendingTxId: string,
    source: "camera" | "voice"
) {
    let publicId = "";
    let submitted = false;

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

        PendingStorage.bindJob(
            jobId,
            pendingTxId,
            upload.publicId,
            "image"
        );

        // Watchdog: WS miss kết quả thì tự poll / force get, không để kẹt ai_processing
        watchPendingJob(jobId, pendingTxId);

        submitted = true;
        return;
    } catch (err) {
        console.error("❌ Full flow error:", err);
        emitStatus(pendingTxId, 'failed', undefined);

    } finally {
        // 🧹 Chỉ dọn ảnh khi flow fail — AI worker cần file còn tồn tại để xử lý;
        // submit thành công thì handleAIResultData dọn sau khi có kết quả.
        if (publicId && !submitted) {
            try {
                await CloudinaryService.deleteImage(publicId, "image");
                console.log("🗑️ Cleaned up cloudinary image after failed flow");
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
    let submitted = false;

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

        PendingStorage.bindJob(
            jobId,
            pendingTxId,
            upload.publicId,
            "voice"
        );

        // Watchdog: WS miss kết quả thì tự poll / force get, không để kẹt ai_processing
        watchPendingJob(jobId, pendingTxId);

        submitted = true;
        return;

    } catch (err) {
        console.error("❌ Full voice flow error:", err);
        emitStatus(pendingTxId, 'failed', undefined);

    } finally {
        // 🧹 Chỉ dọn audio khi flow fail — AI worker cần file còn tồn tại để xử lý;
        // submit thành công thì handleAIResultData dọn sau khi có kết quả.
        if (publicId && !submitted) {
            try {
                await CloudinaryService.deleteImage(publicId, "voice");
                console.log("🗑️ Cleaned up cloudinary audio after failed flow");
            } catch (err) {
                console.error("❌ Cleanup error after full voice flow:", err);
            }
        }
    }
}
