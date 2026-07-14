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
import { userStorage } from "../../../storage/userStorage";
import PendingStorage from "../../../storage/pendingTransactionStorage";
import { handleFullVoiceAIFlowInBackground } from "../../../services/backgroundAIHandler";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureVoice: (transaction: TransactionRequest) => void | Promise<void>;
};

type VoiceStep = "recording" | "preview";

export function VoiceInputModal({ visible, onClose, onCaptureVoice }: Props) {
  const [step, setStep] = useState<VoiceStep>("recording");
  const [audioUri, setAudioUri] = useState<string>("");
  const [transaction, setTransaction] = useState<TransactionRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    try {
      if (!audioUri) {
        throw new Error("Audio URI missing");
      }

      // ✅ Create pending FIRST
      const pendingTx = await PendingStorage.add({
        amount: 0,
        category: "OTHER",
        type: "EXPENSE",
        date: new Date().toISOString(),
        source: "voice",
      });

      // 🎬 Close modal NGAY
      setAudioUri("");
      setTransaction(null);
      setStep("recording");
      onClose();

      // 🌀 Run full flow in background
      handleFullVoiceAIFlowInBackground(audioUri, pendingTx.id, "voice").catch(console.error);

    } catch (error: any) {
      console.error("❌ Error:", error);
      Alert.alert("Error", error?.message || "Failed");
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
      ) 
      : (
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
