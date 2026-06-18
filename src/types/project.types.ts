export type ProjectType = "PERSONAL" | "GROUP";

export type ProjectPriority = | "LOW" | "MEDIUM" | "HIGH";

// Domain statuses come back on the list endpoint; the detail endpoint may also
// emit the derived display statuses ONGOING / OVERDUE for genuinely-live projects.
// EXPIRED and ABANDONED are terminal/failed states (no resume/contribute actions).
export type ProjectStatus =
  | "ACTIVE"
  | "ONGOING"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED" // deprecated
  | "FROZEN"
  | "ABANDONED"
  | "EXPIRED";

// Statuses that are terminal AND represent failure (target never reached).
export const TERMINAL_FAILED_STATUSES: ProjectStatus[] = ["EXPIRED", "ABANDONED", "CANCELLED"];

export type SavingPlanMode = "RELAXED" | "URGENT";

export type CreateProjectModalStep = 1 | 2 | 3;

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

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

export type InviteProjectMemberPayload = {
  email: string;
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

export type ProjectListItemResponse = {
  projectId: string;
  name: string;
  type: ProjectType;
  targetAmount: number;
  priority: ProjectPriority;
  currency: string;
  // All-auto model: `totalContributed` is now NET saved = max(0, moneySaved - moneyOwed),
  // not a sum of manual deposits. `netSaved` is the explicit field for the same value.
  totalContributed: number;
  netSaved?: number;
  moneyOwed?: number;
  frozenMonths?: number;
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

export type ProjectMember = {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  joinStatus: "INVITED" | "JOINED";
  admin: boolean;
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
  netSaved?: number;
  frozenMonths?: number;
  histories?: ProjectHistory[];
  members?: ProjectMember[];
  // Present only when this personal project is a sub-project of a group project.
  groupProjectId?: string | null;
};

export type ProjectResponse = ProjectDetailResponse;


export type SavingPlanSuggestionCategory = {
  key: string;
  label: string;
  amount: number;
};

export type SavingPlanSuggestionResponse = {
  monthlySavingAmount: number;
  estimatedMonths: number;
  categories: SavingPlanSuggestionCategory[];
}

export type SavingPlanAIResponse = {
  agreed: boolean;
  message: string;
  suggestion: SavingPlanSuggestionResponse;
};

export type SavingPlanSuggestionMap = Record<
  SavingPlanMode,
  SavingPlanSuggestionResponse
>;

export type ProjectAdvisorPayload = CreateProjectPayload & {
  mode: SavingPlanMode;
};

export type ProjectAdvisorResponse = {
  monthlySaving: number;
  numberOfMonths: number;
};

export type InviteResponse = {
  token: string;
  deepLinkUrl: string;
  message: string;
};

export type AcceptInvitePayload = {
  token: string;
  commitmentAmount?: number;
};