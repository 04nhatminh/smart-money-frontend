import React, { useState } from "react";
import { Modal } from "react-native";
import { CameraScreen } from "./CameraScreen";
import { CameraPreview } from "./CameraPreview";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureBill: (uri: string) => void;
};

type CameraStep = "camera" | "preview";

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

  const handleConfirm = (uri: string) => {
    onCaptureBill(uri);
    setPhotoUri("");
    setStep("camera");
    onClose();
  };

  const handleClose = () => {
    setPhotoUri("");
    setStep("camera");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      {step === "camera" ? (
        <CameraScreen onCapture={handleCapture} onClose={handleClose} />
      ) : (
        <CameraPreview
          uri={photoUri}
          onRetake={handleRetake}
          onConfirm={handleConfirm}
        />
      )}
    </Modal>
  );
}
