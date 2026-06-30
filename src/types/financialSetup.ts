import { ApiResponse } from "./auth.types";

export const SAVING_PACES = [
  "RELAXED",
  "BALANCED",
  "AGGRESSIVE",
] as const;

export type SavingPace = (typeof SAVING_PACES)[number];

export const INTERVENTION_LEVELS = [
  "NOTIFY",
  "GENTLE",
  "HARD",
] as const;

export type InterventionLevel =
  (typeof INTERVENTION_LEVELS)[number];

export const FOCUS_MODES = [
  "SAVE_MORE",
  "REDUCE_SPENDING",
  "TRACK_ONLY",
] as const;

export type FocusMode = (typeof FOCUS_MODES)[number];

export type FinancialSetupChoice =
  | SavingPace
  | InterventionLevel
  | FocusMode;

export interface FinancialSetup {
  income: number;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
  financialSetupCompleted: boolean;
}

export interface UpdateFinancialSetupPayload {
  income: number;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
}

export const FINANCIAL_SETUP_LABELS: Record<
  FinancialSetupChoice,
  string
> = {
  RELAXED: "Relaxed",
  BALANCED: "Balanced",
  AGGRESSIVE: "Focused",

  NOTIFY: "Notify",
  GENTLE: "Remind",
  HARD: "Limit",

  SAVE_MORE: "Save",
  REDUCE_SPENDING: "Reduce",
  TRACK_ONLY: "Track",
};

export const getFinancialSetupLabel = (
  value?: FinancialSetupChoice | null
): string => {
  if (!value) {
    return "-";
  }

  return FINANCIAL_SETUP_LABELS[value] ?? "-";
};

export const FINANCIAL_SETUP_OPTIONS = {
  savingPace: [
    {
      value: "RELAXED" as const,
      label: "Relaxed",
      icon: "leaf-outline",
    },
    {
      value: "BALANCED" as const,
      label: "Balanced",
      icon: "scale-outline",
    },
    {
      value: "AGGRESSIVE" as const,
      label: "Focused",
      icon: "flash-outline",
    },
  ],

  interventionLevel: [
    {
      value: "NOTIFY" as const,
      label: "Notify",
      icon: "notifications-outline",
    },
    {
      value: "GENTLE" as const,
      label: "Remind",
      icon: "chatbubble-outline",
    },
    {
      value: "HARD" as const,
      label: "Limit",
      icon: "shield-checkmark-outline",
    },
  ],

  focusMode: [
    {
      value: "SAVE_MORE" as const,
      label: "Save",
      icon: "trending-up-outline",
    },
    {
      value: "REDUCE_SPENDING" as const,
      label: "Reduce",
      icon: "cut-outline",
    },
    {
      value: "TRACK_ONLY" as const,
      label: "Track",
      icon: "analytics-outline",
    },
  ],
} as const;

export interface FinancialSetup {
  income: number;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
  financialSetupCompleted: boolean;
}

export interface UpdateFinancialSetupPayload {
  income: number;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
}

export interface FinancialSetupResponseData {
  income: number | string;
  savingPace?: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode?: FocusMode;
  financialSetupCompleted: boolean;
}

export type FinancialSetupApiResponse = ApiResponse<FinancialSetup>;
