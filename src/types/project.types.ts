export type ProjectType = "PERSONAL" | "GROUP";
export type ProjectFilterType = "ALL" | ProjectType;

export type ProjectStatus = "ONGOING" | "COMPLETED" | "OVERDUE";
export type ProjectStatusFilter = "ALL" | ProjectStatus;

export type SavingPlanMode = "RELAXED" | "URGENT";
export type CreateProjectModalStep = 1 | 2 | 3;

export type CreateProjectPayload = {
    name: string;
    description: string;
    type: ProjectType;
    targetAmount: number;
    currency: string;
    deadline: string;
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  targetAmount?: number;
  currency?: string;
  deadline?: string; // yyyy-MM-dd
};

export type AddProjectContributionPayload = {
  amount: number;
  note?: string;
};

export type InviteProjectMemberPayload = {
  userId: string;
  admin: boolean;
};

export type CreateProjectFormValues = {
    name: string;
    description: string;
    targetAmount: string;
    deadlineMonths: string;
    type: ProjectType;
};

export type CreateProjectFormErrors = {
    name: string;
    description: string;
    targetAmount: string;
    deadlineMonths: string;
};

export type ContributorResponse = {
  userId: string;
  totalAmount: number;
  percentOfTarget: number;
  createdAt: string;
};

export type ContributionSummaryResponse = {
  totalContributed: number;
  remaining: number;
  progressPercent: number;
  contributors: ContributorResponse[];
};

export type ProjectListItemResponse = {
  projectId: string;
  name: string;
  type: ProjectType;
  targetAmount: number;
  currency: string;
  totalContributed: number;
  progressPercent: number;
  deadline: string;
  status: ProjectStatus;
  monthsLeft: number;
  deadlineLabel: string;
  statusLabel: string;
};

export type ProjectDetailResponse = {
  projectId: string;
  ownerId: string;
  type: ProjectType;
  name: string;
  description: string;
  targetAmount: number;
  currency: string;
  totalContributed: number;
  remaining: number;
  progressPercent: number;
  deadline: string;
  monthsLeft: number;
  deadlineLabel: string;
  statusLabel: string;
};

export type ProjectResponse = ProjectDetailResponse;

export type SavingPlanDraft = {
  payload: CreateProjectPayload;
  deadlineMonths: number;
}

export type SavingPlanSuggestionResponse = {
  monthlySavingAmount: number;
  estimatedMonths: number;
  categories: {
    key: string;
    label: string;
    amount: number;
  }[];
}

export type SavingPlanAIResponse = {
  agreed: boolean;
  message: string;
  suggestion: SavingPlanSuggestionResponse;
};

export type SavingPlanSuggestionMap = {
  RELAXED: SavingPlanSuggestionResponse;
  URGENT: SavingPlanSuggestionResponse;
};
