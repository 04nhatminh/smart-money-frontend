import { CloudinarySuccessResponse, CloudinaryErrorResponse, UploadToCloudinaryResponse } from "../types/cloudinary.types";
import http from "./http";

type CloudinaryUploadType = "image" | "voice";
type CloudinaryResponse =
  | CloudinarySuccessResponse
  | CloudinaryErrorResponse;

export const CloudinaryAPI = {
  async uploadFile(
    fileUri: string,
    type: "image" | "voice",
    folder: string,
    fileName?: string
  ): Promise<UploadToCloudinaryResponse> {
    try {
      const isImage = type === "image";
      const endpoint = isImage ? "image" : "video";

      const finalFileName =
        fileName ?? (isImage ? "image.jpg" : "audio.m4a");

      // 🔥 1. LẤY SIGNATURE TỪ BACKEND
      const signRes = await http.get("/api/v1/cloudinary/signature", {
        params: { folder },
      });

      const { timestamp, signature, apiKey, cloudName } =
        signRes.data.data;

      if (!signRes.data?.data) {
        throw new Error("Failed to get signature");
      }

      // 🔥 2. TẠO FORMDATA
      const formData = new FormData();

      formData.append("file", {
        uri: fileUri,
        name: finalFileName,
        type: isImage ? "image/jpeg" : "audio/m4a",
      } as any);

      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      // ❌ BỎ upload_preset
      // formData.append("upload_preset", ...)

      // 🔥 3. UPLOAD
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data?.error?.message || "Upload failed");
      }

      return {
        fileUrl: data.secure_url,
        publicId: data.public_id,
      };
    } catch (error: any) {
      console.error("🔴 Upload error:", error);
      throw error;
    }
  },

  async uploadImage(
    imageUri: string,
    folder: string = "smartmoney/images",
    fileName: string = "image.jpg"
  ): Promise<UploadToCloudinaryResponse> {
    return this.uploadFile(imageUri, "image", folder, fileName);
  },

  async uploadVoice(
    audioUri: string,
    folder: string = "smartmoney/voices",
    fileName: string = "audio.m4a"
  ): Promise<UploadToCloudinaryResponse> {
    return this.uploadFile(audioUri, "voice", folder, fileName);
  },
  async deleteImage(publicId: string): Promise<void> {
    try {
      await http.post("/api/v1/cloudinary/image", { publicId });
      console.log(`🗑️ Deleted image with public ID: ${publicId}`);
    } catch (error) {
      console.error(`🔴 Failed to delete image with public ID: ${publicId}`, error);
    }
  },
};