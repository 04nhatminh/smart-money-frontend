import {
    CreateProjectFormErrors,
    CreateProjectFormValues,
    ProjectListItemResponse,
    ProjectStatusFilter,
    ProjectFilterType,
} from '../types/project.types';
import { formatDateToDDMMYYYY } from './dateFormatter';

export function parseCurrencyToNumber(value: string): number {
  const numeric = value.replace(/[^\d]/g, "");
  return Number(numeric || 0);
}

export function formatNumberWithDots(value: number): string {
    if (!value) return "";
    return Number(value).toLocaleString("de-DE");
}

export function addMonthsFromDate(month: number): Date {
    const now = new Date();
    const result = new Date(now);
    
    const originalDate = result.getDate();
    result.setMonth(result.getMonth() + month);

    if (result.getDate() !== originalDate) {
        result.setDate(0);
    }

    return result;
}

export function getPreviewDeadline(deadlineMonths: string): string {
    if (!deadlineMonths.trim()) return "";

    const months = Number(deadlineMonths);
    if (Number.isNaN(months) || months < 0) return "";

    return formatDateToDDMMYYYY(addMonthsFromDate(months));
}

export function validateCreateProjectForm(
    values: CreateProjectFormValues
): CreateProjectFormErrors {
    const errors: CreateProjectFormErrors = {
        name: "",
        description: "",
        targetAmount: "",
        deadlineMonths: "",
    };

    const trimmedName = values.name.trim();
    const trimmedDescription = values.description.trim();
    const amountValue = parseCurrencyToNumber(values.targetAmount);
    const monthsValue = Number(values.deadlineMonths);

    if (!trimmedName) {
        errors.name = "Project name is required";
    } else if (trimmedName.length > 120) {
        errors.name = "Project name must be at most 120 characters";
    }

    if (!values.targetAmount.trim()) {
        errors.targetAmount = "Target amount is required";
    } else if (amountValue <= 0 || Number.isNaN(amountValue)) {
        errors.targetAmount = "Target amount must be greater than 0";
    }

    if (!values.deadlineMonths.trim()) {
        errors.deadlineMonths = "Deadline is required";
    } else if (
        Number.isNaN(monthsValue) ||
        !Number.isInteger(monthsValue) ||
        monthsValue < 0
    ) {
        errors.deadlineMonths = "Deadline must be a positive whole number";
    }
    
    if (trimmedDescription.length > 500) {
        errors.description = "Description must be at most 500 characters";
    }

    return errors;
}

export function hasErrors(errors: CreateProjectFormErrors): boolean {
    return Object.values(errors).some(Boolean);
}

export function getMonthsFromDeadline(deadline: string): string {
  if (!deadline) return "";

  const today = new Date();
  const target = new Date(deadline);

  if (Number.isNaN(target.getTime())) return "";

  let months =
    (target.getFullYear() - today.getFullYear()) * 12 +
    (target.getMonth() - today.getMonth());

  if (target.getDate() > today.getDate()) {
    months += 1;
  }

  return String(Math.max(months, 1));
}

export function validateEditProjectForm(values: {
  name: string;
  description: string;
  targetAmount: string;
  deadlineMonths: string;
}) {
  return validateCreateProjectForm({
    ...values,
    type: "PERSONAL",
  });
}

export function formatCurrencyVND(value: number) {
  return value.toLocaleString("de-DE");
}

export function getMonthsLeft(deadline: string) {
  if (!deadline) return 0;

  const today = new Date();
  const endDate = new Date(deadline);

  if (Number.isNaN(endDate.getTime())) return 0;

  let months =
    (endDate.getFullYear() - today.getFullYear()) * 12 +
    (endDate.getMonth() - today.getMonth());

  if (endDate.getDate() >= today.getDate()) {
    months += 1;
  }

  return Math.max(months, 0);
}

export function getDeadlineLabel(deadline: string) {
  const monthsLeft = getMonthsLeft(deadline);

  if (monthsLeft <= 0) return "Completed";
  if (monthsLeft === 1) return "1 month";
  return `${monthsLeft} months`;
}

export function getProgressValue(progressPercent: number) {
  if (!progressPercent || progressPercent < 0) return 0;
  if (progressPercent > 100) return 100;
  return progressPercent;
}

export function getProgressText(progressPercent: number) {
  const value = getProgressValue(progressPercent);

  if (value >= 100) return "Completed";
  return `${Math.round(value)}%`;
}

export function getProjectStatus(
  deadline: string,
  progressPercent: number
): Exclude<ProjectStatusFilter, "ALL"> {
  const progress = getProgressValue(progressPercent);

  if (progress >= 100) return "COMPLETED";

  const today = new Date();
  const endDate = new Date(deadline);

  if (!Number.isNaN(endDate.getTime()) && endDate < today) {
    return "OVERDUE";
  }

  return "ONGOING";
}

export function getRemainingTimeText(deadline: string, progressPercent: number) {
  const status = getProjectStatus(deadline, progressPercent);

  if (status === "COMPLETED") return "Completed";
  if (status === "OVERDUE") return "Overdue";

  const monthsLeft = getMonthsLeft(deadline);
  if (monthsLeft === 1) return "1 month left";
  return `${monthsLeft} months left`;
}

export function filterProjects(
  projects: ProjectListItemResponse[],
  typeFilter: ProjectFilterType,
  keyword: string,
  statusFilter: ProjectStatusFilter
) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return projects.filter((project) => {
    const matchType =
      typeFilter === "ALL" ? true : project.type === typeFilter;

    const matchKeyword = normalizedKeyword
      ? project.name.toLowerCase().includes(normalizedKeyword)
      : true;

    const projectStatus = getProjectStatus(
      project.deadline,
      project.progressPercent
    );

    const matchStatus =
      statusFilter === "ALL" ? true : projectStatus === statusFilter;

    return matchType && matchKeyword && matchStatus;
  });
}

export function calculateSummary(projects: ProjectListItemResponse[]) {
  const totalSaved = projects.reduce(
    (sum, item) => sum + (item.totalContributed || 0),
    0
  );
  const totalAmount = projects.reduce(
    (sum, item) => sum + (item.targetAmount || 0),
    0
  );

  return {
    totalSaved,
    totalAmount,
  };
}