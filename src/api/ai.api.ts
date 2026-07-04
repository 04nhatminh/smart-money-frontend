import { http } from './http';
import { tokenStorage } from '../storage/tokenStorage';
import { CheckResponse } from '../types/auth.types';
import { AIJobResponse, ChatResponse } from '../types/ai.types';
import EventSource, { EventSourceEvent } from "react-native-sse";
type EventSourceMessage = {
  data: string | null;
};



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

  /**
   * Sync structured chat — POST /api/v1/ai/chat.
   * Returns {reply, intent, budgetSuggestions?, simulationResult?, savingsSuggestions?}
   * so the UI can render confirm/deny action cards for BUDGET_UPDATE, SIMULATION,
   * INCOME_WINDFALL and LARGE_EXPENSE intents. History is managed server-side.
   */
  async chat(
    message: string,
    month?: number,
    year?: number
  ): Promise<CheckResponse<ChatResponse>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.post(
        "/api/v1/ai/chat",
        { message, month, year },
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

      const status = error.response?.status;
      const serverMessage = error.response?.data?.error;

      return {
        success: false,
        message: serverMessage || error.message || "Chat AI failed",
        errorCode: status === 429 ? "RATE_LIMIT" : undefined,
      };
    }
  }

  /**
   * Gửi tin nhắn và nhận phản hồi dạng stream (SSE)
   * @param message  nội dung tin nhắn
   * @param onChunk  nhận từng mảnh chữ
   * @param onError  xử lý lỗi
   * @param onComplete  khi stream kết thúc
   * @returns hàm hủy (unsubscribe)
   */
  async streamChat(
    message: string,
    onChunk: (chunk: string) => void,
    onError: (error: any) => void,
    onComplete: () => void,
    month?: number,
    year?: number
  ): Promise<() => void> {
    try {
      const headers = await this.getAuthHeader();
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      let isClosed = false;
      if (!baseUrl) {
        throw new Error('Missing API base URL');
      }

      let url = `${baseUrl}/api/v1/ai/chat/stream?message=${encodeURIComponent(message)}`;
      if (month != null) url += `&month=${month}`;
      if (year != null) url += `&year=${year}`;

      const eventSource = new EventSource(url, {
        headers: {
          ...headers,
          Accept: 'text/event-stream',
        },
      });

      const safeClose = () => {
        if (!isClosed) {
          eventSource.close();
          isClosed = true;
        }
      };

      // Lắng nghe sự kiện 'message' (mặc định)
      eventSource.addEventListener('message', (event) => {
        if (!event.data) return;

        if (event.data === '[DONE]') {
          safeClose();
          onComplete();
          return;
        }

        onChunk(event.data);
      });

      // Lắng nghe sự kiện 'done' do backend gửi khi hoàn tất
      eventSource.addEventListener('done' as any, () => {
        safeClose();
        onComplete();
      });

      // Xử lý lỗi (kết nối đóng đột ngột, timeout,...)
      eventSource.addEventListener('error', (error) => {
        onError(error);
        safeClose();
      });

      // Trả về hàm hủy
      return () => {
        safeClose();
      };
    } catch (error) {
      onError(error);
      return () => { };
    }
  }


  /**
   * Lấy gợi ý từ AI dựa trên đầu vào (ví dụ: mô tả giao dịch)
   * @param input chuỗi đầu vào để gợi ý
   * @returns danh sách gợi ý
   */
  async getSuggestions(
    input: string
  ): Promise<CheckResponse<{ questions: string[] }>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.get('/api/v1/ai/suggestions', {
        headers,
        params: { input },
      });

      return {
        success: true,
        message: 'Get suggestions success',
        data: res.data,
      };
    } catch (error: any) {
      console.error('❌ GET SUGGESTIONS ERROR:', error);
      return error.response?.data || {
        success: false,
        message: error.message || 'Get suggestions failed',
      };
    }
  }
}

export default new AIAPI();