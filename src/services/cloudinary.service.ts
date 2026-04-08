import * as FileSystem from 'expo-file-system/legacy';
const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'drjlezbo7';

const UPLOAD_PRESET = 'smart_money_receipts';

interface CloudinarySuccessResponse {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
}

interface CloudinaryErrorResponse {
  error: {
    message: string;
  };
}

type CloudinaryResponse =
  | CloudinarySuccessResponse
  | CloudinaryErrorResponse;

class CloudinaryService {

  // ✅ FIX 1: đưa vào trong class
  private async normalizeUri(uri: string): Promise<string> {
    const newPath = FileSystem.cacheDirectory + `upload_${Date.now()}.jpg`;

    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });

    console.log("🔥 SAFE URI:", newPath);

    return newPath;
  }

  async uploadImage(
    imageUri: string,
    fileName: string = "receipt"
  ): Promise<string> {
    try {
      console.log("📤 Uploading image to Cloudinary...", imageUri);

      if (imageUri.startsWith('http')) {
        return imageUri;
      }

      // ✅ FIX 2: dùng normalize
      const safeUri = await this.normalizeUri(imageUri);

      const formData = new FormData();

      // ✅ FIX 3: dùng safeUri (KHÔNG dùng imageUri nữa)
      formData.append('file', {
        uri: safeUri,
        type: 'image/jpeg',
        name: `${fileName}.jpg`,
      } as any);

      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'smart-money/receipts');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data: CloudinaryResponse = await response.json();

      if (!response.ok || 'error' in data) {
        const errorMsg = 'error' in data ? data.error.message : 'Upload failed';
        console.error("❌ Cloudinary error:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("✅ Upload successful:", data.secure_url);
      return data.secure_url;

    } catch (error: any) {
      console.error("❌ Cloudinary upload error:", error);
      throw new Error(error.message || "Failed to upload image");
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      if (!publicId) return;
      console.warn("⚠️ Image deletion should be handled by backend");
    } catch (error) {
      console.error("❌ Delete error:", error);
    }
  }
}

export default new CloudinaryService();