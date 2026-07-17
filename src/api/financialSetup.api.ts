import http from "./http";
import {
  FinancialSetup,
  FinancialSetupApiResponse,
  FinancialSetupResponseData,
  UpdateFinancialSetupPayload,
} from "../types/financialSetup";

const FINANCIAL_SETUP_ENDPOINT = "/api/v1/auth/me/financial-setup";

const normalizeFinancialSetup = (
  data: FinancialSetupResponseData
): FinancialSetup => ({
  income: Number(data.income ?? 0),
  savingPace: data.savingPace ?? "BALANCED",
  interventionLevel: data.interventionLevel ?? "GENTLE",
  focusMode: data.focusMode ?? "TRACK_ONLY",
  // Preserve an explicit `false`; only fall back to null when the field is
  // absent (pre-change users), so the form shows no pre-selected default.
  autoInvestSurplus: data.autoInvestSurplus ?? null,
  financialSetupCompleted: Boolean(data.financialSetupCompleted),
});

const toFailure = (error: any, fallback: string) => ({
  success: false,
  message: error?.response?.data?.message ?? error?.message ?? fallback,
});

export const FinancialSetupApi = {
  async getFinancialSetup(): Promise<FinancialSetupApiResponse> {
    try {
      const res = await http.get(FINANCIAL_SETUP_ENDPOINT);

      if (res.data?.success && res.data?.data) {
        return {
          ...res.data,
          data: normalizeFinancialSetup(res.data.data),
        };
      }

      return res.data;
    } catch (error: any) {
      return toFailure(error, "Failed to get financial setup");
    }
  },

  async updateFinancialSetup(
    payload: UpdateFinancialSetupPayload
  ): Promise<FinancialSetupApiResponse> {
    try {
      const res = await http.put(FINANCIAL_SETUP_ENDPOINT, payload);

      if (res.data?.success && res.data?.data) {
        return {
          ...res.data,
          data: normalizeFinancialSetup(res.data.data),
        };
      }

      return res.data;
    } catch (error: any) {
      return toFailure(error, "Failed to update financial setup");
    }
  },
};
