import http from "./http";
import {
  AddProjectContributionPayload,
  CreateProjectPayload,
  InviteProjectMemberPayload,
  ProjectDetailResponse,
  ProjectListItemResponse,
  ProjectResponse,
  UpdateProjectPayload,
  ProjectAdvisorPayload,
  ProjectAdvisorResponse,
  InviteResponse,
  ProjectTrackingResponse,
  ProjectHistory,
  ProjectType,
  ProjectPriority,
  ProjectStatus,
} from "../types/project.types";
import { ApiResponse } from "../types/auth.types";

export const ProjectAPI = {
  async create(
    data: CreateProjectPayload
  ): Promise<ApiResponse<ProjectResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects`;
      console.log("🔵 [ProjectApi] POST Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post("/api/v1/projects", data);
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      // A structured response body (e.g. PROJECT_USER_INCOME_REQUIRED, priority
      // conflicts) is a normal business-rule rejection the UI already surfaces via
      // Alert — console.error on it just trips the RN dev-mode LogBox with a scary
      // stack trace for what isn't actually a bug. Reserve console.error for
      // genuinely unexpected failures (network down, 5xx, no response body).
      const log = responseData ? console.warn : console.error;
      log("🔴 [ProjectApi] Error Details:");
      log("   Message:", errorMsg);
      log("   Status:", status);
      log("   Response Data:", responseData);
      if (!responseData) log("   Full Error:", error);

      return (
        responseData || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async getAll(
    params?: {
      search?: string;
      type?: ProjectType;
      status?: ProjectStatus;
      priority?: ProjectPriority;
    }
  ): Promise<ApiResponse<ProjectListItemResponse[]>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects`;
      console.log("🔵 [ProjectApi] GET Request:");
      console.log("   URL:", fullUrl);
      console.log("   Params:", params);

      const res = await http.get("/api/v1/projects", { params });
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async getById(projectId: string): Promise<ApiResponse<ProjectDetailResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}`;
      console.log("🔵 [ProjectApi] GET Request:");
      console.log("   URL:", fullUrl);

      const res = await http.get(`/api/v1/projects/${projectId}`);
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async getTracking(
    projectId: string
  ): Promise<ApiResponse<ProjectTrackingResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}/tracking`;
      console.log("🔵 [ProjectApi] GET Tracking Request:");
      console.log("   URL:", fullUrl);

      const res = await http.get(`/api/v1/projects/${projectId}/tracking`);
      console.log("🟢 [ProjectApi] Tracking Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Tracking Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async updateTracking(
    projectId: string,
    data: {
      moneySaved?: number;
      currentMonth?: number;
      monthLeft?: number;
      moneyOwed?: number;
    }
  ): Promise<ApiResponse<ProjectTrackingResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}/tracking`;
      console.log("🟣 [ProjectApi] PUT Tracking Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.put(`/api/v1/projects/${projectId}/tracking`, data);
      console.log("🟢 [ProjectApi] PUT Tracking Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] PUT Tracking Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async getHistory(
    projectId: string
  ): Promise<ApiResponse<ProjectHistory[]>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}/history`;
      console.log("🔵 [ProjectApi] GET History Request:");
      console.log("   URL:", fullUrl);

      const res = await http.get(`/api/v1/projects/${projectId}/history`);
      console.log("🟢 [ProjectApi] History Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] History Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async update(
    projectId: string,
    data: UpdateProjectPayload
  ): Promise<ApiResponse<ProjectResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}`;
      console.log("🔵 [ProjectApi] PUT Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.put(`/api/v1/projects/${projectId}`, data);
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async abandon(projectId: string): Promise<ApiResponse<ProjectResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}`;
      console.log("🔵 [ProjectApi] DELETE Abandon Request:");
      console.log("   URL:", fullUrl);

      const res = await http.delete(`/api/v1/projects/${projectId}`);
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Abandon Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async delete(projectId: string): Promise<ApiResponse<null>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}`;
      console.log("🔵 [ProjectApi] DELETE Request:");
      console.log("   URL:", fullUrl);

      const res = await http.delete(`/api/v1/projects/${projectId}`);
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  /**
   * Manual "press-to-contribute" — the everyday, unprompted way to fund a
   * saving goal. Writes the same ProjectContribution that accepting a
   * CONTRIBUTE_TO_PROJECT / INCREASE_CONTRIBUTION suggestion does, so progress
   * (totalContributed / netSaved / progressPercent) adds up into one number.
   *
   * Returns the updated ProjectDetailResponse. Reaching the target
   * auto-completes the project (status -> COMPLETED) and crossing a
   * 25/50/75/100% milestone fires a one-time celebration notification
   * server-side. A non-contributable project (FROZEN / EXPIRED / ABANDONED /
   * COMPLETED) returns 400.
   */
  async addContribution(
    projectId: string,
    data: AddProjectContributionPayload
  ): Promise<ApiResponse<ProjectDetailResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}/contributions`;
      console.log("🔵 [ProjectApi] POST Contribution:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post(
        `/api/v1/projects/${projectId}/contributions`,
        data
      );
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Contribution Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async inviteMember(
    projectId: string,
    data: InviteProjectMemberPayload
  ): Promise<ApiResponse<InviteResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}/members/invite`;
      console.log("🔵 [ProjectApi] POST Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post(
        `/api/v1/projects/${projectId}/members/invite`,
        data
      );
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async acceptInvitation(
    data: { token: string; commitmentAmount?: number }
  ): Promise<ApiResponse<ProjectDetailResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/invites/accept`;
      console.log("🔵 [ProjectApi] POST Request:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post("/api/v1/projects/invites/accept", data);
      console.log("🟢 [ProjectApi] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      const errorMsg = error?.message || "Unknown error";
      const status = error?.response?.status || "No status";
      const responseData = error?.response?.data;

      console.error("🔴 [ProjectApi] Error Details:");
      console.error("   Message:", errorMsg);
      console.error("   Status:", status);
      console.error("   Response Data:", responseData);
      console.error("   Full Error:", error);

      return (
        error?.response?.data || {
          success: false,
          message: errorMsg,
        }
      );
    }
  },

  async advisor(
    data: ProjectAdvisorPayload
  ): Promise<ApiResponse<ProjectAdvisorResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/project-advisor`;

      console.log("🔵 [ProjectAPI] POST Advisor:");
      console.log("   URL:", fullUrl);
      console.log("   Payload:", JSON.stringify(data, null, 2));

      const res = await http.post(
        "/api/v1/projects/project-advisor",
        data
      );

      console.log("🟢 [ProjectAPI] Advisor Success:", res.data);

      return res.data;
    } catch (error: any) {
      console.error("🔴 [ProjectAPI] Advisor Error:", error);

      return (
        error.response?.data || {
          success: false,
          message: error?.message || "Advisor failed",
        }
      );
    }
  },
};
