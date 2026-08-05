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
  | "INCREASE_CONTRIBUTION"
  | "CREATE_PROJECT";

export const SUGGESTION_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "DISMISSED",
  "EXPIRED",
] as const;

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

/**
 * One row of a multi-budget adjustment. A row is a raise when `newLimit` is above
 * `currentLimit` and a cut when it's below — the card colors it accordingly, since
 * a single ask can now contain both (a raise funded by cuts elsewhere).
 */
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
  /**
   * The full re-planned month, rendered as a table. Present on REBALANCE_BUDGETS,
   * REALLOCATE_BUDGET and RAISE_BUDGET — the last of these because a raise is now
   * funded first from uncommitted income and other budgets' slack, so the ask can
   * carry the cuts that pay for it. Accepting applies every row, so every row has
   * to be on screen. Cards raised before this existed have only `resolvedValue`.
   */
  budgetAdjustments?: BudgetAdjustment[];
  /**
   * CREATE_PROJECT only. Seeds to pre-fill the create-project form (all
   * editable). `resolvedValue` is the target/total goal; `monthlySaving` is the
   * per-month contribution, already clamped to the user's cap; `deadline` is an
   * ISO date (e.g. "2026-12-15"). target + deadline together determine the
   * plan — the form's implied monthly saving matches `monthlySaving`.
   */
  monthlySaving?: number;
  deadline?: string;
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
