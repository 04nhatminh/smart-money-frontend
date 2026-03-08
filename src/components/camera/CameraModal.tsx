import React, { useState } from "react";
import { Modal } from "react-native";
import { CameraScreen } from "./CameraScreen";
import { CameraPreview } from "./CameraPreview";
import { ReceiptPreview, Receipt } from "./ReceiptPreview";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureBill: (receipt: Receipt) => void;
};

type CameraStep = "camera" | "preview" | "receipt";

export function CameraModal({ visible, onClose, onCaptureBill }: Props) {
  const [step, setStep] = useState<CameraStep>("camera");
  const [photoUri, setPhotoUri] = useState<string>("");

  const handleCapture = (uri: string) => {
    setPhotoUri(uri);
    setStep("preview");
  };

  const handleRetake = () => {
    setPhotoUri("");
    setStep("camera");
  };

  const handlePreviewConfirm = (uri: string) => {
    setStep("receipt");
  };

  const handleReceiptConfirm = (receipt: Receipt) => {
    onCaptureBill(receipt);
    setPhotoUri("");
    setStep("camera");
    onClose();
  };

  const handleCancel = () => {
    setPhotoUri("");
    setStep("camera");
    onClose();
  };

  const handleRetakeFromReceipt = () => {
    setPhotoUri("");
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
        />
      )}
    </Modal>
  );
}
