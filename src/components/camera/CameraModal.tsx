import React, { useState } from "react";
import { Modal } from "react-native";
import { CameraScreen } from "./CameraScreen";
import { CameraPreview } from "./CameraPreview";
import { ReceiptPreview, Receipt } from "./ReceiptPreview";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureBill: (receipt: Receipt) => void | Promise<void>;
};

type CameraStep = "camera" | "preview" | "receipt";

export function CameraModal({ visible, onClose, onCaptureBill }: Props) {
  const [step, setStep] = useState<CameraStep>("camera");
  const [photoUri, setPhotoUri] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCapture = (uri: string) => {
    setPhotoUri(uri);
    setSubmitError(null);
    setStep("preview");
  };

  const handleRetake = () => {
    setPhotoUri("");
    setStep("camera");
  };

  const handlePreviewConfirm = (uri: string) => {
    setStep("receipt");
  };

  const handleReceiptConfirm = async (receipt: Receipt) => {
    console.log("🎯 CameraModal.handleReceiptConfirm called");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("📤 Calling onCaptureBill...");
      await onCaptureBill(receipt);
      setPhotoUri("");
      setStep("camera");
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || "Failed to create transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPhotoUri("");
    setStep("camera");
    setSubmitError(null);
    onClose();
  };

  const handleRetakeFromReceipt = () => {
    setPhotoUri("");
    setSubmitError(null);
    setStep("camera");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleCancel}>
      {step === "camera" ? (
        <CameraScreen onCapture={handleCapture} onClose={handleCancel} />
      ) : step === "preview" ? (
        <CameraPreview
          uri={photoUri}
          onRetake={handleRetake}
          onConfirm={handlePreviewConfirm}
        />
      ) : (
        <ReceiptPreview
          imageUri={photoUri}
          onCancel={handleCancel}
          onRetakePhoto={handleRetakeFromReceipt}
          onConfirm={handleReceiptConfirm}
          isSubmitting={isSubmitting}
          errorMessage={submitError}
        />
      )}
    </Modal>
  );
}
