import http from "./http";
import { ApiResponse } from "../types/auth.types";

export interface BudgetItem {
  budgetId: string;
  userId: string;
  category:
    | "FOOD"
    | "TRANSPORTATION"
    | "CLOTHING"
    | "UTILITIES"
    | "ENTERTAINMENT"
    | "HEALTH"
    | "EDUCATION"
    | "SHOPPING"
    | "OTHER";
  amountLimit: number;
  month: number;
  year: number;
  spent: number;
  remaining: number;
  progressPercent: number;
  alertLevel: "SAFE" | "CAUTION" | "WARNING" | "EXCEEDED";
  createdAt: string;
  updatedAt: string;
}

export interface BudgetListResponse {
  month: number;
  year: number;
  items: BudgetItem[];
}

export type BudgetBulkItem = {
  category: string;
  amountLimit: number;
};

export type CreateBudgetBulkPayload = {
  budgets: BudgetBulkItem[];
  month: number;
  year: number;
};

export type BudgetCreationError = {
  category: string;
  error: string;
};

export type BulkBudgetsResponse = {
  totalCreated: number;
  month: number;
  year: number;
  budgets: BudgetItem[];
  failedItems?: BudgetCreationError[] | null;
}

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
}

export const budgetAPI = new BudgetAPI();