import { http } from "./http";
import { tokenStorage } from "../storage/tokenStorage";

export type MonthlyStat = {
  week: string; // backend response đang trả type: "1", "2", ...
  income: number;
  expense: number;
};

export type CategoryProportion = {
  category: string;
  count: number;
  percentage: number;
};

export type AnalyticsRequest = {
  month: number;
  year: number;
};

export type AnalyticsResponseData = {
  monthlyStats: MonthlyStat[];
  categoryProportions: CategoryProportion[];
};

export type AnalyticsResponse = {
  data: AnalyticsResponseData;
  message: string;
  success: boolean;
};

class AnalyticsAPI {
  private async getAuthHeader() {
    const token = await tokenStorage.getAccessToken();

    if (!token) {
      throw new Error("No token found");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getTransactionAnalytics(
    month: number,
    year: number
  ): Promise<AnalyticsResponse> {
    try {
      const headers = await this.getAuthHeader();

      const body: AnalyticsRequest = {
        month,
        year,
      };

      const res = await http.post("/api/v1/transactions/analytics", body, {
        headers: {
          ...headers,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      return {
        success: res.data.success,
        message: res.data.message,
        data: res.data.data,
      };
    } catch (error: any) {
      console.error("ANALYTICS ERROR:", error);

      return error.response?.data || {
        success: false,
        message: error.message || "Fetch analytics failed",
        data: {
          monthlyStats: [],
          categoryProportions: [],
        },
      };
    }
  }
}

export default new AnalyticsAPI();
