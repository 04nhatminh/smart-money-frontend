import { useMemo, useState } from "react";
import { ProjectAPI } from "../api/project.api";
import {
    CreateProjectFormErrors,
    CreateProjectFormValues,
    CreateProjectPayload,
    PROJECT_PRIORITIES,
    ProjectAdvisorResponse,
    ProjectPriority,
    ProjectType,
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
    priority: "HIGH",
};

const initialErrors: CreateProjectFormErrors = {
    name: "",
    description: "",
    targetAmount: "",
    deadlineMonths: "",
};

type UseCreateProjectProps = {
    usedPriorities?: ProjectPriority[];
}

export function useCreateProject({  
    usedPriorities = [], 
}: UseCreateProjectProps = {}) {
    const [values, setValues] = useState<CreateProjectFormValues>(initialFormValues);
    const [errors, setErrors] = useState<CreateProjectFormErrors>(initialErrors);
    const [loading, setLoading] = useState(false);

    const availablePriorities = useMemo(() => {
      return PROJECT_PRIORITIES.filter(
        (priority) =>
          !usedPriorities.includes(priority)
      );

    }, [usedPriorities]);

    const canCreateProject = availablePriorities.length > 0;
    
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
        return (Object.keys(nextErrors).length === 0);
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

    const buildPayloadWithAdvisor =
        ( 
            advisor:ProjectAdvisorResponse
        ): CreateProjectPayload => {
        return {
            ...buildPayload(),
            deadline: formatDateToYYYYMMDD(
                addMonthsFromDate(advisor.numberOfMonths)
            ),
        };
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
        buildPayloadWithAdvisor,
        canCreateProject,
        availablePriorities,
        resetForm,
        onChangePriority,
    };
}
