import { useMemo, useState } from "react";
import { ProjectAPI } from "../api/project.api";
import {
    CreateProjectFormErrors,
    CreateProjectFormValues,
    CreateProjectPayload,
    ProjectPriority,
    ProjectType,
    SavingPlanDraft,
} from "../types/project.types";
import {
    addMonthsFromDate,
    getPreviewDeadline,
    formatNumberWithDots,
    hasErrors,
    parseCurrencyToNumber,
    validateCreateProjectForm,
} from "../utils/project";
import { formatDateToYYYYMMDD } from "../utils/dateFormatter";

const initialFormValues: CreateProjectFormValues = {
    name: "",
    description: "",
    targetAmount: "",
    deadlineMonths: "",
    type: "PERSONAL",
    priority: "LOW",
};

const initialErrors: CreateProjectFormErrors = {
    name: "",
    description: "",
    targetAmount: "",
    deadlineMonths: "",
};

type UseCreateProjectProps = {
    onSuccess?: () => void;
}

export function useCreateProject({ onSuccess }: UseCreateProjectProps = {}) {
    const [values, setValues] = useState<CreateProjectFormValues>(initialFormValues);
    const [errors, setErrors] = useState<CreateProjectFormErrors>(initialErrors);
    const [loading, setLoading] = useState(false);

    const previewDeadline = useMemo(() => {
        return getPreviewDeadline(values.deadlineMonths);
    }, [values.deadlineMonths]);

    const isDirty = useMemo(() => {
        return (
        values.name.trim() !== "" ||
        values.description.trim() !== "" ||
        values.targetAmount.trim() !== "" ||
        values.deadlineMonths.trim() !== "" ||
        values.priority.trim() !== "" ||
        values.type !== "PERSONAL"
        );
    }, [values]);

    const clearErrors = (field: keyof CreateProjectFormErrors) => {
        if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const onChangeField = <K extends keyof CreateProjectFormValues>(
        field: K,
        value: CreateProjectFormValues[K]
    ) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    };

    const onChangeName = (value: string) => {
        onChangeField("name", value);
        clearErrors("name");
    };

    const onChangeDescription = (value: string) => {
        onChangeField("description", value);
        clearErrors("description");
    };

    const onChangeTargetAmount = (value: string) => {
        const numeric = parseCurrencyToNumber(value);
        const formatted = formatNumberWithDots(numeric);
        onChangeField("targetAmount", formatted);
        clearErrors("targetAmount");
    };

    const onChangeDeadlineMonths = (value: string) => {
        const numeric = value.replace(/[^\d]/g, "");
        onChangeField("deadlineMonths", numeric);
        clearErrors("deadlineMonths");
    };

    const onChangeType = (value: ProjectType) => {
        onChangeField("type", value);
    };

    const onChangePriority = (value: ProjectPriority) => {
        onChangeField("priority", value);
    };

    const validate = () => {
        const nextErrors = validateCreateProjectForm(values);
        setErrors(nextErrors);
        return !hasErrors(nextErrors);
    };

    const buildPayload = (): CreateProjectPayload => {
        return {
            name: values.name.trim(),
            description: values.description.trim(),
            targetAmount: parseCurrencyToNumber(values.targetAmount),
            deadline: formatDateToYYYYMMDD(addMonthsFromDate(Number(values.deadlineMonths))),
            type: values.type,
            priority: values.priority,
            currency: "VND",
        };
    };

    const buildPayloadWithAdvisorMonths = (
        numberOfMonths: number
        ): CreateProjectPayload => {
        return {
            ...buildPayload(),
            deadline: formatDateToYYYYMMDD(
            addMonthsFromDate(numberOfMonths)
            ),
        };
    };

    const getSavingPlanDraft = (): SavingPlanDraft | null => {
        if (!validate()) return null;

       

        return {
            payload: buildPayload(),
            deadlineMonths: Number(values.deadlineMonths),
        };
    };

    const handleCreateProject = async () => {
        if (loading) return false;
        if (!validate()) return false;

        try {
            setLoading(true);
            const payload = buildPayload();
            const response = await ProjectAPI.create(payload);
            if (!response?.success) {
                throw new Error(response?.message || "Failed to create project");
            }
            onSuccess?.();
            return true;
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setValues(initialFormValues);
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
        onChangeType,
        buildPayload,
        buildPayloadWithAdvisorMonths,
        getSavingPlanDraft,
        handleCreateProject,
        resetForm,
        onChangePriority,
    };
}
