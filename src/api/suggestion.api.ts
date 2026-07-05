import http from "./http";
import { ApiResponse } from "../types/auth.types";
import { Suggestion, SuggestionStatus } from "../types/suggestion.types";

const SUGGESTIONS_ENDPOINT = "/api/v1/suggestions";

const toFailure = (error: any, fallback: string) => ({
  success: false,
  message: error?.response?.data?.message ?? error?.message ?? fallback,
});

export const SuggestionApi = {
  /** Server defaults to PENDING when status is omitted. */
  async getSuggestions(
    status?: SuggestionStatus
  ): Promise<ApiResponse<Suggestion[]>> {
    try {
      const res = await http.get(SUGGESTIONS_ENDPOINT, {
        params: status ? { status } : undefined,
      });

      if (res.data?.success) {
        return { ...res.data, data: res.data.data ?? [] };
      }

      return res.data;
    } catch (error: any) {
      return toFailure(error, "Failed to get suggestions");
    }
  },

  /**
   * Yes/No decision. accept:true executes the proposed action server-side.
   * Idempotent: responding again returns the current state without re-running
   * the action, so retrying on a flaky network is safe.
   */
  async respond(
    id: string,
    accept: boolean
  ): Promise<ApiResponse<Suggestion>> {
    try {
      const res = await http.post(`${SUGGESTIONS_ENDPOINT}/${id}/respond`, {
        accept,
      });
      return res.data;
    } catch (error: any) {
      return toFailure(error, "Failed to respond to suggestion");
    }
  },
};
