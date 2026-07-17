import { useMemo, useState } from "react";
import { ProjectAPI } from "../api/project.api";
import {
  CreateProjectFormErrors,
  ProjectDetailResponse,
  UpdateProjectPayload,
  ProjectPriority,
} from "../types/project.types";
import {
  addMonthsFromDate,
  formatNumberWithDots,
  getMonthsFromDeadline,
  getPreviewDeadline,
  hasErrors,
  parseCurrencyToNumber,
  validateEditProjectForm,
} from "../utils/project";
import { formatDateToYYYYMMDD } from "../utils/dateFormatter";

type EditProjectFormValues = {
  name: string;
  description: string;
  targetAmount: string;
  deadlineMonths: string;
  priority: ProjectPriority;
};

const initialErrors: CreateProjectFormErrors = {
  name: "",
  description: "",
  targetAmount: "",
  deadlineMonths: "",
};

type UseEditProjectProps = {
  project: ProjectDetailResponse;
  onSuccess?: () => void;
};

export function useEditProject({
  project,
  onSuccess,
}: UseEditProjectProps) {
  const [values, setValues] = useState<EditProjectFormValues>({
    name: project.name || "",
    description: project.description || "",
    targetAmount: project.targetAmount
      ? formatNumberWithDots(project.targetAmount)
      : "",
    deadlineMonths: project.deadline
      ? getMonthsFromDeadline(project.deadline)
      : "",
    priority: project.priority || "LOW",
  });

  const [errors, setErrors] = useState<CreateProjectFormErrors>(initialErrors);
  const [loading, setLoading] = useState(false);

  const previewDeadline = useMemo(() => {
    return getPreviewDeadline(values.deadlineMonths);
  }, [values.deadlineMonths]);

  const isDirty = useMemo(() => {
    const initialName = project.name || "";
    const initialDescription = project.description || "";
    const initialAmount = project.targetAmount
      ? formatNumberWithDots(project.targetAmount)
      : "";
    const initialDeadlineMonths = project.deadline
      ? getMonthsFromDeadline(project.deadline)
      : "";
    const initialPriority = project.priority || "LOW";

    return (
      values.name !== initialName ||
      values.description !== initialDescription ||
      values.targetAmount !== initialAmount ||
      values.deadlineMonths !== initialDeadlineMonths ||
      values.priority !== initialPriority
    );
  }, [values, project]);

  const clearError = (field: keyof CreateProjectFormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const onChangeField = <K extends keyof EditProjectFormValues>(
    field: K,
    value: EditProjectFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const onChangeName = (value: string) => {
    onChangeField("name", value);
    clearError("name");
  };

  const onChangeDescription = (value: string) => {
    onChangeField("description", value);
    clearError("description");
  };

  const onChangeTargetAmount = (value: string) => {
    const numeric = parseCurrencyToNumber(value);
    onChangeField("targetAmount", formatNumberWithDots(numeric));
    clearError("targetAmount");
  };

  const onChangeDeadlineMonths = (value: string) => {
    const numeric = value.replace(/[^\d]/g, "");
    onChangeField("deadlineMonths", numeric);
    clearError("deadlineMonths");
  };

  const onChangePriority = (value: ProjectPriority) => {
    onChangeField("priority", value);
  };

  const validate = () => {
    const nextErrors = validateEditProjectForm(values);
    setErrors(nextErrors);
    return !hasErrors(nextErrors);
  };

  const buildPayload = (): UpdateProjectPayload => {
    return {
      name: values.name.trim(),
      description: values.description.trim(),
      targetAmount: parseCurrencyToNumber(values.targetAmount),
      currency: "VND",
      priority: values.priority,
      // Inclusive month convention (backend counts gap + 1): an N-month plan
      // sends deadline = today + (N - 1) months. Mirrors getMonthsFromDeadline.
      deadline: formatDateToYYYYMMDD(
        addMonthsFromDate(Number(values.deadlineMonths) - 1)
      ),
    };
  };

  const handleEditProject = async () => {
    if (loading) return false;
    if (!validate()) return false;

    try {
      setLoading(true);

      const payload = buildPayload();
      const response = await ProjectAPI.update(project.projectId, payload);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update project");
      }

      onSuccess?.();
      return true;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setValues({
      name: project.name || "",
      description: project.description || "",
      targetAmount: project.targetAmount
        ? formatNumberWithDots(project.targetAmount)
        : "",
      deadlineMonths: project.deadline
        ? getMonthsFromDeadline(project.deadline)
        : "",
      priority: project.priority || "LOW",
    });
    setErrors(initialErrors);
  };

  return {
    values,
    errors,
    loading,
    previewDeadline,
    isDirty,
    onChangeName,
    onChangeDescription,
    onChangeTargetAmount,
    onChangeDeadlineMonths,
    onChangePriority,
    handleEditProject,
    resetForm,
  };
}