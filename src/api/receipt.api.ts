import http from "./http";
import { ApiResponse } from "../types/auth.types";
import {
  ReceiptResponse,
  SaveReceiptPayload,
} from "../types/transaction.types";

export const ReceiptAPI = {
  async save(
    data: SaveReceiptPayload
  ): Promise<ApiResponse<ReceiptResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/receipts`;
      console.log("🔵 [ReceiptAPI] POST Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post("/api/v1/receipts", data);
      console.log("🟢 [ReceiptAPI] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ReceiptAPI] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },
};