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
      return {
        success: false,
        message:
          error?.response?.data?.message ??
          error?.message ??
          "Failed to get financial profile",
      };
    }
  },

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

  /** POST /api/v1/user-financial-profile */
  async createUserFinancialProfile(
    payload: GenerateBudgetAllocationPayload
  ): Promise<GetUserFinancialProfileResponse> {
    try {
      const res = await http.post("/api/v1/user-financial-profile", payload);
      return res.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.response?.data?.message ??
          error?.message ??
          "Failed to create financial profile",
      };
    }
  },

  /** PUT /api/v1/user-financial-profile */
  async updateUserFinancialProfile(
    payload: GenerateBudgetAllocationPayload
  ): Promise<GetUserFinancialProfileResponse> {
    try {
      const res = await http.put("/api/v1/user-financial-profile", payload);
      return res.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.response?.data?.message ??
          error?.message ??
          "Failed to update financial profile",
      };
    }
  },
};
