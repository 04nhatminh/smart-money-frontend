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
  | "PROJECT_UPDATE"
  | "PROJECT_HYPOTHESIS"
  | "OUT_OF_SCOPE";

export type ProjectChangeOperation = "CREATE" | "SHORTEN" | "EXTEND" | "DELETE";

// Structural project-change preview (create / shorten / extend / delete),
// as opposed to SavingsPlanSuggestion's contribution/debt-amount adjustments
// to an existing project's tracking.
export interface ProjectChangeSuggestion {
  // Null for CREATE — the project doesn't exist yet.
  projectId: string | null;
  projectName: string;
  operation: ProjectChangeOperation;
  // Set for CREATE; echoed for SHORTEN/EXTEND when unchanged.
  targetAmount: number | null;
  // Null for CREATE.
  currentDeadline: string | null;
  // Null for DELETE.
  newDeadline: string | null;
  // Null for CREATE.
  currentMonthlySaving: number | null;
  // Null for DELETE.
  newMonthlySaving: number | null;
  availableBudgetBefore: number;
  availableBudgetAfter: number;
  reason: string;
}

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
}

export interface SavingsPlanSuggestion {
  projectId: string;
  projectName: string;
  currentMoneySaved: number;
  // Exactly one of the three (moneySaved / monthLeft / moneyOwed) update paths
  // below is populated per entry — check in this order: newMoneySaved,
  // suggestedMonthLeft, suggestedMoneyOwed.
  suggestedAddAmount: number | null;
  newMoneySaved: number | null;
  suggestedMonthLeft: number | null;
  currentMoneyOwed: number | null;
  suggestedMoneyOwed: number | null;
  reason: string;
}

export interface ChatResponse {
  reply: string;
  intent: ChatIntent;
  budgetSuggestions?: BudgetUpdateSuggestion[] | null;
  simulationResult?: SimulationResult | null;
  savingsSuggestions?: SavingsPlanSuggestion[] | null;
  // Populated only when intent == PROJECT_HYPOTHESIS.
  projectChangeSuggestions?: ProjectChangeSuggestion[] | null;
  // Set alongside budgetSuggestions only when those suggestions target a month
  // other than the one asked about — currently: a budget-cut request always
  // computes a full per-category plan for the FOLLOWING month only.
  suggestedMonth?: number | null;
  suggestedYear?: number | null;
  // Set whenever this turn's suggestion is one the backend can execute itself.
  // Post it to POST /api/v1/ai/chat/confirm to apply or discard it — every
  // suggestion-producing chat turn now goes through this single confirm/dismiss
  // action (no more per-suggestion-type card with its own direct API call).
  pendingActionId?: string | null;
  // True only when a viable budget/savings suggestion actually accompanies this
  // reply — the presence of a suggestion can't be inferred from `intent` alone.
  actionRequired: boolean;
  // Up to 3 follow-up questions the user can tap to continue the conversation.
  relatedQuestions?: string[] | null;
  // True when `reply` (and this turn's message) is in English, false for Vietnamese — lets the
  // UI pick the Yes/No decision-chip wording to match the actual conversation language instead
  // of the app's fixed UI locale.
  english?: boolean;
}

// ── POST /api/v1/ai/chat/confirm ──────────────────────────────────────────

export interface ConfirmChatActionRequest {
  actionId: string;
  confirm: boolean;
}

export interface ChatActionConfirmResponse {
  // False when the action was denied, expired, or failed to apply.
  success: boolean;
  reply: string;
  // Fresh numbers after a Step 1 project/budget mutation — null when denied,
  // when the action was a pure PROJECT_DELETE, or on failure.
  safeSpendingAfter?: number | null;
  envelopeAfter?: number | null;
}
