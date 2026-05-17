import React, { useState } from "react";
import { Modal, Alert } from "react-native";
import { RecordingScreen } from "./RecordingScreen";
import { RecordingPreview } from "./RecordingPreview";
import { VoiceInput } from "./VoiceInput";
import { TransactionRequest } from "../../../types/transaction.types";
import { CloudinaryService } from "../../../services/cloudinary.service";
import AIAPI from "../../../api/ai.api";
import authApi from "../../../api/auth.api";
import { connectWebSocket } from "../../../services/websocket";
import WaitScreen from "../../../../app/(wait)/wait";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureVoice: (transaction: TransactionRequest) => void | Promise<void>;
};

type VoiceStep = "recording" | "preview" | "waiting" | "form";

export function VoiceInputModal({ visible, onClose, onCaptureVoice }: Props) {
  const [step, setStep] = useState<VoiceStep>("recording");
  const [audioUri, setAudioUri] = useState<string>("");
  const [transaction, setTransaction] = useState<TransactionRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string>("");

  const handleRecordingComplete = (uri: string) => {
    setAudioUri(uri);
    setTransaction(null);
    setSubmitError(null);
    setStep("preview");
  };

  const handleRetake = () => {
    setAudioUri("");
    setTransaction(null);
    setSubmitError(null);
    setStep("recording");
  };

  const handlePreviewConfirm = async () => {
    console.log("🎯 handlePreviewConfirm called");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!audioUri) {
        throw new Error("Audio URI is missing");
      }

      // 🔥 Get user first
      const userRes = await authApi.getCurrentUser();
      if (!userRes.success || !userRes.data) {
        throw new Error("Cannot get user");
      }
      const userId = userRes.data.id;

      // 📤 Upload voice to Cloudinary
      console.log("📤 Uploading voice to Cloudinary...");
      const cloudinaryResponse =
        await CloudinaryService.uploadTransactionVoice(audioUri);
      
        const publicId = cloudinaryResponse.publicId; // ✅ giữ local

        setCloudinaryPublicId(publicId);

      // 📤 Submit Cloudinary URL to AI API
      const submitRes = await AIAPI.submitVoiceAudio(
        cloudinaryResponse.fileUrl
      );

      if (!submitRes.success || !submitRes.data) {
        throw new Error(submitRes.message || "Failed to submit voice");
      }

      const jobId = submitRes.data.jobId;
      console.log("🔥 VOICE JOB ID:", jobId);

      // 🔄 Show waiting screen
      setStep("waiting");

      // ⛔ Wait for AI result
      const resultPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log("❌ Timeout waiting for AI voice result");
          reject(new Error("AI voice processing timeout"));
        }, 60000);

        connectWebSocket({
          userId,
          jobIds: [jobId],
          onResult: (resultJobId: string, resultData: any) => {
            console.log(
              "🎯 Voice onResult callback called - jobId:",
              resultJobId,
              "data:",
              resultData
            );

            if (resultJobId !== jobId) {
              console.log("❌ Job ID mismatch:", resultJobId, "vs", jobId);
              return;
            }

            console.log("🔥 AI VOICE RESULT received:", resultData);

            try {
              const processedTransaction: TransactionRequest = {
                amount: Number(resultData.expense) || 0,
                category: resultData.category || "Other",
                type: resultData.type || "EXPENSE",
                description:
                  resultData.description ||
                  resultData.transcript ||
                  resultData.text ||
                  "Voice transaction",
                date: resultData.date || new Date().toISOString(),
              };

              console.log("✅ Voice transaction processed:", processedTransaction);
              setTransaction(processedTransaction);
              
              // 🗑️ Delete voice file from Cloudinary after AI processing
              CloudinaryService.deleteImage(publicId, "voice");
              
              clearTimeout(timeout);
              resolve();
            } catch (err) {
              console.error("❌ Voice parse error:", err);
              clearTimeout(timeout);
              reject(err);
            }
            finally {
              // 🗑️ Delete voice file from Cloudinary regardless of success or failure
              CloudinaryService.deleteImage(publicId, "voice");
            }
          },
        });
      });

      await resultPromise;

      // 🎉 Move to form step
      setStep("form");
    } catch (error: any) {
      console.error("❌ Error in voice handlePreviewConfirm:", error);
      setSubmitError(error?.message || "Failed to process voice");
      Alert.alert("Error", error?.message || "Failed to process voice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceConfirm = async (transaction: TransactionRequest) => {
    console.log("🎯 VoiceInputModal.handleVoiceConfirm called");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("📤 Calling onCaptureVoice...");
      await onCaptureVoice(transaction);
      setAudioUri("");
      setStep("recording");
      onClose();
    } catch (error: any) {
      console.error("🔴 Error in handleVoiceConfirm:", error);
      setSubmitError(error?.message || "Failed to create transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setAudioUri("");
    setTransaction(null);
    setStep("recording");
    setSubmitError(null);
    onClose();
  };

  const handleRetakeFromForm = () => {
    setAudioUri("");
    setTransaction(null);
    setSubmitError(null);
    setStep("recording");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      {step === "recording" ? (
        <RecordingScreen onRecordingComplete={handleRecordingComplete} onCancel={handleCancel} />
      ) : step === "preview" ? (
        <RecordingPreview
          audioUri={audioUri}
          onRetake={handleRetake}
          onConfirm={handlePreviewConfirm}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
        />
      ) : step === "waiting" ? (
        <WaitScreen />
      ) : (
        <VoiceInput
          audioUri={audioUri}
          transaction={transaction}
          onCancel={handleCancel}
          onRetakeAudio={handleRetakeFromForm}
          onConfirm={handleVoiceConfirm}
          isSubmitting={isSubmitting}
          errorMessage={submitError}
        />
      )}
    </Modal>
  );
}
