// Leaf module for budget domain types. Kept dependency-free (imports only
// from other leaf type modules) so both the API layer and allocation types
// can depend on it without creating an import cycle.

export type BudgetCategory =
  | "FOOD"
  | "TRANSPORTATION"
  | "CLOTHING"
  | "UTILITIES"
  | "ENTERTAINMENT"
  | "HEALTH"
  | "EDUCATION"
  | "SHOPPING"
  | "OTHER";

export interface BudgetItem {
  budgetId: string;
  userId: string;
  category: BudgetCategory;
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
  category: BudgetCategory;
  amountLimit: number;
};

export type CreateBudgetBulkPayload = {
  budgets: BudgetBulkItem[];
  month: number;
  year: number;
};

export type BudgetCreationError = {
  category: BudgetCategory;
  error: string;
};

export type BulkBudgetsResponse = {
  totalCreated: number;
  month: number;
  year: number;
  budgets: BudgetItem[];
  failedItems?: BudgetCreationError[] | null;
};
