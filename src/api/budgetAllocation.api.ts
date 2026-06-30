import http from "./http";
import {
  GenerateBudgetAllocationResponse,
} from "../types/budget_allocation.types";

export const BudgetAllocationApi = {
  /** POST /api/v1/ai/budget/generate */
  async generateBudget(
  ): Promise<GenerateBudgetAllocationResponse> {
    try {
      const res = await http.post("/api/v1/ai/budget/generate");
      return res.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.response?.data?.message ??
          error?.message ??
          "Failed to generate budget",
      };
    }
  },
};
