import { ApiResponse } from "./auth.types";
import { t } from "../i18n";

export const SAVING_PACES = [
  "RELAXED",
  "BALANCED",
  // Backend enum spelling has one S (Saving_Pace.AGGRESIVE) — do not "fix" it here.
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

export const getFinancialSetupLabel = (
  value?: FinancialSetupChoice | null
): string => {
  if (!value) {
    return "-";
  }

  switch (value) {
    case "RELAXED":
    case "BALANCED":
    case "AGGRESSIVE":
      return t(`financialSetup.savingPace.${value}`);

    case "NOTIFY":
    case "GENTLE":
    case "HARD":
      return t(`financialSetup.interventionLevel.${value}`);

    case "SAVE_MORE":
    case "REDUCE_SPENDING":
    case "TRACK_ONLY":
      return t(`financialSetup.focusMode.${value}`);

    default:
      return "-";
  }
};

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
