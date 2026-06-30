import { ApiResponse } from "./auth.types";

export interface GenerateBudgetJobData {
  jobId: string;
}

export type GenerateBudgetAllocationResponse = ApiResponse<GenerateBudgetJobData>;

export interface BudgetAllocationCategory {
  category: string;
  amount: number;
  percentage?: number;
  reason?: string;
}

export interface BudgetAllocationResult {
  categories: BudgetAllocationCategory[];
  currency: string;
  totalBudget: number;
}

export interface BudgetAllocationAIMessage {
  duty: "BUDGET_ALLOCATION_PLAN";
  jobId: string;
  userId: string;
  type: "BUDGET_ALLOCATION_RESULT";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  result?: BudgetAllocationResult;
  error?: string;
}

export interface BudgetJobWebSocketMessage {
  status?: string;
  jobId?: string;
  type?: string;
  duty?: string;
  budgets?: BudgetAllocationCategory[] | any;
  data?: BudgetAllocationCategory[] | any;
  result?: BudgetAllocationResult | BudgetAllocationCategory[] | any;
  message?: string;
  error?: string;
}
