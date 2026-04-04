import React, { useState } from "react";
import { Modal } from "react-native";
import { RecordingScreen } from "./RecordingScreen";
import { RecordingPreview } from "./RecordingPreview";
import { VoiceInput } from "./VoiceInput";
import { TransactionRequest } from "../../../types/transaction.types";
import { CloudinaryAPI } from "../../../api/cloudinary.api";
import { InputAssetAPI } from "../../../api/inputasset.api";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureVoice: (transaction: TransactionRequest) => void | Promise<void>;
};

type VoiceStep = "recording" | "preview" | "form";

export function VoiceInputModal({ visible, onClose, onCaptureVoice }: Props) {
  const [step, setStep] = useState<VoiceStep>("recording");
  const [audioUri, setAudioUri] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRecordingComplete = (uri: string) => {
    setAudioUri(uri);
    setSubmitError(null);
    setStep("preview");
  };

  const handleRetake = () => {
    setAudioUri("");
    setSubmitError(null);
    setStep("recording");
  };

  const handlePreviewConfirm = () => {
    setSubmitError(null);
    setStep("form");
  };

  const handleVoiceConfirm = async (transaction: TransactionRequest) => {
    console.log("🎯 VoiceInputModal.handleVoiceConfirm called");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!audioUri) {
        throw new Error("Audio URI is missing");
      }
      console.log(audioUri);

      // Step 1: Upload to Cloudinary
      const uploaded = await CloudinaryAPI.uploadFile(audioUri, "voice");
      console.log("✅ Cloudinary upload successful:", uploaded);

      // Step 2: Send to InputAssetAPI
      const assetResult = await InputAssetAPI.send({
        type: "VOICE",
        value: uploaded.imageUrl,
      });
      if (!assetResult.success) {
        throw new Error(assetResult?.message || "Failed to send voice asset");
      }

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
    setStep("recording");
    setSubmitError(null);
    onClose();
  };

  const handleRetakeFromForm = () => {
    setAudioUri("");
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
        />
      ) : (
        <VoiceInput
          audioUri={audioUri}
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
