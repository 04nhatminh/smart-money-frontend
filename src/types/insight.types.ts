// Adaptive-engine insights (GET /api/v1/insights).
// Distinct from the AI-chat "insight" feature in hooks/useAIInsight.ts.

export const SEVERITIES = ["INFO", "WARN", "CRITICAL"] as const;

export type Severity = (typeof SEVERITIES)[number];

export type InsightType =
  | "OVERSPEND_ANOMALY"
  | "BUDGET_PACE"
  | "CATEGORY_TREND"
  | "RECURRING"
  | "SAVINGS_CAPACITY"
  | "BUDGET_OVER_INCOME"
  | "BUDGET_UNDERSPEND"
  | "SUBSCRIPTION_PRICE_HIKE"
  // Appears only inside a suggestion card's insightSnapshot, never in GET /insights.
  | "PROJECT_OFF_TRACK";

export interface Insight {
  type: InsightType;
  /** null/omitted for account-wide insights (SAVINGS_CAPACITY). */
  category?: string | null;
  severity: Severity;
  /** ISO year-month, e.g. "2026-07". */
  period: string;
  /** i18n key composed by the backend, e.g. "insight.budget_pace.food". */
  code: string;
  /** Open map — unknown keys must never break rendering. */
  metrics: Record<string, number | string>;
  /** Optional server-composed sentence; may replace the localized `code` text. */
  narrative?: string | null;
}
