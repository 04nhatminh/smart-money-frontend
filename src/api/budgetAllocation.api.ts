import http from "./http";
import {
  GetUserFinancialProfileResponse,
  GenerateBudgetAllocationPayload,
  GenerateBudgetAllocationResponse,
} from "../types/budget_allocation.types";

export const BudgetAllocationApi = {
  /** GET /api/v1/user-financial-profile */
  async getUserFinancialProfile(): Promise<GetUserFinancialProfileResponse> {
    try {
      const res = await http.get("/api/v1/user-financial-profile");
      return res.data;
    } catch (error: any) {
      return (
        error?.response?.data ?? {
          success: false,
          message: error?.message ?? "Failed to get financial profile",
        }
      );
    }
  },

  /** POST /api/v1/ai/budget/generate — all enum values must be UPPERCASED */
  async generateBudget(
    payload: GenerateBudgetAllocationPayload
  ): Promise<GenerateBudgetAllocationResponse> {
    try {
      const res = await http.post("/api/v1/ai/budget/generate", payload);
      return res.data;
    } catch (error: any) {
      return (
        error?.response?.data ?? {
          success: false,
          message: error?.message ?? "Failed to generate budget allocation",
        }
      );
    }
  },
};
