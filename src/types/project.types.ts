export type ProjectType = "PERSONAL" | "GROUP";

export type ProjectPriority = | "LOW" | "MEDIUM" | "HIGH";

export type ProjectStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type SavingPlanMode = "RELAXED" | "URGENT";

export type CreateProjectModalStep = 1 | 2 | 3 | 4 | 5;

export type ProjectFilterType = "ALL" | ProjectType;
export type ProjectStatusFilter = "ALL" | ProjectStatus;

export const PROJECT_PRIORITIES: ProjectPriority[] = [
  "HIGH",
  "MEDIUM",
  "LOW",
];

export type CreateProjectPayload = {
    name: string;
    description: string;
    type: ProjectType;
    priority: ProjectPriority;
    targetAmount: number;
    currency: string;
    deadline: string;
};

export type SavingPlanDraft = {
  payload: CreateProjectPayload;
};

export type SavingPlanSuggestionCategory = {
  key: string;
  label: string;
  amount: number;
};

export type SavingPlanAIResponse = {
  agreed: boolean;
  message: string;
  suggestion: {
    monthlySavingAmount: number;
    estimatedMonths: number;
    categories: SavingPlanSuggestionCategory[];
  };
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

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
    priority: ProjectPriority;
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
  priority: ProjectPriority;
  currency: string;
  totalContributed: number;
  progressPercent: number;
  deadline: string;
  status: ProjectStatus;
  monthsLeft: number;
  deadlineLabel: string;
};

export type ProjectHistory = {
  id: string;
  projectId: string;
  year: number;
  month: number;
  moneySavedBefore: number;
  moneySavedAfter: number;
  monthlySaving: number;
  penalty: number;
  surplusInvested: number;
  monthLeftBefore: number;
  monthLeftAfter: number;
  createdAt: string;
};

export type ProjectDetailResponse = ProjectListItemResponse & {
  ownerId: string;
  description: string;
  remaining: number;
  statusLabel?: string;
  monthlySaving?: number;
  durationMonths?: number;
  currentMonth?: number;
  createdAt?: string;
  moneyOwed?: number;
  histories?: ProjectHistory[];
};

export type ProjectResponse = ProjectDetailResponse;


export interface BudgetAllocationCategory {
  category: string;
  amount: number;
  percentage?: number;
  reason?: string;
}

export interface BudgetAllocationResult {
  totalBudget: number;
  currency: string;
  categories: BudgetAllocationCategory[];
}

export interface BudgetAllocationAIMessage {
  duty: "BUDGET_ALLOCATION_PLAN";
  jobId: string;
  userId: string;
  type: "BUDGET_ALLOCATION_RESULT";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  result?: BudgetAllocationResult;
  error?: string;
}

export type RawBudgetAllocationAIMessage = Omit<BudgetAllocationAIMessage, "result"> & {
  result?: BudgetAllocationResult | string | any;
  data?: unknown;
  budgets?: unknown;
};

export type ProjectAdvisorPayload = CreateProjectPayload & {
  mode: SavingPlanMode;
};

export type ProjectAdvisorResponse = {
  monthlySaving: number;
  numberOfMonths: number;
};
