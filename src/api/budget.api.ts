import http from "./http";
import { ApiResponse } from "../types/auth.types";
import { ComputeBudgetAllocationResponse } from "../types/budget_allocation.types";

// Re-exported so existing `import { BudgetCategory } from ".../budget.api"`
// call sites keep working; the definitions live in the leaf types module.
export type {
  BudgetCategory,
  BudgetItem,
  BudgetListResponse,
  BudgetBulkItem,
  CreateBudgetBulkPayload,
  BudgetCreationError,
  BulkBudgetsResponse,
} from "../types/budget.types";

import type {
  BudgetItem,
  BudgetListResponse,
  BulkBudgetsResponse,
  CreateBudgetBulkPayload,
} from "../types/budget.types";

class BudgetAPI {
  async getBudgets(
    month: number,
    year: number
  ): Promise<ApiResponse<BudgetListResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/budgets`;
      console.log("🔵 [BudgetAPI] GET Request:");
      console.log("   URL:", fullUrl);
      console.log("   Params:", { month, year });

      const res = await http.get("/api/v1/budgets", {
        params: { month, year },
      });

      console.log("🟢 [BudgetAPI] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [BudgetAPI] Error Details:");
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
  }

  async createBulk(
    data: CreateBudgetBulkPayload
  ): Promise<ApiResponse<BudgetItem[]>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/budgets/bulk`;

      console.log("🔵 [BudgetAPI] POST Bulk Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post("/api/v1/budgets/bulk", data);

      console.log("🟢 [BudgetAPI] POST Bulk Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [BudgetAPI] POST Bulk Error Details:");
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
  }

  async updateBudget(
    budgetId: string,
    data: { amountLimit?: number; spent?: number }
  ): Promise<ApiResponse<BudgetItem>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/budgets/${budgetId}`;
      console.log("🟣 [BudgetAPI] PUT Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.put(`/api/v1/budgets/${budgetId}`, data);

      console.log("🟢 [BudgetAPI] PUT Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [BudgetAPI] PUT Error Details:");
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
  }


  async saveBulk(
    data: CreateBudgetBulkPayload
  ): Promise<ApiResponse<BulkBudgetsResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/budgets/bulk`;

      console.log("🟣 [BudgetAPI] PUT Bulk Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.put("/api/v1/budgets/bulk", data);

      console.log("🟢 [BudgetAPI] PUT Bulk Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [BudgetAPI] PUT Bulk Error Details:");
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
  }

  /**
   * POST /api/v1/budgets/allocation/compute
   *
   * Deterministic (LLM-free) allocation for the current month (server clock).
   * Returns a full plan synchronously — no jobId, no WebSocket. Read-only:
   * creates nothing. Apply the accepted plan via {@link saveBulk}.
   *
   * On failure the raw backend body is returned so callers can inspect
   * `errorCode` (e.g. FINANCIAL_SETUP_REQUIRED).
   */
  async computeAllocation(): Promise<ComputeBudgetAllocationResponse> {
    try {
      const res = await http.post("/api/v1/budgets/allocation/compute");
      return res.data;
    } catch (error: any) {
      return (
        error?.response?.data || {
          success: false,
          message: error?.message ?? "Failed to compute budget allocation",
        }
      );
    }
  }
}

export const budgetAPI = new BudgetAPI();