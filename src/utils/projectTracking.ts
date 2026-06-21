import {
  PaceStatus,
  ProjectStatusReason,
  ProjectHistoryOutcome,
} from "../types/project.types";

// B0 — central enum → colour/i18n maps for the project-tracking UI.
// The backend emits machine-readable enums; the FE owns all copy and colour.
// Each entry carries an `i18nKey` (resolve with `t(...)`) plus presentation tokens.

export type EnumStyle = {
  bg: string;
  text: string;
  i18nKey: string;
};

// --- Pace chip (paceStatus) ---------------------------------------------------
export const paceStatusStyles: Record<PaceStatus, EnumStyle> = {
  AHEAD: { bg: "#DCFCE7", text: "#15803D", i18nKey: "project.pace_ahead" },
  ON_TRACK: { bg: "#EFF6FF", text: "#2563EB", i18nKey: "project.pace_on_track" },
  BEHIND: { bg: "#FEF3C7", text: "#B45309", i18nKey: "project.pace_behind" },
  NOT_APPLICABLE: { bg: "#F3F4F6", text: "#6B7280", i18nKey: "project.pace_na" },
};

// --- Status reason banner (statusReason) --------------------------------------
// `icon` is an Ionicons name. Entries flagged `banner: false` (ON_TRACK / NONE)
// are not rendered as a prominent banner — pace/positive states are shown via the
// chip instead.
export type StatusReasonStyle = EnumStyle & {
  icon: string;
  border: string;
  banner: boolean;
};

export const statusReasonStyles: Record<ProjectStatusReason, StatusReasonStyle> = {
  ON_TRACK: {
    bg: "#EFF6FF",
    text: "#2563EB",
    border: "#BFDBFE",
    icon: "checkmark-circle-outline",
    i18nKey: "project.reason_on_track",
    banner: false,
  },
  BEHIND_PACE: {
    bg: "#FEF3C7",
    text: "#B45309",
    border: "#FCD34D",
    icon: "trending-down-outline",
    i18nKey: "project.reason_behind_pace",
    banner: true,
  },
  FROZEN_DEBT: {
    bg: "#FEF9C3",
    text: "#92400E",
    border: "#FDE68A",
    icon: "snow-outline",
    i18nKey: "project.reason_frozen_debt",
    banner: true,
  },
  EXPIRED_DEADLINE: {
    bg: "#FEE2E2",
    text: "#991B1B",
    border: "#FCA5A5",
    icon: "time-outline",
    i18nKey: "project.reason_expired_deadline",
    banner: true,
  },
  EXPIRED_FROZEN_TOO_LONG: {
    bg: "#FEE2E2",
    text: "#991B1B",
    border: "#FCA5A5",
    icon: "alert-circle-outline",
    i18nKey: "project.reason_expired_frozen_too_long",
    banner: true,
  },
  COMPLETED: {
    bg: "#DCFCE7",
    text: "#15803D",
    border: "#86EFAC",
    icon: "trophy-outline",
    i18nKey: "project.reason_completed",
    banner: true,
  },
  ABANDONED_BY_USER: {
    bg: "#F3F4F6",
    text: "#6B7280",
    border: "#E5E7EB",
    icon: "hand-left-outline",
    i18nKey: "project.reason_abandoned_by_user",
    banner: true,
  },
  NONE: {
    bg: "#F3F4F6",
    text: "#6B7280",
    border: "#E5E7EB",
    icon: "ellipse-outline",
    i18nKey: "project.reason_none",
    banner: false,
  },
};

// --- History row outcome (outcome) --------------------------------------------
export type OutcomeStyle = {
  icon: string; // Ionicons name
  color: string;
  i18nKey: string;
};

export const historyOutcomeStyles: Record<ProjectHistoryOutcome, OutcomeStyle> = {
  CLEAN_MONTH: {
    icon: "checkmark-circle",
    color: "#10B981",
    i18nKey: "project.outcome_clean_month",
  },
  OVERSPENT: {
    icon: "alert-circle",
    color: "#EF4444",
    i18nKey: "project.outcome_overspent",
  },
  UNDERSPENT_BONUS: {
    icon: "trending-up",
    color: "#2563EB",
    i18nKey: "project.outcome_underspent_bonus",
  },
  FROZEN_NO_SAVING: {
    icon: "snow",
    color: "#D97706",
    i18nKey: "project.outcome_frozen_no_saving",
  },
};

// Sort histories newest-first by (year, month) — backend order is not guaranteed.
export function sortHistoriesDesc<T extends { year: number; month: number }>(
  histories: T[]
): T[] {
  return [...histories].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month
  );
}

// Fallback classifier for histories that predate the Phase 0 `outcome` field.
export function inferOutcome(history: {
  penalty: number;
  surplusInvested: number;
  moneySavedAfter: number;
  moneySavedBefore: number;
}): ProjectHistoryOutcome {
  if (history.penalty > 0) return "OVERSPENT";
  if (history.surplusInvested > 0) return "UNDERSPENT_BONUS";
  if (history.moneySavedAfter > history.moneySavedBefore) return "CLEAN_MONTH";
  return "FROZEN_NO_SAVING";
}
