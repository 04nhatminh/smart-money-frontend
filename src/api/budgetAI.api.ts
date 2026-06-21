import http from "./http";
import { ApiResponse } from "../types/auth.types";

export type BudgetGenerateResponse = {
  jobId: string;
};

export const BudgetAIAPI = {
  async generate(): Promise<ApiResponse<BudgetGenerateResponse>> {
    try {
      const res = await http.post("/api/v1/ai/budget/generate");
      return res.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          success: false,
          message: error?.message || "Generate budget failed",
        }
      );
    }
  },
};