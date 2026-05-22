import http from "./http";
import {
  AddProjectContributionPayload,

  ContributionSummaryResponse,
  CreateProjectPayload,
  InviteProjectMemberPayload,
  ProjectDetailResponse,
  ProjectListItemResponse,
  ProjectResponse,
  UpdateProjectPayload,
  ProjectAdvisorPayload,
  ProjectAdvisorResponse,
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

  async getAll(): Promise<ApiResponse<ProjectListItemResponse[]>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects`;
      console.log("🔵 [ProjectApi] GET Request:");
      console.log("   URL:", fullUrl);

      const res = await http.get("/api/v1/projects");
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

  async addContribution(
    projectId: string,
    data: AddProjectContributionPayload
  ): Promise<ApiResponse<ProjectResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}/contributions`;
      console.log("🔵 [ProjectApi] POST Request:");
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

  async getContributionSummary(
    projectId: string
  ): Promise<ApiResponse<ContributionSummaryResponse>> {
    try {
      const fullUrl = `${http.defaults.baseURL}/api/v1/projects/${projectId}/contributions/summary`;
      console.log("🔵 [ProjectApi] GET Request:");
      console.log("   URL:", fullUrl);

      const res = await http.get(
        `/api/v1/projects/${projectId}/contributions/summary`
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

  async inviteMember(
    projectId: string,
    data: InviteProjectMemberPayload
  ): Promise<ApiResponse<ProjectResponse>> {
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