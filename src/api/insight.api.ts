import http from "./http";
import { ApiResponse } from "../types/auth.types";
import { Insight } from "../types/insight.types";

const INSIGHTS_ENDPOINT = "/api/v1/insights";

const toFailure = (error: any, fallback: string) => ({
  success: false,
  message: error?.response?.data?.message ?? error?.message ?? fallback,
});

export const InsightApi = {
  /**
   * Ordered "what's happening this month" feed — render in the order given.
   * @param asOf optional YYYY-MM-DD; analyzes that date's month (testing/demos only).
   */
  async getInsights(asOf?: string): Promise<ApiResponse<Insight[]>> {
    try {
      const res = await http.get(INSIGHTS_ENDPOINT, {
        params: asOf ? { asOf } : undefined,
      });

      if (res.data?.success) {
        return { ...res.data, data: res.data.data ?? [] };
      }

      return res.data;
    } catch (error: any) {
      return toFailure(error, "Failed to get insights");
    }
  },
};
