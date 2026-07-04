export interface AIJobResponse {
  jobId: string;
  status: string;
  tokenId: string;
}

// ── POST /api/v1/ai/chat ──────────────────────────────────────────────────

export type ChatIntent =
  | "GENERAL_ADVICE"
  | "BUDGET_UPDATE"
  | "SIMULATION"
  | "INCOME_WINDFALL"
  | "LARGE_EXPENSE"
  | "OUT_OF_SCOPE";

export interface BudgetUpdateSuggestion {
  budgetId: string;
  category: string;
  currentAmount: number;
  suggestedAmount: number;
  reason: string;
}

export interface SimulationResult {
  scenario: string;
  newSafeSpending: number;
  projectImpact: string;
  violates20Rule: boolean;
}

export interface SavingsPlanSuggestion {
  projectId: string;
  projectName: string;
  currentMoneySaved: number;
  suggestedAddAmount: number | null;
  newMoneySaved: number | null;
  suggestedMonthLeft: number | null;
  reason: string;
}

export interface ChatResponse {
  reply: string;
  intent: ChatIntent;
  budgetSuggestions?: BudgetUpdateSuggestion[] | null;
  simulationResult?: SimulationResult | null;
  savingsSuggestions?: SavingsPlanSuggestion[] | null;
}
