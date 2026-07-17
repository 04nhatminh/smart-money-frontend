import { ApiResponse, CheckResponse } from "./auth.types";
import { BudgetCategory } from "./budget.types";

// ==============================================================
// Deterministic (LLM-free) budget allocation — synchronous flow.
// POST /api/v1/budgets/allocation/compute returns the whole plan
// in the HTTP response (no jobId / WebSocket polling).
// ==============================================================

/** How a single category's proposed amount was derived. */
export type BudgetAllocationBasis = "HISTORY" | "TEMPLATE" | "FLOORED";

export interface BudgetAllocationPlanItem {
  category: BudgetCategory;
  /** Proposed whole-month limit for this category. */
  amount: number;
  /** Fixed/recurring portion already inside `amount` (informational). */
  recurring: number;
  basis: BudgetAllocationBasis;
}

export interface BudgetAllocationPlanResponse {
  month: number;
  year: number;
  income: number;
  safeSpending: number;
  targetSavings: number;
  /** Total spendable pool distributed across categories. */
  envelope: number;
  /** Envelope left over after funding needs → goes to savings. */
  surplusToSavings: number;
  /** Whole plan came from a trait template (no usable history). */
  coldStart: boolean;
  /** Commitments + savings leave nothing to allocate (every amount is 0). */
  overCommitted: boolean;
  allocations: BudgetAllocationPlanItem[];
}

export type ComputeBudgetAllocationResponse =
  CheckResponse<BudgetAllocationPlanResponse>;

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
