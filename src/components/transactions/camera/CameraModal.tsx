import React, { useState } from "react";
import { Modal, Alert } from "react-native";
import { CameraScreen } from "./CameraScreen";
import { CameraPreview } from "./CameraPreview";
import { Receipt } from "../../../types/transaction.types";
import AIAPI from "../../../api/ai.api";
import authApi from "../../../api/auth.api";
import { initWebSocket } from "../../../services/websocket";
import { CloudinaryService } from "../../../services/cloudinary.service";
import WaitScreen from "../../../../app/(wait)/wait";
import { userStorage } from "../../../storage/userStorage";
import PendingStorage from "../../../storage/pendingTransactionStorage";
import { handleAIResultInBackground, handleFullAIFlowInBackground } from "../../../services/backgroundAIHandler";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureBill: (receipt: Receipt) => void | Promise<void>;
};

type CameraStep = "camera" | "preview" | "uploading";

export function CameraModal({ visible, onClose, onCaptureBill }: Props) {
  const [step, setStep] = useState<CameraStep>("camera");
  const [photoUri, setPhotoUri] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Init WebSocket ngay khi modal mở để sẵn sàng nhận kết quả AI trả về
  React.useEffect(() => {
    if (visible) {
      userStorage.getUser().then((user) => {
        if (user?.id) {
          initWebSocket(user.id);
        }
      });
    }
  }, [visible]);


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

  const handlePreviewConfirm = async () => {
    console.log("🎯 handlePreviewConfirm called");

    try {
      // ✅ Create pending FIRST
      const pendingTx = await PendingStorage.add({
        amount: 0,
        category: "OTHER",
        type: "EXPENSE",
        date: new Date().toISOString(),
        source: "camera",
      });

      // 🎬 Close modal NGAY
      setPhotoUri("");
      setStep("camera");
      onClose();

      // 🌀 Run EVERYTHING in background
      handleFullAIFlowInBackground(photoUri, pendingTx.id, "camera").catch(console.error);

    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed");
    }
  };



  const handleCancel = () => {
    setPhotoUri("");
    setStep("camera");
    setSubmitError(null);
    onClose();
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
        <WaitScreen />
      )}
    </Modal>
  );
}

