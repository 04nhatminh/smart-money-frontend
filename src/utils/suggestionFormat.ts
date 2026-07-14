import { t } from "../i18n";
import {
  Suggestion,
  SuggestionStatus,
  SuggestionType,
} from "../types/suggestion.types";
import { formatVND } from "./formatCurrency";

/** i18n leaf group per suggestion type ("suggestion.raise_budget", ...). */
export function suggestionTypeKey(type: Suggestion["type"]): string {
  return `suggestion.${type.toLowerCase()}`;
}

/** Localized type title, falling back to the humanized enum for unknown types. */
export function suggestionTitle(type: Suggestion["type"]): string {
  return t(`${suggestionTypeKey(type)}.title`, {
    defaultValue: type.replace(/_/g, " ").toLowerCase(),
  });
}

/** Types whose ask references a saving project by name (needs a fetch). */
export const PROJECT_NAME_TYPES: SuggestionType[] = [
  "CONTRIBUTE_TO_PROJECT",
  "INCREASE_CONTRIBUTION",
];

/**
 * The yes/no ask sentence. `resolvedValue` is the exact amount the user
 * consents to — formatted for display only, never recomputed.
 *
 * Handles every type's shape:
 *  - project types (CONTRIBUTE_TO_PROJECT, INCREASE_CONTRIBUTION) need the name
 *    fetched separately (payload carries only projectId); pass null while
 *    loading to get a placeholder.
 *  - REVIEW_SUBSCRIPTION has NO proposedAction — its numbers come from the
 *    frozen insightSnapshot.metrics instead.
 */
export function askSentence(
  suggestion: Suggestion,
  projectName?: string | null
): string {
  const action = suggestion.payload.proposedAction;
  const metrics = suggestion.payload.insightSnapshot?.metrics ?? {};
  const params: Record<string, string> = {};

  if (action?.resolvedValue != null) {
    params.resolvedValue = formatVND(action.resolvedValue);
  }

  if (PROJECT_NAME_TYPES.includes(suggestion.type)) {
    params.projectName = projectName ?? "…";
  }

  if (action?.category) {
    params.category = t(`category.${action.category}`, {
      defaultValue: action.category,
    });
  }

  // Acknowledge-only ask: build entirely from the snapshot's frozen metrics.
  if (suggestion.type === "REVIEW_SUBSCRIPTION") {
    params.description = String(metrics.description ?? "");
    if (typeof metrics.previousAmount === "number") {
      params.previousAmount = formatVND(metrics.previousAmount);
    }
    if (typeof metrics.newAmount === "number") {
      params.newAmount = formatVND(metrics.newAmount);
    }
  }

  return t(`${suggestionTypeKey(suggestion.type)}.ask`, {
    ...params,
    // Never render a raw key if a future type is unwired.
    defaultValue: suggestion.narrative ?? suggestionTitle(suggestion.type),
  });
}

export interface StatusChipStyle {
  color: string;
  bg: string;
}

// Same hex conventions as budgets.tsx alert badges.
const STATUS_CHIP: Record<SuggestionStatus, StatusChipStyle> = {
  PENDING: { color: "#3629B7", bg: "#EDEBFF" },
  ACCEPTED: { color: "#4CAF50", bg: "#E8F5E9" },
  DISMISSED: { color: "#6B7280", bg: "#F3F4F6" },
  EXPIRED: { color: "#FF9800", bg: "#FFF3E0" },
};

export function statusChipStyle(
  status: SuggestionStatus,
  isDark: boolean
): StatusChipStyle {
  const base = STATUS_CHIP[status] ?? STATUS_CHIP.PENDING;
  return isDark ? { color: base.color, bg: base.color + "22" } : base;
}

export const SUGGESTION_TYPE_ICONS: Record<Suggestion["type"], string> = {
  RAISE_BUDGET: "trending-up-outline",
  CREATE_BUDGET: "wallet-outline",
  SET_CATEGORY_LIMIT: "pricetag-outline",
  REDUCE_BUDGET: "trending-down-outline",
  CONTRIBUTE_TO_PROJECT: "flag-outline",
  REBALANCE_BUDGETS: "swap-horizontal-outline",
  REALLOCATE_BUDGET: "git-compare-outline",
  REVIEW_SUBSCRIPTION: "repeat-outline",
  INCREASE_CONTRIBUTION: "rocket-outline",
  CREATE_PROJECT: "add-circle-outline",
};
