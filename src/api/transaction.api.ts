import { http } from './http';
import { ApiResponse } from '../types/auth.types';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CreateTransactionRequest {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

export interface TransactionResponse {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
}

class TransactionApi {
  async createTransaction(
    data: CreateTransactionRequest
  ): Promise<ApiResponse<TransactionResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/transactions`;
      console.log("🔵 [TransactionApi] POST Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));
      
      const res = await http.post('/api/v1/transactions', data);
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
      
      return error.response?.data || {
        success: false,
        message: errorMsg,
      };
    }
  }
}

export default new TransactionApi();