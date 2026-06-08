import React, { useMemo, useState, useEffect } from "react";
import { Alert, Modal, View, ScrollView } from "react-native";

import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";

import { projectStyles as styles } from "../../styles/projectStyles";
import { useCreateProject } from "../../hooks/useCreateProject";
import {
    CreateProjectModalStep,
    CreateProjectPayload,
    ProjectAdvisorResponse,
    PROJECT_PRIORITIES,
    SavingPlanMode,
    ProjectPriority,
} from "../../types/project.types";
import { UserIncomeApi } from "../../api/userIncome.api";
import CreateProjectStep from "./CreateProjectStep";
import SavingPlanModeStep from "./SavingPlanModeStep";
import SavingPlanReviewStep from "./SavingPlanReviewStep";
import SetupIncomeModal from "./SetupIncomeModal";
import BudgetAllocationSuggestionStep from "./BudgetAllocationSuggestionStep";
import SetupFinancialProfileModal from "./SetupFinancialProfileModal";
import CreateBudgetAllocationModal from "./CreateBudgetAllocationModal";
import { t } from "../../i18n";
import { ProjectAPI } from "../../api/project.api";
import { BudgetAllocationApi } from "../../api/budgetAllocation.api";
import { GenerateBudgetAllocationPayload } from "../../types/budget_allocation.types";

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
    const [showSetupIncome, setShowSetupIncome] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [advisorLoading, setAdvisorLoading] = useState(false);
    const [advisorData, setAdvisorData] = useState<ProjectAdvisorResponse | null>(null);
    const [advisorError, setAdvisorError] = useState<string | null>(null);
    const [usedPriorities, setUsedPriorities] = useState<ProjectPriority[]>([]);
    const [checkingPriorities, setCheckingPriorities] = useState(false);
    const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    // Budget allocation state
    const [profileCheckLoading, setProfileCheckLoading] = useState(false);
    const [showSetupFinancialProfile, setShowSetupFinancialProfile] = useState(false);
    const [showBudgetGeneration, setShowBudgetGeneration] = useState(false);
    const [budgetPayload, setBudgetPayload] = useState<GenerateBudgetAllocationPayload | null>(null);

    const {
        values,
        errors,
        loading,
        previewDeadline,
        isDirty,
        canCreateProject,
        availablePriorities,
        onChangeName,
        onChangeDescription,
        onChangeTargetAmount,
        onChangeDeadlineMonths,
        onChangeType,
        onChangePriority,
        buildPayload,
        buildPayloadWithAdvisor,
        resetForm,
    } = useCreateProject({usedPriorities,});

    const fetchUsedPriorities = async () => {
        try {
            setCheckingPriorities(true);
            const response = await ProjectAPI.getAll({
                status: "ACTIVE",
            });

            if (!response?.success || !response?.data) {
                setUsedPriorities([]);
                return;
            }

            const priorities = [
                ...new Set(
                    response.data
                        .map((project) => project.priority)
                        .filter(Boolean)
                ),
            ] as ProjectPriority[];

            setUsedPriorities(priorities);
        } catch (error) {
            console.log("Fetch priorities error:", error);
            setUsedPriorities([]);
        } finally {
            setCheckingPriorities(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchUsedPriorities();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) return;
        if (!canCreateProject) return;

        const currentPriorityUsed = usedPriorities.includes(values.priority);

        if (currentPriorityUsed && availablePriorities.length > 0) {
            onChangePriority(availablePriorities[0]);
        }

        console.log("Available priorities:", availablePriorities, "Used priorities:", usedPriorities);
    }, [visible, usedPriorities, availablePriorities, canCreateProject]);

    const resetAll = () => {
        resetForm();
        setStep(1);
        setMode(null);
        setAdvisorData(null);
        setAdvisorError(null);
        setCreatedProjectId(null);
        setAdvisorLoading(false);
        setConfirmLoading(false);
        setShowSetupIncome(false);
        setBudgetPayload(null);
        setProfileCheckLoading(false);
        setShowSetupFinancialProfile(false);
        setShowBudgetGeneration(false);
    };

    const handleClose = () => {
        if (isDirty || step !== 1 || createdProjectId || mode) {
            setShowExitModal(true);
            return;
        }

        resetAll();
        onClose();
    };

    const handleConfirmExit = () => {
        setShowExitModal(false);
        resetAll();
        onClose();
    };

    const handleNextFromCreate = async () => {
        try {
            const incomeResponse = await UserIncomeApi.getMe();
            const hasIncome = incomeResponse?.success && !!incomeResponse?.data;

            if (!hasIncome) {
                setShowSetupIncome(true);
                return;
            }

            setStep(2);
        } catch (error) {
            setShowSetupIncome(true);
        }
    };

    const handleSelectMode = async (selectedMode: SavingPlanMode) => {
        try {
            setMode(selectedMode);
            setAdvisorLoading(true);
            setAdvisorData(null);
            setAdvisorError(null);

            const payload = buildPayload();

            if (!payload) {
                throw new Error("Invalid project data");
            }

            const response = await ProjectAPI.advisor({
                ...payload,
                mode: selectedMode,
            });

            if (!response?.success || !response?.data) {
                setAdvisorError(
                    response?.message || "Failed to get AI suggestion"
                );
                return;
            }

            setAdvisorData(response.data);
        } catch (error: any) {
            Alert.alert(
                "Advisor Error",
                error?.message || "Failed to get AI suggestion"
            );
        } finally {
            setAdvisorLoading(false);
        }
    };

    const handleEditProjectFromAdvisor = () => {
        setAdvisorError(null);
        setAdvisorData(null);
        setMode(null);
        setStep(1);
    };

    const handleBackStep = () => {
        if (step === 1) return;
        if (step === 2) {
            setAdvisorData(null);
            setMode(null);
            setStep(1);
            return;
        }
        if (step === 3) {
            setStep(2);
            return;
        }
    };

    const createProject = async (useAdvisorDeadline: boolean) => {
        try {
            setConfirmLoading(true);

            const payload =
                useAdvisorDeadline && advisorData
                    ? buildPayloadWithAdvisor(advisorData)
                    : buildPayload();

            const response = await ProjectAPI.create(payload);

            if (!response?.success) {
                throw new Error(
                    response?.message || "Failed to create project"
                );
            }

            setStep(3);
        } catch (error: any) {
            Alert.alert(
                "Create Project Error",
                error?.message || "Failed to create project"
            );
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleConfirmAdvisorPlan = async () => {
        await createProject(true);
    };

    const handleKeepOriginalPlan = async () => {
        await createProject(false);
    };

    const handleConfirmCreate = async () => {
        if (!advisorData) return;

        try {
            setConfirmLoading(true);

            const payload = buildPayloadWithAdvisor(advisorData);

            console.log(
                "🟣 Create project with advisor-confirmed deadline:",
                JSON.stringify(payload, null, 2)
            );

            const response = await ProjectAPI.create(payload);

            if (!response?.success) {
                throw new Error(
                    response?.message || "Failed to create project"
                );
            }

            // Proceed to budget allocation suggestion instead of success modal
            setStep(4);
        } catch (error: any) {
            Alert.alert(
                "Error",
                error?.message || "Failed to create project"
            );
        } finally {
            setConfirmLoading(false);
        }
    };

    // ── Budget allocation handlers ──────────────────────────────────────────

    const handleCreateBudgetAllocation = async () => {
        try {
            setProfileCheckLoading(true);
            const res = await BudgetAllocationApi.getUserFinancialProfile();

            if (res.success && res.data) {
                // Profile exists — uppercase the values and go straight to generation
                const payload: GenerateBudgetAllocationPayload = {
                    role: res.data.role.toUpperCase(),
                    living_status: res.data.living_status.toUpperCase(),
                    income_level: res.data.income_level.toUpperCase(),
                    transport_mode: res.data.transport_mode.toUpperCase(),
                    spending_style: res.data.spending_style.toUpperCase(),
                    work_style: res.data.work_style.toUpperCase(),
                    family_status: res.data.family_status.toUpperCase(),
                    study_intensity: res.data.study_intensity.toUpperCase(),
                    health_need: res.data.health_need.toUpperCase(),
                };
                setBudgetPayload(payload);
                setShowBudgetGeneration(true);
            } else {
                // No profile — let the user fill in the form
                setShowSetupFinancialProfile(true);
            }
        } catch {
            setShowSetupFinancialProfile(true);
        } finally {
            setProfileCheckLoading(false);
        }
    };

    const handleFinancialProfileSubmit = (
        payload: GenerateBudgetAllocationPayload
    ) => {
        setShowSetupFinancialProfile(false);
        setBudgetPayload(payload);
        setShowBudgetGeneration(true);
    };

    const handleBudgetGenerationClose = () => {
        setShowBudgetGeneration(false);
        setShowSuccessModal(true);
    };

    const handleSkipBudgetAllocation = () => {
        setShowSuccessModal(true);
    };

    // ── Success close ───────────────────────────────────────────────────────

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
                                    values={values}
                                    errors={errors}
                                    previewDeadline={previewDeadline}
                                    loading={loading}
                                    checkingPriorities={checkingPriorities}
                                    canCreateProject={canCreateProject}
                                    availablePriorities={availablePriorities}
                                    onChangeType={onChangeType}
                                    onChangeName={onChangeName}
                                    onChangeDescription={onChangeDescription}
                                    onChangeTargetAmount={onChangeTargetAmount}
                                    onChangeDeadlineMonths={onChangeDeadlineMonths}
                                    onChangePriority={onChangePriority}
                                    onCancel={handleClose}
                                    onNext={handleNextFromCreate}
                                />
                            )}

                            {step === 2 && (
                                <SavingPlanModeStep
                                    mode={mode}
                                    advisorData={advisorData}
                                    advisorLoading={advisorLoading}
                                    advisorError={advisorError}
                                    onBack={handleBackStep}
                                    onSelectMode={handleSelectMode}
                                    onEditProject={handleEditProjectFromAdvisor}
                                    onConfirmAdvisorPlan={handleConfirmAdvisorPlan}
                                    onKeepOriginalPlan={handleKeepOriginalPlan}
                                    confirmLoading={confirmLoading}
                                />
                            )}

                            {step === 3 && (
                                <SavingPlanReviewStep
                                    mode={mode}
                                    advisorData={advisorData}
                                    loading={confirmLoading}
                                    onBack={handleBackStep}
                                    onConfirm={handleConfirmCreate}
                                    onCancel={handleClose}
                                />
                            )}

                            {step === 4 && (
                                <BudgetAllocationSuggestionStep
                                    loading={profileCheckLoading}
                                    onSkip={handleSkipBudgetAllocation}
                                    onCreate={handleCreateBudgetAllocation}
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

            <SetupIncomeModal
                visible={showSetupIncome}
                onClose={() => setShowSetupIncome(false)}
                onSuccess={() => {
                    setShowSetupIncome(false);
                    setStep(2);
                }}
            />

            <SetupFinancialProfileModal
                visible={showSetupFinancialProfile}
                onClose={() => setShowSetupFinancialProfile(false)}
                onSubmit={handleFinancialProfileSubmit}
            />

            <CreateBudgetAllocationModal
                visible={showBudgetGeneration}
                payload={budgetPayload}
                onClose={handleBudgetGenerationClose}
            />
        </>
    );
}
