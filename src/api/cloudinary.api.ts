import { UploadToCloudinaryResponse } from "../types/transaction.types";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const CloudinaryAPI = {
  async uploadFile(
    fileUri: string,
    type: "image" | "voice"
  ): Promise<UploadToCloudinaryResponse> {
    try {
      const formData = new FormData();

      const isImage = type === "image";

      formData.append("file", {
        uri: fileUri,
        name: isImage ? "image.jpg" : "audio.m4a",
        type: isImage ? "image/jpeg" : "audio/m4a",
      } as any);

      formData.append("upload_preset", UPLOAD_PRESET!);

      // 🎯 SET FOLDER
      formData.append(
        "folder",
        isImage ? "smartmoney/images" : "smartmoney/voices"
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${
          isImage ? "image" : "video"
        }/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || "Cloudinary upload failed");
      }

      return {
        imageUrl: data.secure_url,
        publicId: data.public_id,
      };
    } catch (error: any) {
      console.error("🔴 [CloudinaryAPI] Error Details:");
      console.error("   Message:", error?.message || "Unknown error");
      console.error("   Full Error:", error);
      throw error;
    }
  },
};