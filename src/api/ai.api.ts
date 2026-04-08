import { http } from './http';
import { tokenStorage } from '../storage/tokenStorage';
import { CheckResponse } from '../types/auth.types';
import { AIJobResponse } from '../types/ai.types';


class AIAPI {

  private async getAuthHeader() {
    const token = await tokenStorage.getAccessToken();

    if (!token) {
      throw new Error("No token found");
    }

    return {
      Authorization: `Bearer ${token}`
    };
  }

  /**
   * Submit AI job (receipt, voice, etc.)
   * @param data object (receipt, transaction...)
   * @param type "receipt" | "voice" | ...
   */
  async submitJob(
    data: any,
    type: string
  ): Promise<CheckResponse<AIJobResponse>> {
    try {
      const headers = await this.getAuthHeader();

      const formData = new FormData();

      // 🔥 BE yêu cầu String → phải stringify
      formData.append("data", JSON.stringify(data));
      formData.append("type", type);

      const res = await http.post(
        "/api/v1/ai",
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      return {
        success: true,
        message: "Submit AI job success",
        data: res.data
      };

    } catch (error: any) {
      console.error("❌ AI SUBMIT ERROR:", error);

      return error.response?.data || {
        success: false,
        message: error.message || "Submit AI job failed"
      };
    }
  }

  /**
   * Helper cho receipt
   */
  async submitReceipt(
    receipt: any
  ): Promise<CheckResponse<AIJobResponse>> {
    return this.submitJob(receipt, "image");
  }

  /**
   * Helper cho voice
   */
  async submitVoice(
    transaction: any
  ): Promise<CheckResponse<AIJobResponse>> {
    return this.submitJob(transaction, "voice");
  }

  /**
   * Submit image from Cloudinary URL
   * @param imageUrl Cloudinary secure URL
   */
  async submitImageReceipt(
    imageUrl: string
  ): Promise<CheckResponse<AIJobResponse>> {
    try {
      const headers = await this.getAuthHeader();

      const formData = new FormData();
      formData.append("data", JSON.stringify({ imageUrl }));
      formData.append("type", "ocr");

      const res = await http.post(
        "/api/v1/ai",
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      return {
        success: true,
        message: "Submit image receipt success",
        data: res.data
      };
    } catch (error: any) {
      console.error("❌ SUBMIT IMAGE ERROR:", error);
      return {
        success: false,
        message: error.message || "Submit image receipt failed"
      };
    }
  }

}

export default new AIAPI();