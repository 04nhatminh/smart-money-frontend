export type GroupStatus = "FORMING" | "LOCKED" | "DISSOLVED";
export type GroupRole = "ADMIN" | "MEMBER";
export type GroupInviteStatus = "INVITED" | "JOINED" | "DECLINED";

export type GroupMemberResponse = {
  userId: string;
  username?: string;
  role: GroupRole;
  inviteStatus: GroupInviteStatus;
  capacitySnapshot: number;
  joinedAt: string | null;
};

export type GroupDetailResponse = {
  groupId: string;
  name: string;
  description: string;
  adminId: string;
  status: GroupStatus;
  members: GroupMemberResponse[];
  createdAt: string;
  groupProjectId?: string | null;
};

export type CreateGroupPayload = {
  name: string;
  description?: string;
};

export type InviteGroupMemberPayload = {
  email: string;
};

export type GroupInviteResponse = {
  token: string;
  deepLinkUrl: string;
  message: string;
};

// Group Projects
export type GroupProjectStatus = "ACTIVE" | "COMPLETED" | "DISSOLVED";
export type GroupProjectPriority = "LOW" | "MEDIUM" | "HIGH";
export type SubProjectStatus = "ACTIVE" | "FROZEN" | "COMPLETED" | "ABANDONED";

export type GroupProjectMemberDetail = {
  userId: string;
  username?: string;
  personalProjectId: string;
  moneySaved: number;
  targetAmount: number;
  progressPercent: number;
  projectStatus: SubProjectStatus;
};

export type GroupProjectDetailResponse = {
  groupProjectId: string;
  groupId: string;
  name: string;
  targetAmount: number;
  totalCapacity: number;
  currency: string;
  totalMonths: number;
  deadline: string;
  status: GroupProjectStatus;
  aggregateMoneySaved: number;
  progressPercent: number;
  members: GroupProjectMemberDetail[];
};

export type GroupProjectSuggestionsResponse = {
  totalCapacity: number;
  suggestedMonths: number;
  suggestedAmount: number;
};

export type GroupProjectSuggestionsPayload = {
  groupId: string;
  inputAmount?: number;
  inputMonths?: number;
};

export type CreateGroupProjectPayload = {
  groupId: string;
  name: string;
  description?: string;
  targetAmount: number;
  totalMonths: number;
  currency?: string;
};

export type JoinGroupProjectPayload = {
  priority: GroupProjectPriority;
};

// List item shape for the group list on project tab
export type GroupListItemResponse = {
  groupId: string;
  name: string;
  description: string;
  status: GroupStatus;
  memberCount: number;
  adminId: string;
};
