import React, { useState } from "react";
import { Modal } from "react-native";
import { CameraScreen } from "./CameraScreen";
import { CameraPreview } from "./CameraPreview";
import { ReceiptPreview } from "./ReceiptPreview";
import { Receipt } from "../../../types/transaction.types";
import { CloudinaryAPI } from "../../../api/cloudinary.api";
import { InputAssetAPI } from "../../../api/inputasset.api";

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


  const handleCapture = async (uri: string) => {
    setPhotoUri(uri);
    setSubmitError(null);
    setStep("preview");
  };

  const handleRetake = () => {
    setPhotoUri("");
    setSubmitError(null);
    setStep("camera");
  };

  const handlePreviewConfirm = (uri: string) => {
    setSubmitError(null);
    setStep("receipt");
  };

  const handleReceiptConfirm = async (receipt: Receipt) => {
    console.log("🎯 CameraModal.handleReceiptConfirm called");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!photoUri) {
        throw new Error("Photo URI is missing");
      }

      const uploaded = await CloudinaryAPI.uploadFile(photoUri, "image");

      const uploadResult = await InputAssetAPI.send({
        type: "IMAGE",
        value: uploaded.imageUrl,
      });

      console.log("Receipt upload result:", uploadResult);

      await onCaptureBill(receipt);
      setPhotoUri("");
      setStep("camera");
      onClose();
    } catch (error: any) {
      console.error("Error in handleReceiptConfirm:", error);
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
