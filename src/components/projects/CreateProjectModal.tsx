import React, { useMemo, useState } from "react";
import { Alert, Modal, View, ScrollView } from "react-native";

import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";

import { projectStyles as styles } from "../../styles/projectStyles";
import { useCreateProject } from "../../hooks/useCreateProject";
import {
    CreateProjectModalStep,
    SavingPlanDraft,
    SavingPlanMode,
} from "../../types/project.types";
import CreateProjectStep from "./CreateProjectStep";
import SavingPlanModeStep from "./SavingPlanModeStep";
import SavingPlanReviewStep from "./SavingPlanReviewStep";
import { t } from "../../i18n";
import { ProjectAPI } from "../../api/project.api";
import { getSavingPlanSuggestion } from "../../utils/savingPlan";

type Props = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
};

export default function CreateProjectModal({ 
    visible, 
    onClose, 
    onCreated 
}: Props) {
    const [step, setStep] = useState<CreateProjectModalStep>(1);
    const [mode, setMode] = useState<SavingPlanMode | null>(null);
    const [draft, setDraft] = useState<SavingPlanDraft | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const {
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
        onChangePriority,
        getSavingPlanDraft,
        resetForm,
    } = useCreateProject();

    const aiResponse = useMemo(() => {
        if (!mode) return null;
        return getSavingPlanSuggestion(mode);
    }, [mode]);

    const resetAll = () => {
        resetForm();
        setStep(1);
        setMode(null);
        setDraft(null);
        setConfirmLoading(false);
    };

    const handleClose = () => {
        if (isDirty || step !== 1 || draft || mode) {
            setShowExitModal(true);
            return;
        }

        resetForm();
        onClose();
    }

    const handleConfirmExit = () => {
        setShowExitModal(false);
        resetForm();
        onClose();
    };

    const handleNextFromCreate = () => {
        const nextDraft = getSavingPlanDraft();
        if (!nextDraft) return;

        setDraft(nextDraft);
        setStep(2);
    };

    const handleSelectMode = (selectedMode: SavingPlanMode) => {
        setMode(selectedMode);
    }

    const handleContinueToReview = () => {
        if (!mode || !aiResponse) return;
        setStep(3);
    };    

    const handleBackStep = () => {
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

    const handleConfirmCreate = async () => {
        if (!draft) return;

        try {
            setConfirmLoading(true);

            const response = await ProjectAPI.create(draft.payload);

            if (!response?.success) {
                throw new Error(response?.message || "Failed to create project");
            }

            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to create project. Please try again.");
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        resetAll();
        onClose();
        onCreated?.();
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {step === 1 && (
                                <CreateProjectStep
                                    type={values.type}
                                    name={values.name}
                                    description={values.description}
                                    targetAmount={values.targetAmount}
                                    deadlineMonths={values.deadlineMonths}
                                    priority={values.priority}
                                    errors={errors}
                                    previewDeadline={previewDeadline}
                                    onChangeType={onChangeType}
                                    onChangeName={onChangeName}
                                    onChangeDescription={onChangeDescription}
                                    onChangeTargetAmount={onChangeTargetAmount}
                                    onChangeDeadlineMonths={onChangeDeadlineMonths}
                                    onChangePriority={onChangePriority}
                                    onCancel={handleClose}
                                    onNext={handleNextFromCreate}
                                    loading={loading}
                                />
                            )}

                            {step === 2 && (
                                <SavingPlanModeStep
                                    mode={mode}
                                    aiResponse={aiResponse}
                                    onBack={handleBackStep}
                                    onSelectMode={handleSelectMode}
                                    onContinue={handleContinueToReview}
                                />
                            )}

                            {step === 3 && (
                                <SavingPlanReviewStep
                                    mode={mode}
                                    aiResponse={aiResponse}
                                    loading={confirmLoading}
                                    onBack={handleBackStep}
                                    onConfirm={handleConfirmCreate}
                                    onCancel={handleClose}
                                />
                            )}
                        </ScrollView>
                    </View>

                </View>
            </Modal>

            <SuccessModal
                visible={showSuccessModal}
                onDone={handleSuccessClose}
                title="Project created successfully"
                description="Your project has been created."
                buttonText="Done"
            />

            <ConfirmExitModal
                visible={showExitModal}
                onCancel={() => setShowExitModal(false)}
                onConfirm={handleConfirmExit}
                title={t("project.confirmExit")}
                description={t("project.confirmExitDesc")}
                cancelText={t("common.cancel")}
                confirmText={t("common.continue")}
            />
        </>
    )
}
