import { CloudinaryAPI } from "../api/cloudinary.api";
import { http } from "../api/http";
import { UploadToCloudinaryResponse } from "../types/cloudinary.types";

export const CloudinaryService = {
  async uploadReceiptImage(
    imageUri: string
  ): Promise<UploadToCloudinaryResponse> {
    return CloudinaryAPI.uploadImage(
      imageUri,
      "smartmoney/images",
      `receipt_${Date.now()}.jpg`
    );
  },

  async uploadTransactionVoice(
    audioUri: string
  ): Promise<UploadToCloudinaryResponse> {
    return CloudinaryAPI.uploadVoice(
      audioUri,
      "smartmoney/voices",
      `voice_${Date.now()}.m4a`
    );
  },

  async uploadImageWithCustomFolder(
    imageUri: string,
    folder: string,
    fileName?: string
  ): Promise<UploadToCloudinaryResponse> {
    return CloudinaryAPI.uploadImage(
      imageUri,
      folder,
      fileName ?? `image_${Date.now()}.jpg`
    );
  },

  async uploadVoiceWithCustomFolder(
    audioUri: string,
    folder: string,
    fileName?: string
  ): Promise<UploadToCloudinaryResponse> {
    return CloudinaryAPI.uploadVoice(
      audioUri,
      folder,
      fileName ?? `voice_${Date.now()}.m4a`
    );
  },
  
  async deleteImage(publicId: string, type: "image" | "voice"): Promise<void> {
    try {
      await http.delete("/api/v1/cloudinary/image", {
        data: { publicId, type },
      });
    } catch (error) {
      console.error(`🔴 Failed to delete ${type} with public ID: ${publicId}`, error);
    }
  },
};