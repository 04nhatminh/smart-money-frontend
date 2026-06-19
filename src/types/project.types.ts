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

// Phase 0 enrichment enums — backend emits these machine-readable values; the FE
// owns all display copy/colour. See docs/project-tracking-api-contract.md.

// Pace-aware months left vs. calendar months to deadline.
export type PaceStatus = "AHEAD" | "ON_TRACK" | "BEHIND" | "NOT_APPLICABLE";

// The "why" behind the status badge, so the UI can explain rather than just label.
export type ProjectStatusReason =
  | "ON_TRACK"
  | "BEHIND_PACE"
  | "FROZEN_DEBT"
  | "EXPIRED_DEADLINE"
  | "EXPIRED_FROZEN_TOO_LONG"
  | "COMPLETED"
  | "ABANDONED_BY_USER"
  | "NONE";

// Per-month settlement outcome, drives the history row icon + sentence.
export type ProjectHistoryOutcome =
  | "CLEAN_MONTH"
  | "OVERSPENT"
  | "UNDERSPENT_BONUS"
  | "FROZEN_NO_SAVING";

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
  // Phase 0: convenience delta (moneySavedAfter - moneySavedBefore) + classifier.
  netChange?: number;
  outcome?: ProjectHistoryOutcome;
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
  // Phase 0: the "why" behind `status`, for the reason banner.
  statusReason?: ProjectStatusReason;
  // Pace fields now ride on the detail response (no separate /tracking call needed
  // for the chip). `monthsLeft` is the calendar deadline countdown; `paceMonthsLeft`
  // is "at this saving pace, ~N months left"; `paceStatus` compares the two.
  paceMonthsLeft?: number | null;
  paceStatus?: PaceStatus;
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

// Phase 0: GET /{projectId}/tracking — pace, debt, and frozen-countdown enrichment.
// View access (non-owner viewers allowed).
export type ProjectTrackingResponse = {
  id: string;
  projectId: string;
  moneySaved: number;
  moneyOwed: number;
  netSaved: number;
  currentMonth: number;
  monthlySaving: number;
  // Pace-aware months left (settlement-recalculated), not raw calendar months.
  monthLeft: number;
  frozenMonths: number;
  monthsToDeadline: number | null;
  paceStatus: PaceStatus;
  maxFrozenMonths: number;
  // ceil(moneyOwed / monthlySaving); null when there's no debt. Show as "~N months".
  debtClearEstimateMonths: number | null;
  createdAt: string;
  updatedAt: string;
};


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