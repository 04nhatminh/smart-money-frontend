import { CloudinarySuccessResponse, CloudinaryErrorResponse, UploadToCloudinaryResponse } from "../types/cloudinary.types";

type CloudinaryUploadType = "image" | "voice";
type CloudinaryResponse =
  | CloudinarySuccessResponse
  | CloudinaryErrorResponse;

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const CloudinaryAPI = {
  async uploadFile(
    fileUri: string,
    type: CloudinaryUploadType,
    folder: string,
    fileName?: string
  ): Promise<UploadToCloudinaryResponse> {
    try {
      if (!CLOUD_NAME) {
        throw new Error("Missing EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME");
      }

      if (!UPLOAD_PRESET) {
        throw new Error("Missing EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
      }

      if (!fileUri) {
        throw new Error("File URI is required");
      }

      const formData = new FormData();

      const isImage = type === "image";
      const endpoint = isImage ? "image" : "video";
      const defaultName = isImage ? "image.jpg" : "audio.m4a";
      const finalFileName = fileName ?? defaultName;

      formData.append("file", {
        uri: fileUri,
        name: finalFileName,
        type: isImage ? "image/jpeg" : "audio/m4a",
      } as any);

      formData.append("upload_preset", UPLOAD_PRESET!);
      formData.append("folder", folder);

      console.log("📤 Uploading to Cloudinary:", {
        fileUri,
        type,
        folder,
        fileName: finalFileName
      });
      console.log("ENDPOINT:", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || "error" in data) {
        const errorMsg =
          "error" in data ? data.error.message : "Cloudinary upload failed";
        throw new Error(errorMsg);
      }

      return {
        fileUrl: data.secure_url,
        publicId: data.public_id,
      };
    } catch (error: any) {
      console.error("🔴 [CloudinaryAPI] Error Details:");
      console.error("   Message:", error?.message || "Unknown error");
      console.error("   Full Error:", error);
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
};