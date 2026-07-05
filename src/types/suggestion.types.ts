// Adaptive-engine suggestions (GET /api/v1/suggestions, POST .../respond).
// Distinct from the AI-chat prompt suggestions in api/ai.api.ts.

import { Insight } from "./insight.types";

export type SuggestionType =
  | "RAISE_BUDGET"
  | "CREATE_BUDGET"
  | "SET_CATEGORY_LIMIT"
  | "REDUCE_BUDGET"
  | "CONTRIBUTE_TO_PROJECT"
  | "REBALANCE_BUDGETS"
  | "REALLOCATE_BUDGET"
  | "REVIEW_SUBSCRIPTION"
  | "INCREASE_CONTRIBUTION";

export const SUGGESTION_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "DISMISSED",
  "EXPIRED",
] as const;

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

/** One row of a multi-budget adjustment (REBALANCE_BUDGETS / REALLOCATE_BUDGET). */
export interface BudgetAdjustment {
  budgetId: string;
  category: string;
  currentLimit: number;
  newLimit: number;
}

/** Fields vary by type; the server may send explicit nulls for unused ones. */
export interface ProposedAction {
  category?: string | null;
  budgetId?: string | null;
  month?: number | null;
  year?: number | null;
  projectId?: string | null;
  /**
   * The exact amount the user consents to — format for display, never
   * recompute. Absent for acknowledge-only asks (REVIEW_SUBSCRIPTION), whose
   * whole proposedAction is null.
   */
  resolvedValue?: number;
  /** Present on REBALANCE_BUDGETS / REALLOCATE_BUDGET — render as a table. */
  budgetAdjustments?: BudgetAdjustment[];
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  status: SuggestionStatus;
  dedupKey: string;
  /**
   * Optional server-composed sentence (LLM), frozen at ask time. Prefer it as
   * the card headline when non-null; compose from `type` otherwise.
   */
  narrative?: string | null;
  payload: {
    /** Frozen "why we're asking" — stable even if live data changes. */
    insightSnapshot: Insight;
    /** Null for acknowledge-only asks (REVIEW_SUBSCRIPTION). */
    proposedAction: ProposedAction | null;
    narrative?: string | null;
  };
  createdAt: string;
  expiresAt?: string | null;
  decidedAt?: string | null;
}
