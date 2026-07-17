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
  /**
   * Whether monthly leftover budget is auto-swept into active savings projects.
   * Nullable in the normalized shape because pre-change users have never set it
   * — the setup form must render with no pre-selected default in that case.
   */
  autoInvestSurplus?: boolean | null;
  financialSetupCompleted: boolean;
}

export interface UpdateFinancialSetupPayload {
  income: number;
  savingPace: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode: FocusMode;
  // Required by the backend contract — omitting it now returns HTTP 400.
  autoInvestSurplus: boolean;
}

export interface FinancialSetupResponseData {
  income: number | string;
  savingPace?: SavingPace;
  interventionLevel: InterventionLevel;
  focusMode?: FocusMode;
  autoInvestSurplus?: boolean | null;
  financialSetupCompleted: boolean;
}

export type FinancialSetupApiResponse = ApiResponse<FinancialSetup>;
