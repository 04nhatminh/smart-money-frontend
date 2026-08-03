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

  return formatDateToDDMMYYYY(addMonthsFromDate(Math.max(0, months)));
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

export function validateEditProjectForm(values: {
  name: string;
  description: string;
  targetAmount: string;
  deadlineMonths: string;
}) {
  return validateCreateProjectForm({
    ...values,
    type: "PERSONAL",
    priority: "LOW",
  });
}

export function formatCurrencyVND(value: number | null | undefined) {
  if (value == null) return "0";
  return value.toLocaleString("de-DE");
}

export function getSafeProgress(progressPercent: number) {
  if (!progressPercent || progressPercent < 0) return 0;
  if (progressPercent > 100) return 100;
  return progressPercent;
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

    const matchStatus =
      statusFilter === "ALL" ? true : project.status === statusFilter;

    return matchType && matchKeyword && matchStatus;
  });
}

export function calculateSummary(projects: ProjectListItemResponse[]) {
  const totalSaved = projects.reduce(
    (sum, item) => sum + (item.status === "ACTIVE" ? item.totalContributed : 0),
    0
  );
  const totalAmount = projects.reduce(
    (sum, item) => sum + (item.status === "ACTIVE" ? item.targetAmount : 0),
    0
  );

  return {
    totalSaved,
    totalAmount,
  };
}

export function getMonthsFromDeadline(deadlineStr: string): string {
  if (!deadlineStr) return "";
  const deadlineDate = new Date(deadlineStr);
  const now = new Date();
  if (isNaN(deadlineDate.getTime())) return "";

  const yearsDiff = deadlineDate.getFullYear() - now.getFullYear();
  const monthsDiff = deadlineDate.getMonth() - now.getMonth();
  const gap = yearsDiff * 12 + monthsDiff;

  const totalMonths = Math.max(1, gap);

  return totalMonths > 0 ? totalMonths.toString() : "0";
}
