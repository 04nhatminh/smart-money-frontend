import { i18n, t } from "../i18n";
import { Insight, Severity } from "../types/insight.types";
import { formatVND } from "./formatCurrency";

/**
 * Formatting for adaptive-engine insight metrics before i18n interpolation.
 * The backend emits machine numbers; the FE renders them — never recomputes.
 */

// Metric fields that are VND amounts.
const MONEY_METRIC_KEYS = new Set([
  "baseline",
  "actual",
  "spent",
  "limit",
  "projectedEndOfMonth",
  "meanMonthly",
  "monthlyAmount",
  "avgMonthlyIncome",
  "recurringCosts",
  "committedBudgets",
  "disposable",
  // BUDGET_OVER_INCOME
  "income",
  "overBy",
  // BUDGET_UNDERSPEND
  "medianActual",
  // SUBSCRIPTION_PRICE_HIKE
  "previousAmount",
  "newAmount",
  // PROJECT_OFF_TRACK (card snapshot)
  "remaining",
  "requiredMonthly",
  "observedMonthly",
  "shortfall",
]);

// Metric fields that are whole counts (months, days).
const COUNT_METRIC_KEYS = new Set([
  "sampleMonths",
  "monthsObserved",
  "dayOfMonth",
  "daysInMonth",
  "monthsLeft",
  "observedWindowMonths",
]);

/**
 * Prepares an insight's open metrics map for interpolation: money fields get
 * locale currency formatting, counts get rounded, everything else (ratios,
 * strings, unknown future keys) passes through untouched.
 */
export function formatInsightParams(
  metrics: Record<string, number | string>
): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(metrics)) {
    if (MONEY_METRIC_KEYS.has(key) && typeof value === "number") {
      params[key] = formatVND(value);
    } else if (COUNT_METRIC_KEYS.has(key) && typeof value === "number") {
      params[key] = String(Math.round(value));
    } else {
      params[key] = value;
    }
  }

  return params;
}

/**
 * The display sentence for an insight: the server-composed narrative when
 * present, otherwise the localized template for its `code`. Unknown codes fall
 * back to the raw code rather than an i18n "missing" marker.
 */
export function localizeInsight(insight: Insight): string {
  if (insight.narrative) {
    return insight.narrative;
  }

  return t(insight.code, {
    ...formatInsightParams(insight.metrics),
    defaultValue: insight.code,
  });
}

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-07" → "July 2026" / "Tháng 7, 2026". Falls back to the raw string. */
export function formatPeriod(period: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period ?? "");
  if (!match) return period ?? "";

  const year = match[1];
  const month = Number(match[2]);
  if (month < 1 || month > 12) return period;

  if (i18n.locale === "vi") {
    return `Tháng ${month}, ${year}`;
  }
  return `${EN_MONTHS[month - 1]} ${year}`;
}

export interface SeverityStyle {
  color: string;
  bg: string;
}

// Hex conventions follow budgets.tsx alert styling (amber/red) with the app
// primary for neutral INFO. Dark mode uses a translucent tint of the color.
const SEVERITY_COLORS: Record<Severity, SeverityStyle> = {
  INFO: { color: "#3629B7", bg: "#EDEBFF" },
  WARN: { color: "#FF9800", bg: "#FFF3E0" },
  CRITICAL: { color: "#F44336", bg: "#FFEBEE" },
};

export function severityStyle(
  severity: Severity,
  isDark: boolean
): SeverityStyle {
  const base = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.INFO;
  return isDark ? { color: base.color, bg: base.color + "22" } : base;
}
