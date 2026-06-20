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
      formData.append("data", typeof data === "string" ? data : JSON.stringify(data));
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

  /**
   * Submit voice from Cloudinary URL
   */
  async submitVoiceAudio(
    audioUrl: string
  ): Promise<CheckResponse<AIJobResponse>> {
    try {
      const headers = await this.getAuthHeader();

      const formData = new FormData();
      formData.append("data", audioUrl);
      formData.append("type", "voice");

      const res = await http.post("/api/v1/ai", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        success: true,
        message: "Submit voice audio success",
        data: res.data,
      };
    } catch (error: any) {
      console.error("❌ SUBMIT VOICE ERROR:", error);
      return error.response?.data || {
        success: false,
        message: error.message || "Submit voice audio failed",
      };
    }
  }

  async submitText(
    text: string
  ): Promise<CheckResponse<AIJobResponse>> {
    return this.submitJob(text, "notification");
  }

  async getResult(jobId: string): Promise<CheckResponse<any> | null> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.get(`/api/v1/ai/${jobId}`, {
        headers,
        validateStatus: (status) => status === 200 || status === 404
      });

      // ✅ chưa có kết quả → trả null
      if (res.status === 404) {
        console.log("⏳ AI chưa xử lý xong");
        return null;
      }

      return {
        success: true,
        message: "Get AI result success",
        data: res.data
      };

    } catch (error: any) {
      console.error("❌ REAL GET RESULT ERROR:", error);

      return {
        success: false,
        message: error.message || "Get AI result failed"
      };
    }
  }


  async submitFinancialAssistantJob(data: any) {
    const headers = await this.getAuthHeader();

    const formData = new FormData();

    formData.append(
      "data",
      typeof data === "string"
        ? data
        : JSON.stringify(data)
    );

    formData.append(
      "type",
      "financial_assistant"
    );

    const response = await http.post(
      "/api/v1/ai",
      formData,
      {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  }

  async getJobResult(jobId: string) {
    const headers = await this.getAuthHeader();

    const response = await http.get(
      `/api/v1/ai/${jobId}`,
      {
        headers,
      }
    );

    return response.data;
  }

  async promptAI(
    message: string
  ): Promise<
    CheckResponse<{
      reply: string;
    }>
  > {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.post(
        "/api/v1/ai/chat",
        {
          message,
        },
        {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message: "Chat AI success",
        data: res.data,
      };
    } catch (error: any) {
      console.error("❌ AI CHAT ERROR:", error);

      return error.response?.data || {
        success: false,
        message: error.message || "Chat AI failed",
      };
    }
  }
}

export default new AIAPI();