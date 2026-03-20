import http from "./http";
import { tokenStorage } from "../storage/tokenStorage";
import {
  TransactionResponse,
  TransactionRequest,
  UpdateTransactionRequest,
  TransactionQuery,
  TransactionListResponse,
  GetTransactionsParams
} from "../types/transaction.types";
import { ApiResponse } from '../types/auth.types';

class TransactionApi {
  async getTransactions(
    params: GetTransactionsParams = { page: 0, size: 10 }
  ): Promise<ApiResponse<TransactionListResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/transactions`;
      console.log("🔵 [TransactionApi] GET Request:");
      console.log("   URL:", fullUrl);
      console.log("   Params:", JSON.stringify(params, null, 2));

      const res = await http.get("/api/v1/transactions", { params });
      console.log("🟢 [TransactionApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [TransactionApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  }

  async getAll(): Promise<ApiResponse<TransactionListResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/transactions`;
      console.log("🔵 [TransactionApi] GET ALL Request:");
      console.log("   URL:", fullUrl);

      const res = await http.get("/api/v1/transactions");
      console.log("🟢 [TransactionApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [TransactionApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  }

  async getById(id: string): Promise<ApiResponse<TransactionResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/transactions/${id}`;
      console.log("🔵 [TransactionApi] GET BY ID Request:");
      console.log("   URL:", fullUrl);
      console.log("   ID:", id);

      const res = await http.get(`/api/v1/transactions/${id}`);
      console.log("🟢 [TransactionApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [TransactionApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  }

  async create(
    data: TransactionRequest
  ): Promise<ApiResponse<TransactionResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/transactions`;
      console.log("🔵 [TransactionApi] POST Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post("/api/v1/transactions", data);
      console.log("🟢 [TransactionApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [TransactionApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  }

  async update(
    id: string,
    data: UpdateTransactionRequest
  ): Promise<ApiResponse<TransactionResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/transactions/${id}`;
      console.log("🔵 [TransactionApi] PUT Request:");
      console.log("   URL:", fullUrl);
      console.log("   ID:", id);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.put(`/api/v1/transactions/${id}`, data);
      console.log("🟢 [TransactionApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [TransactionApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/transactions/${id}`;
      console.log("🔵 [TransactionApi] DELETE Request:");
      console.log("   URL:", fullUrl);
      console.log("   ID:", id);

      const res = await http.delete(`/api/v1/transactions/${id}`);
      console.log("🟢 [TransactionApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [TransactionApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  }
}

export default new TransactionApi();
