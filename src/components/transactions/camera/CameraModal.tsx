import React, { useState } from "react";
import { Modal, Alert } from "react-native";
import { CameraScreen } from "./CameraScreen";
import { CameraPreview } from "./CameraPreview";
import { ReceiptPreview } from "./ReceiptPreview";
import { Receipt } from "../../../types/transaction.types";
import AIAPI from "../../../api/ai.api";
import authApi from "../../../api/auth.api";
import { initWebSocket, subscribeJob } from "../../../services/websocket";
import { CloudinaryService } from "../../../services/cloudinary.service";
import WaitScreen from "../../../../app/(wait)/wait";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptureBill: (receipt: Receipt) => void | Promise<void>;
};

type CameraStep = "camera" | "preview" | "waiting" | "receipt";

export function CameraModal({ visible, onClose, onCaptureBill }: Props) {
  const [step, setStep] = useState<CameraStep>("camera");
  const [photoUri, setPhotoUri] = useState<string>("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string>("");


  const handleCapture = async (uri: string) => {
    setPhotoUri(uri);
    setReceipt(null);
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
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 🔥 Get user first
      const userRes = await authApi.getCurrentUser();
      if (!userRes.success || !userRes.data) {
        throw new Error("Cannot get user");
      }
      const userId = userRes.data.id;

      // 📤 Upload image to Cloudinary
      console.log("📤 Uploading image to Cloudinary...");
      const cloudinaryResponse = await CloudinaryService.uploadReceiptImage(photoUri);

      const publicId = cloudinaryResponse.publicId; // ✅ giữ local

      setCloudinaryPublicId(publicId);

      // 📤 Submit Cloudinary URL to AI API (LẦN DUY NHẤT)
      const submitRes = await AIAPI.submitImageReceipt(cloudinaryResponse.fileUrl);
      if (!submitRes.success || !submitRes.data) {
        throw new Error(submitRes.message || "Failed to submit image");
      }

      const jobId = submitRes.data.jobId;
      console.log("🔥 JOB ID:", jobId);

      // 🔄 Show waiting screen
      setStep("waiting");

      // ⛔ Create promise to wait for AI result
      const resultPromise = new Promise<void>(async (resolve, reject) => {
        let done = false;

        // ✅ đảm bảo WS đã connect (chỉ connect 1 lần)
        await initWebSocket(userId);

        const unsubscribe = subscribeJob(jobId, (resultData: any) => {
          if (done) return;
          done = true;

          console.log("🔥 AI RESULT received:", resultData);

          try {
            const processedReceipt: Receipt = {
              type: resultData.type === "EXPENSE" ? "EXPENSE" : "INCOME",
              transactionName:
                resultData.description || resultData.transactionName || "Receipt",
              amount: Number(resultData.expense) || 0,
              category: resultData.category || "Other",
              date: resultData.date || new Date().toISOString(),
              description: resultData.description || "",
            };

            setReceipt(processedReceipt);

            clearTimeout(timeout);
            unsubscribe(); // ✅ QUAN TRỌNG

            resolve();
          } catch (err) {
            clearTimeout(timeout);
            unsubscribe(); // ✅
            reject(err);
          } finally {
            CloudinaryService.deleteImage(publicId, "image");
          }
        });

        const timeout = setTimeout(() => {
          if (done) return;
          done = true;

          console.log("❌ Timeout waiting for AI result");

          unsubscribe(); // ✅ cleanup
          reject(new Error("AI processing timeout"));
        }, 60000);
      });

      // Wait for AI to process
      await resultPromise;

      // 🎉 Move to receipt step
      setStep("receipt");

    } catch (error: any) {
      console.error("❌ Error in handlePreviewConfirm:", error);
      setSubmitError(error?.message || "Failed to process image");
      Alert.alert("Error", error?.message || "Failed to process image");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptConfirm = async (receiptData: Receipt) => {
    console.log("🎯 CameraModal.handleReceiptConfirm called");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("📤 Calling onCaptureBill...");
      await onCaptureBill(receiptData);
      setPhotoUri("");
      setReceipt(null);
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
    setReceipt(null);
    setStep("camera");
    setSubmitError(null);
    onClose();
  };

  const handleRetakeFromReceipt = () => {
    setPhotoUri("");
    setReceipt(null);
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
      ) : step === "waiting" ? (
        <WaitScreen />
      ) : (
        <ReceiptPreview
          imageUri={photoUri}
          receipt={receipt}
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

