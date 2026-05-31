import React, { useState } from "react";
import { Modal, Alert } from "react-native";
import { RecordingScreen } from "./RecordingScreen";
import { RecordingPreview } from "./RecordingPreview";
import { VoiceInput } from "./VoiceInput";
import { TransactionRequest } from "../../../types/transaction.types";
import { CloudinaryService } from "../../../services/cloudinary.service";
import AIAPI from "../../../api/ai.api";
import authApi from "../../../api/auth.api";
import WaitScreen from "../../../../app/(wait)/wait";
import { waitForAIResult } from "../../../services/aiWebSocketHelper";
import TransactionParser from "../../../utils/transactionParser";

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

      const wsResult = await waitForAIResult(jobId, 60000);
      let finalResult = wsResult;
      if (wsResult.status === "TIMEOUT") {
        console.log("⚠️ WS timeout → polling");
        const fallback = await AIAPI.getResult(jobId);
        if (!fallback?.success || !fallback.data) {
          throw new Error("AI processing timeout");
        }
        finalResult = {
          status: "SUCCESS",
          data: fallback.data,
        };
      }

      const resultData = finalResult.data;

      const processedTransaction: TransactionRequest = {
        type:
          resultData.type === "INCOME"
            ? "INCOME"
            : "EXPENSE",

        amount:
          TransactionParser.parseAmount(
            resultData.expense || resultData.amount || 0
          ) || 0,

        category: resultData.category || "OTHER",

        description:
          resultData.description ||
          resultData.transactionName ||
          "",

        date:
          resultData.date ||
          new Date().toISOString(),
      };

      setTransaction(processedTransaction);

      // 🎉 Move to form step
      setStep("form");
    } catch (error: any) {
      console.error("❌ Error in voice handlePreviewConfirm:", error);
      setSubmitError(error?.message || "Failed to process voice");
      Alert.alert("Error", error?.message || "Failed to process voice");
    } finally {
      setIsSubmitting(false);
      CloudinaryService.deleteImage(cloudinaryPublicId, "voice").catch((err) => {
        console.error("❌ Failed to delete Cloudinary audio:", err);
      });
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
