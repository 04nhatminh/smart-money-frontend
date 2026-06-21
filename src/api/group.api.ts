import http from "./http";
import { ApiResponse } from "../types/auth.types";
import {
  CreateGroupPayload,
  CreateGroupProjectPayload,
  GroupDetailResponse,
  GroupInviteResponse,
  GroupListItemResponse,
  GroupProjectDetailResponse,
  GroupProjectSuggestionsPayload,
  GroupProjectSuggestionsResponse,
  InviteGroupMemberPayload,
  JoinGroupProjectPayload,
} from "../types/group.types";

const handleError = (error: any) =>
  error?.response?.data || { success: false, message: error?.message || "Unknown error" };

export const GroupAPI = {
  async createGroup(data: CreateGroupPayload): Promise<ApiResponse<GroupDetailResponse>> {
    try {
      const res = await http.post("/api/v1/groups", data);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async getMyGroups(): Promise<ApiResponse<GroupListItemResponse[]>> {
    try {
      const res = await http.get("/api/v1/groups");
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async getGroupDetail(groupId: string): Promise<ApiResponse<GroupDetailResponse>> {
    try {
      const res = await http.get(`/api/v1/groups/${groupId}`);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async inviteMember(
    groupId: string,
    data: InviteGroupMemberPayload
  ): Promise<ApiResponse<GroupInviteResponse>> {
    try {
      const res = await http.post(`/api/v1/groups/${groupId}/members/invite`, data);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async acceptInvite(token: string): Promise<ApiResponse<GroupDetailResponse>> {
    try {
      const res = await http.post("/api/v1/groups/invites/accept", { token });
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async declineInvite(token: string): Promise<ApiResponse<null>> {
    try {
      const res = await http.post("/api/v1/groups/invites/decline", { token });
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async lockGroup(groupId: string): Promise<ApiResponse<GroupDetailResponse>> {
    try {
      const res = await http.post(`/api/v1/groups/${groupId}/lock`);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async removeDeclinedMember(
    groupId: string,
    userId: string
  ): Promise<ApiResponse<null>> {
    try {
      const res = await http.delete(`/api/v1/groups/${groupId}/members/${userId}`);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  // Group Projects
  async getSuggestions(
    payload: GroupProjectSuggestionsPayload
  ): Promise<ApiResponse<GroupProjectSuggestionsResponse>> {
    try {
      const res = await http.post("/api/v1/group-projects/suggestions", payload);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async createGroupProject(
    data: CreateGroupProjectPayload
  ): Promise<ApiResponse<GroupProjectDetailResponse>> {
    try {
      const res = await http.post("/api/v1/group-projects", data);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async getGroupProjectDetail(
    groupProjectId: string
  ): Promise<ApiResponse<GroupProjectDetailResponse>> {
    try {
      const res = await http.get(`/api/v1/group-projects/${groupProjectId}`);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async joinGroupProject(
    groupProjectId: string,
    data: JoinGroupProjectPayload
  ): Promise<ApiResponse<null>> {
    try {
      const res = await http.post(`/api/v1/group-projects/${groupProjectId}/join`, data);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },

  async dissolveGroupProject(groupProjectId: string): Promise<ApiResponse<null>> {
    try {
      const res = await http.post(`/api/v1/group-projects/${groupProjectId}/dissolve`);
      return res.data;
    } catch (e) {
      return handleError(e);
    }
  },
};
