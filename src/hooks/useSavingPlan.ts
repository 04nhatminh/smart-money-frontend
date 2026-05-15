import { useState } from "react";
import { ProjectAPI } from "../api/project.api";
import {
    SavingPlanDraft,
    SavingPlanMode,
    CreateProjectModalStep as SavingPlanStep,
} from "../types/project.types";

type UseSavingPlanProps = {
    draft: SavingPlanDraft;
    onConfirmed?: () => void;
};

export function useSavingPlan({ draft, onConfirmed }: UseSavingPlanProps) {
    const [step, setStep] = useState<SavingPlanStep>(1);
    const [mode, setMode] = useState<SavingPlanMode | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSelectMode = (selectedMode: SavingPlanMode) => {
        setMode(selectedMode);
        setStep(2);
    };

    const handleChooseEdit = (shouldEdit: boolean) => {
        if (shouldEdit) {
            setStep(3);
            return;
        }
    };

    const handleBackkStep = () => {
        if (step === 1) return;

        if (step === 2) {
            setStep(1);
            setMode(null);
            return;
        }

        if (step === 3) {
            setStep(2);
        }
    };

    const handleConfirm = async () => {
        if (loading) return false;

        try {
            setLoading(true);

            const response = await ProjectAPI.create(draft.payload);

            if (!response?.success) {
                throw new Error(response?.message || "Failed to create project");
            }

            onConfirmed?.();
            return true;
        } finally {
            setLoading(false);
        }
    };
    return {
        step,
        mode,
        loading,
        handleSelectMode,
        handleChooseEdit,
        handleBackkStep,
        handleConfirm,
    };
}

