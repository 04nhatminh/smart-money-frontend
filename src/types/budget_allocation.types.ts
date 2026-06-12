import { ApiResponse } from "./auth.types";

// ─── Enum value arrays ───────────────────────────────────────────────────────

export const FINANCIAL_PROFILE_ROLES = [
  "business_owner",
  "freelancer",
  "office_worker",
  "student",
] as const;

export const FINANCIAL_PROFILE_LIVING_STATUSES = [
  "dorm",
  "own_house",
  "rent_room",
  "with_family",
] as const;

export const FINANCIAL_PROFILE_INCOME_LEVELS = [
  "high",
  "low",
  "medium",
] as const;

export const FINANCIAL_PROFILE_TRANSPORT_MODES = [
  "bus",
  "car",
  "motorbike",
  "ride_hailing",
] as const;

export const FINANCIAL_PROFILE_SPENDING_STYLES = [
  "balanced",
  "frugal",
  "spender",
] as const;

export const FINANCIAL_PROFILE_WORK_STYLES = [
  "hybrid",
  "none",
  "onsite",
  "part_time",
  "remote",
] as const;

export const FINANCIAL_PROFILE_FAMILY_STATUSES = [
  "married",
  "single",
] as const;

export const FINANCIAL_PROFILE_STUDY_INTENSITIES = [
  "course_heavy",
  "normal",
] as const;

export const FINANCIAL_PROFILE_HEALTH_NEEDS = [
  "high",
  "low",
  "normal",
] as const;

// ─── Derived union types ─────────────────────────────────────────────────────

export type FinancialProfileRole =
  (typeof FINANCIAL_PROFILE_ROLES)[number];

export type FinancialProfileLivingStatus =
  (typeof FINANCIAL_PROFILE_LIVING_STATUSES)[number];

export type FinancialProfileIncomeLevel =
  (typeof FINANCIAL_PROFILE_INCOME_LEVELS)[number];

export type FinancialProfileTransportMode =
  (typeof FINANCIAL_PROFILE_TRANSPORT_MODES)[number];

export type FinancialProfileSpendingStyle =
  (typeof FINANCIAL_PROFILE_SPENDING_STYLES)[number];

export type FinancialProfileWorkStyle =
  (typeof FINANCIAL_PROFILE_WORK_STYLES)[number];

export type FinancialProfileFamilyStatus =
  (typeof FINANCIAL_PROFILE_FAMILY_STATUSES)[number];

export type FinancialProfileStudyIntensity =
  (typeof FINANCIAL_PROFILE_STUDY_INTENSITIES)[number];

export type FinancialProfileHealthNeed =
  (typeof FINANCIAL_PROFILE_HEALTH_NEEDS)[number];

// ─── API data shapes ─────────────────────────────────────────────────────────

/** Returned by GET /api/v1/user-financial-profile and POST /api/v1/ai/budget/generate */
export interface UserFinancialProfileData {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  living_status: string;
  income_level: string;
  transport_mode: string;
  spending_style: string;
  work_style: string;
  family_status: string;
  study_intensity: string;
  health_need: string;
}

/** GET /api/v1/user-financial-profile response */
export type GetUserFinancialProfileResponse = ApiResponse<UserFinancialProfileData>;

// ─── Form values (lowercase enum values) ────────────────────────────────────

export interface FinancialProfileFormValues {
  role: FinancialProfileRole;
  living_status: FinancialProfileLivingStatus;
  income_level: FinancialProfileIncomeLevel;
  transport_mode: FinancialProfileTransportMode;
  spending_style: FinancialProfileSpendingStyle;
  work_style: FinancialProfileWorkStyle;
  family_status: FinancialProfileFamilyStatus;
  study_intensity: FinancialProfileStudyIntensity;
  health_need: FinancialProfileHealthNeed;
}

// ─── POST /api/v1/ai/budget/generate ────────────────────────────────────────

/** All values must be UPPERCASED before sending */
export interface GenerateBudgetAllocationPayload {
  role: string;
  living_status: string;
  income_level: string;
  transport_mode: string;
  spending_style: string;
  work_style: string;
  family_status: string;
  study_intensity: string;
  health_need: string;
}

/** Response from POST /api/v1/ai/budget/generate — contains async job ID */
export interface GenerateBudgetJobData {
  jobId: string;
}

export type GenerateBudgetAllocationResponse = ApiResponse<GenerateBudgetJobData>;

// ─── WebSocket /topic/ai/{jobId} ─────────────────────────────────────────────

export interface BudgetAllocationCategory {
  category: string;
  amountLimit: number;
  percentage?: number;
}

export interface BudgetJobWebSocketMessage {
  status?: string;
  jobId?: string;
  budgets?: BudgetAllocationCategory[];
  data?: BudgetAllocationCategory[] | any;
  result?: BudgetAllocationCategory[];
  message?: string;
  error?: string;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Converts a FinancialProfileFormValues (lowercase) to an uppercased payload. */
export function toUpperCasePayload(
  values: FinancialProfileFormValues
): GenerateBudgetAllocationPayload {
  return {
    role: values.role.toUpperCase(),
    living_status: values.living_status.toUpperCase(),
    income_level: values.income_level.toUpperCase(),
    transport_mode: values.transport_mode.toUpperCase(),
    spending_style: values.spending_style.toUpperCase(),
    work_style: values.work_style.toUpperCase(),
    family_status: values.family_status.toUpperCase(),
    study_intensity: values.study_intensity.toUpperCase(),
    health_need: values.health_need.toUpperCase(),
  };
}
