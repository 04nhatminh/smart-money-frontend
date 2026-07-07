import React, { useState, useEffect } from "react";
import { Alert, Modal, View, ScrollView } from "react-native";

import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";

import { projectStyles as styles } from "../../styles/projectStyles";
import { useCreateProject } from "../../hooks/useCreateProject";
import {
    CreateProjectModalStep,
    ProjectAdvisorResponse,
    SavingPlanMode,
    ProjectPriority,
    BudgetAllocationResult,
} from "../../types/project.types";
import CreateProjectStep from "./CreateProjectStep";
import SavingPlanModeStep, { SavingPlanAction }from "./SavingPlanModeStep";
import FinancialSetupModal from "../financialSetup/FinancialSetupModal";
import BudgetAllocationSuggestionStep from "./BudgetAllocationSuggestionStep";
import { t } from "../../i18n";
import { ProjectAPI } from "../../api/project.api";
import { BudgetAIAPI } from "../../api/budgetAI.api";
import { budgetAPI, BudgetCategory } from "../../api/budget.api";
import { initWebSocket, subscribeBudgetJob } from "../../services/websocket";
import { useAuth } from "../../context/AuthContext";
import type { UserResponse } from "../../types/auth.types";
import BudgetAllocationReview from "./BudgetAllocationReview";

type PendingCreateProjectAction =
    | "NEXT_STEP"
    | "CALL_ADVISOR"
    | "LOAD_BUDGET";

const normalizeBudgetAllocationResult = (raw: any): BudgetAllocationResult | null => {
    const source = raw?.result ?? raw?.data ?? raw?.budgets ?? raw;
    const rawCategories =
        Array.isArray(source)
            ? source
            : source?.categories ?? source?.budgets ?? source?.data;

    console.log(
        "First budget category:",
        JSON.stringify(Array.isArray(rawCategories) ? rawCategories[0] : undefined, null, 2)
    );

    if (!Array.isArray(rawCategories)) {
        return null;
    }

    const categories = rawCategories.map((item: any) => ({
        category: String(
            item?.category ??
                item?.categoryName ??
                item?.name ??
                "OTHER"
        ),
        amount: Number(
            item?.amount ??
                item?.allocatedAmount ??
                item?.allocated_amount ??
                item?.amountLimit ??
                item?.budget ??
                item?.limit ??
                0
        ),
        percentage:
            item?.percentage != null
                ? Number(item.percentage)
                : item?.ratioPercent != null
                    ? Number(item.ratioPercent)
                    : item?.ratio != null
                        ? Number(item.ratio) * 100
                        : undefined,
        reason: item?.reason ?? item?.description ?? item?.explanation,
    }));

    if (categories.length === 0) {
        return null;
    }

    const totalBudget = Number(
        source?.totalBudget ??
        source?.total_budget ??
        source?.totalAmount ??
        categories.reduce((sum, item) => sum + item.amount, 0)
    );

    return {
        totalBudget,
        currency: source?.currency ?? raw?.currency ?? "VND",
        categories,
    };
};

type Props = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
    /**
     * Seed target amount, pre-filled when the modal opens. Carried by the
     * create-saving-project nudge (app://projects/create?amount=<seed>); the
     * user edits it (and everything else) freely.
     */
    initialAmount?: number;
};

export default function CreateProjectModal({
    visible,
    onClose,
    onCreated,
    initialAmount,
}: Props) {
    const { user, refreshUser } = useAuth();
    const [step, setStep] = useState<CreateProjectModalStep>(1);
    const [mode, setMode] = useState<SavingPlanMode | null>(null);

    const [showFinancialSetup, setShowFinancialSetup] = useState(false);
    const [loadingAction, setLoadingAction] = useState<SavingPlanAction>(null);
    const [advisorLoading, setAdvisorLoading] = useState(false);
    const [advisorData, setAdvisorData] = useState<ProjectAdvisorResponse | null>(null);
    const [advisorError, setAdvisorError] = useState<string | null>(null);
    const [usedPriorities, setUsedPriorities] = useState<ProjectPriority[]>([]);
    const [checkingPriorities, setCheckingPriorities] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetResult, setBudgetResult] = useState<BudgetAllocationResult | null>(null);
    const [budgetSaveLoading, setBudgetSaveLoading] = useState(false);

    // Budget allocation state
    const [showBudgetGeneration, setShowBudgetGeneration] = useState(false);
    const [pendingCreateProjectAction, setPendingCreateProjectAction] =
        useState<PendingCreateProjectAction | null>(null);

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

    const fetchUsedPriorities =
        async () => {

        try {

            setCheckingPriorities(true);

            const response = await ProjectAPI.getAll();

            if (!response?.success || !response?.data) {
            setUsedPriorities([]);
            return;
            }

            const priorities = [
                ...new Set(
                    response.data
                        .map(
                            (project) =>
                                project.priority
                        )
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

    // Pre-fill the target amount from the create-project nudge seed when the
    // modal opens. onChangeTargetAmount handles formatting.
    useEffect(() => {
        if (visible && initialAmount && initialAmount > 0) {
            onChangeTargetAmount(String(initialAmount));
        }
    }, [visible, initialAmount]);

    useEffect(() => {
        console.log(
            "6. Budget state updated:",
            JSON.stringify(budgetResult, null, 2)
        );
    }, [budgetResult]);
    useEffect(() => {
        if (visible) {
            fetchUsedPriorities();
        }
    }, [visible]);

    useEffect(() => {

        if (!visible) return;

        if (!canCreateProject) return;

        const currentPriorityUsed =
            usedPriorities.includes(
                values.priority
            );

        if (
            currentPriorityUsed &&
            availablePriorities.length > 0
        ) {

            onChangePriority(
                availablePriorities[0]
            );
        }

        console.log("Available priorities:",
            availablePriorities,
            "Used priorities:",
            usedPriorities
        );

    }, [
        visible,
        usedPriorities,
        availablePriorities,
        canCreateProject,
    ]);


    const resetAll = () => {
        resetForm();
        setStep(1);
        setMode(null);
        setAdvisorData(null);
        setAdvisorError(null);
        setAdvisorLoading(false);
        setLoadingAction(null);
        setShowFinancialSetup(false);
        setBudgetLoading(false);
        setBudgetResult(null);
        setBudgetSaveLoading(false);
        setShowBudgetGeneration(false);
        setPendingCreateProjectAction(null);
    };

    const handleClose = () => {
        if (isDirty || step !== 1 || mode) {
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

    const handleNextFromCreate = () => {
        if (!user?.financialSetupCompleted) {
            setPendingCreateProjectAction("NEXT_STEP");
            setShowFinancialSetup(true);
            return;
        }

        setStep(2);
    };

    const isMissingFinancialSetupError = (errorCode?: string) =>
        [
            "FINANCIAL_PROFILE_REQUIRED",
            "USER_FINANCIAL_PROFILE_REQUIRED",
            "USER_FINANCIAL_SETUP_REQUIRED",
            "FINANCIAL_SETUP_REQUIRED",
            "USER_INCOME_REQUIRED",
            "PROJECT_USER_INCOME_REQUIRED",
            "INCOME_PROFILE_REQUIRED",
        ].includes(errorCode ?? "");

    const callProjectAdvisor = async (selectedMode = mode) => {
        if (!selectedMode) return;

        try {
            setAdvisorLoading(true);
            setAdvisorData(null);
            setAdvisorError(null);

            const payload = buildPayload();

            if (!payload) {
                throw new Error(t("project.invalid_project_data"));
            }

            const response = await ProjectAPI.advisor({
                ...payload,
                mode: selectedMode,
            });

            if (!response?.success || !response?.data) {
                if (isMissingFinancialSetupError(response?.errorCode)) {
                    setPendingCreateProjectAction("CALL_ADVISOR");
                    setShowFinancialSetup(true);
                    return;
                }

                setAdvisorError(response?.message || t("project.ai_suggestion_failed"));
                return;
            }

            setAdvisorData(response.data);
        } catch (error: any) {
            Alert.alert(
                t("project.advisor_error_title"),
                error?.message || t("project.ai_suggestion_failed")
            );
        } finally {
            setAdvisorLoading(false);
        }
    };

    const handleSelectMode = async (selectedMode: SavingPlanMode) => {
        setMode(selectedMode);

        if (!user?.financialSetupCompleted) {
            setPendingCreateProjectAction("CALL_ADVISOR");
            setShowFinancialSetup(true);
            return;
        }

        await callProjectAdvisor(selectedMode);
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
        if (step === 5) {
            setStep(3);
            return;
        }
    };

    const createProject = async (useAdvisorDeadline: boolean) => {
        try {
            const payload =
            useAdvisorDeadline && advisorData
                ? buildPayloadWithAdvisor(advisorData)
                : buildPayload();

            console.log(payload);

            const response = await ProjectAPI.create(payload);

            if (!response?.success) {
            if (response?.errorCode === "PROJECT_ACTIVE_PRIORITY_CONFLICT") {
                await fetchUsedPriorities();
                setAdvisorData(null);
                setMode(null);
                setStep(1);

                Alert.alert(
                t("project.priority_conflict_title"),
                t("project.priority_conflict_desc")
                );

                return false;
            }

            throw new Error(
                response?.message || t("project.failed_create_project")
            );
            }

            return true;
        } catch (error: any) {
            Alert.alert(
            t("project.create_project_error_title"),
            error?.message || t("project.failed_create_project")
            );

            return false;
        }
    };

    const moveToBudgetGenerationStep = () => {
        setShowBudgetGeneration(true);
        setStep(3);
    };

    const handleConfirmAdvisorPlan = async () => {
        try {
            setLoadingAction("CONFIRM_AI_PLAN");

            // Xác nhận dùng saving plan do AI đề xuất
            const created = await createProject(true);

            if (created) {
            moveToBudgetGenerationStep();
            }
        } finally {
            setLoadingAction(null);
        }
        };

    const handleKeepOriginalPlan = async () => {
        try {
            setLoadingAction("KEEP_ORIGINAL_PLAN");

            // Giữ kế hoạch ban đầu của người dùng
            const created = await createProject(false);

            if (created) {
            moveToBudgetGenerationStep();
            }
        } finally {
            setLoadingAction(null);
        }
    };

    const handleBudgetGenerationClose = () => {
        setShowBudgetGeneration(false);
        setShowSuccessModal(true);
    };

    const handleSaveBudgetAllocation = async () => {
        if (!budgetResult) {
            Alert.alert(t("project.budget_title"), t("project.no_budget_result"));
            return;
        }

        try {
            setBudgetSaveLoading(true);

            const now = new Date();

            const payload = {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            budgets: budgetResult.categories.map((item) => ({
                category: item.category as BudgetCategory,
                amountLimit: item.amount,
            })),
            };

            console.log(
                "🟣 [Budget] Bulk payload:",
                JSON.stringify(payload, null, 2)
                );

            const response = await budgetAPI.saveBulk(payload);

            if (!response?.success) {
            throw new Error(response?.message || t("project.failed_save_budget_allocation"));
            }

            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert(
              t("common.error"),
              error?.message || t("project.failed_create_project")
            );
        } finally {
            setBudgetSaveLoading(false);
        }
        };

    const runBudgetGeneration = async (currentUser: UserResponse | null = user) => {
        if (!currentUser?.id) {
            Alert.alert(t("project.budget_title"), t("project.user_not_found"));
            return;
        }

        if (!currentUser.financialSetupCompleted) {
            setPendingCreateProjectAction("LOAD_BUDGET");
            setShowFinancialSetup(true);
            return;
        }

        try {
            setBudgetLoading(true);
            setBudgetResult(null);

            await initWebSocket(currentUser.id);

            const generateResponse = await BudgetAIAPI.generate();

            if (!generateResponse?.success || !generateResponse.data?.jobId) {
                if (isMissingFinancialSetupError(generateResponse?.errorCode)) {
                    setPendingCreateProjectAction("LOAD_BUDGET");
                    setShowFinancialSetup(true);
                    setBudgetLoading(false);
                    return;
                }

                throw new Error(
                    generateResponse?.message || t("project.failed_generate_budget_allocation")
                );
            }

            const jobId = generateResponse.data.jobId;
            console.log("1. Budget API jobId:", jobId);

            console.log("🟣 Budget generate jobId:", jobId);

            await subscribeBudgetJob(
            jobId,
            (message) => {
                console.log("✅ Budget allocation completed:", message);

                const normalizedResult = normalizeBudgetAllocationResult(message);

                if (!normalizedResult) {
                    setBudgetLoading(false);
                    Alert.alert(
                        t("project.budget_title"),
                        t("project.budget_result_missing_or_invalid")
                    );
                    return;
                }

                setBudgetResult(normalizedResult);
                setBudgetLoading(false);
                setStep(4);
            },
            (error) => {
                console.error("❌ Budget allocation socket error:", error);

                setBudgetLoading(false);

                Alert.alert(
                  t("project.budget_title"),
                  t("project.failed_receive_budget_result")
                );
            }
            );
        } catch (error: any) {
            setBudgetLoading(false);

            Alert.alert(
              t("project.budget_title"),
              error?.message || t("project.failed_generate_budget_allocation")
            );
        }
        };

    const handleCreateBudgetAllocation = async () => {
        if (!user?.financialSetupCompleted) {
            setPendingCreateProjectAction("LOAD_BUDGET");
            setShowFinancialSetup(true);
            return;
        }

        await runBudgetGeneration();
        };

    const handleFinancialSetupSuccess = async () => {
        setShowFinancialSetup(false);
        const latestUser = await refreshUser();

        if (!latestUser?.financialSetupCompleted) {
            setPendingCreateProjectAction(null);
            return;
        }

        const pendingAction = pendingCreateProjectAction;
        setPendingCreateProjectAction(null);

        if (pendingAction === "NEXT_STEP") {
            setStep(2);
            return;
        }

        if (pendingAction === "CALL_ADVISOR") {
            await callProjectAdvisor();
            return;
        }

        if (pendingAction === "LOAD_BUDGET") {
            await runBudgetGeneration(latestUser);
            return;
        }

        setStep(2);
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
                                    loadingAction={loadingAction}
                                    onBack={handleBackStep}
                                    onSelectMode={handleSelectMode}
                                    onEditProject={handleEditProjectFromAdvisor}
                                    onConfirmAdvisorPlan={handleConfirmAdvisorPlan}
                                    onKeepOriginalPlan={handleKeepOriginalPlan}    
                                />
                            )}

                            {step === 3 && showBudgetGeneration && (
                                <BudgetAllocationSuggestionStep
                                    loading={budgetLoading}
                                    onSkip={handleBudgetGenerationClose}
                                    onCreate={handleCreateBudgetAllocation}
                                />
                            )}

                            {step === 4 && (
                                <BudgetAllocationReview
                                    budgetResult={budgetResult}
                                    loading={budgetSaveLoading}
                                    onBack={handleBackStep}
                                    onConfirm={handleSaveBudgetAllocation}
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
                title={t("project.created_success_title")}
                description={t("project.created_success_desc")}
                buttonText={t("common.done")}
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

            <FinancialSetupModal
                visible={showFinancialSetup}
                mode="onboarding"
                onSuccess={handleFinancialSetupSuccess}
            />
        </>
    );
}
