import React, { useRef, useState, useEffect } from "react";
import { Alert, Modal, View, ScrollView, KeyboardAvoidingView, Keyboard, Platform, Pressable, Text } from "react-native";

import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";

import { projectStyles as styles } from "../../styles/projectStyles";
import { useCreateProject } from "../../hooks/useCreateProject";
import { getMonthsFromDeadline } from "../../utils/project";
import {
    CreateProjectModalStep,
    ProjectAdvisorResponse,

    SavingPlanMode,
    ProjectPriority,
} from "../../types/project.types";
import CreateProjectStep from "./CreateProjectStep";
import SavingPlanModeStep, { SavingPlanAction } from "./SavingPlanModeStep";
import FinancialSetupModal from "../financialSetup/FinancialSetupModal";
import BudgetAllocationSuggestionStep from "./BudgetAllocationSuggestionStep";
import { t } from "../../i18n";
import { ProjectAPI } from "../../api/project.api";
import { budgetAPI } from "../../api/budget.api";
import { BudgetAllocationPlanResponse } from "../../types/budget_allocation.types";
import { useAuth } from "../../context/AuthContext";
import type { UserResponse } from "../../types/auth.types";
import BudgetPlanReview, { ApplyItem } from "./BudgetPlanReview";
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../utils/dataRefreshEmitter";

type PendingCreateProjectAction =
    | "NEXT_STEP"
    | "CALL_ADVISOR"
    | "LOAD_BUDGET";

type SuccessKind = "PROJECT" | "BUDGET";

type Props = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
    /**
     * Seeds pre-filled when the modal opens, from an accepted CREATE_PROJECT
     * suggestion (proposedAction). `initialAmount` is the target/total goal;
     * `initialDeadline` is an ISO date converted to the form's month count. The
     * user edits these (and everything else, incl. the untouched name) freely.
     */
    initialAmount?: number;
    initialDeadline?: string;
};

export default function CreateProjectModal({
    visible,
    onClose,
    onCreated,
    initialAmount,
    initialDeadline,
}: Props) {
    const { user, refreshUser } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollOffsetRef = useRef(0);
    const focusedScrollOffsetRef = useRef(0);
    const descriptionFocusedRef = useRef(false);
    const [step, setStep] = useState<CreateProjectModalStep>(1);
    const [mode, setMode] = useState<SavingPlanMode | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const [showFinancialSetup, setShowFinancialSetup] = useState(false);
    const [loadingAction, setLoadingAction] = useState<SavingPlanAction>(null);
    const [advisorLoading, setAdvisorLoading] = useState(false);
    const [advisorData, setAdvisorData] = useState<ProjectAdvisorResponse | null>(null);
    const [advisorError, setAdvisorError] = useState<string | null>(null);
    const [usedPriorities, setUsedPriorities] = useState<ProjectPriority[]>([]);
    const [checkingPriorities, setCheckingPriorities] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successKind, setSuccessKind] = useState<SuccessKind>("PROJECT");
    const [showExitModal, setShowExitModal] = useState(false);

    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetPlan, setBudgetPlan] = useState<BudgetAllocationPlanResponse | null>(null);
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
        validateRequiredFields,
        onChangeName,
        onChangeDescription,
        onChangeTargetAmount,
        onChangeDeadlineMonths,
        onChangeType,
        onChangePriority,
        buildPayload,
        buildPayloadWithAdvisor,
        resetForm,
    } = useCreateProject({ usedPriorities, });

    const handleDescriptionFocus = () => {
        descriptionFocusedRef.current = true;
        focusedScrollOffsetRef.current = scrollOffsetRef.current;
    };

    const handleDescriptionBlur = () => {
        descriptionFocusedRef.current = false;
    };

    useEffect(() => {
        if (!visible) return;

        const keyboardShowSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
            setKeyboardHeight(event.endCoordinates.height);

            if (!descriptionFocusedRef.current) {
                return;
            }

            requestAnimationFrame(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            });
        });

        const keyboardHideSubscription = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);

            requestAnimationFrame(() => {
                scrollViewRef.current?.scrollTo({
                    y: focusedScrollOffsetRef.current,
                    animated: true,
                });
            });
        });

        return () => {
            keyboardShowSubscription.remove();
            keyboardHideSubscription.remove();
        };
    }, [visible]);

    const fetchUsedPriorities =
        async () => {

            try {

                setCheckingPriorities(true);

                const response = await ProjectAPI.getAll({ status: "ACTIVE", });

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

    // Pre-fill the target amount and deadline from an accepted CREATE_PROJECT
    // suggestion when the modal opens. onChangeTargetAmount handles formatting;
    // the ISO deadline is converted to the form's month count. Both stay
    // editable — target + deadline encode the suggested (capped) monthly saving.
    useEffect(() => {
        if (!visible) return;
        if (initialAmount && initialAmount > 0) {
            onChangeTargetAmount(String(initialAmount));
        }
        if (initialDeadline) {
            const months = getMonthsFromDeadline(initialDeadline);
            if (months) {
                onChangeDeadlineMonths(months);
            }
        }
    }, [visible, initialAmount, initialDeadline]);

    useEffect(() => {
        console.log(
            "6. Budget plan updated:",
            JSON.stringify(budgetPlan, null, 2)
        );
    }, [budgetPlan]);
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
        setBudgetPlan(null);
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
        // console.log("===== NEXT PRESSED =====");
        // console.log("values:", values);
        // console.log("errors before validate:", errors);
        // console.log(
        //     "financialSetupCompleted:",
        //     user?.financialSetupCompleted
        // );

        const isValid = validateRequiredFields();

        // console.log("validate result:", isValid);

        if (!isValid) {
            // console.log("Blocked by validation");
            return;
        }

        if (!user?.financialSetupCompleted) {
            // console.log("Opening financial setup");
            setPendingCreateProjectAction("NEXT_STEP");
            setShowFinancialSetup(true);
            return;
        }

        // console.log("Moving to step 2");
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

            // Thông báo Project đã thay đổi
            dataRefreshEmitter.emit(FINANCIAL_DATA_UPDATED);

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

        setSuccessKind("PROJECT");

        setShowSuccessModal(true);
    };

    const handleApplyBudgetAllocation = async (items: ApplyItem[]) => {
        if (!budgetPlan) {
            Alert.alert(t("project.budget_title"), t("project.no_budget_result"));
            return;
        }

        try {
            setBudgetSaveLoading(true);

            const payload = {
                month: budgetPlan.month,
                year: budgetPlan.year,
                budgets: items,
            };

            console.log(
                "🟣 [Budget] Bulk payload:",
                JSON.stringify(payload, null, 2)
            );

            const response = await budgetAPI.saveBulk(payload);

            if (!response?.success) {
                throw new Error(response?.message || t("project.failed_save_budget_allocation"));
            }

            dataRefreshEmitter.emit(FINANCIAL_DATA_UPDATED);

            setSuccessKind("BUDGET");

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

    // Deterministic, synchronous allocation — computes the plan in a single
    // HTTP call (no jobId / WebSocket) and moves to the editable review step.
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
            setBudgetPlan(null);

            const response = await budgetAPI.computeAllocation();

            if (!response?.success || !response.data) {
                if (isMissingFinancialSetupError(response?.errorCode)) {
                    setPendingCreateProjectAction("LOAD_BUDGET");
                    setShowFinancialSetup(true);
                    return;
                }

                throw new Error(
                    response?.message || t("project.failed_generate_budget_allocation")
                );
            }

            setBudgetPlan(response.data);
            setStep(4);
        } catch (error: any) {
            Alert.alert(
                t("project.budget_title"),
                error?.message || t("project.failed_generate_budget_allocation")
            );
        } finally {
            setBudgetLoading(false);
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
                statusBarTranslucent
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        style={styles.keyboardContainer}
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
                    >

                        <View style={styles.modalContainer}>
                            <ScrollView
                                ref={scrollViewRef}
                                onScroll={(event) => {
                                    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
                                }}
                                scrollEventThrottle={16}
                                style={styles.modalScrollView}
                                contentContainerStyle={[
                                    styles.scrollContainer,
                                    { paddingBottom: 40 + keyboardHeight },
                                ]}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                nestedScrollEnabled
                                automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
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
                                        onDescriptionFocus={handleDescriptionFocus}
                                        onDescriptionBlur={handleDescriptionBlur}
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

                                {step === 4 && budgetPlan && (
                                    <>
                                        <BudgetPlanReview
                                            plan={budgetPlan}
                                            applying={budgetSaveLoading}
                                            onApply={handleApplyBudgetAllocation}
                                        />
                                        <Pressable
                                            style={{ height: 48, alignItems: "center", justifyContent: "center", marginTop: 8 }}
                                            onPress={handleBudgetGenerationClose}
                                            disabled={budgetSaveLoading}
                                        >
                                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#6B7280" }}>
                                                {t("project.skip")}
                                            </Text>
                                        </Pressable>
                                    </>
                                )}


                            </ScrollView>
                        </View>

                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <SuccessModal
                visible={showSuccessModal}
                onDone={handleSuccessClose}
                title={
                    successKind === "BUDGET"
                        ? t("project.budget_saved_success_title")
                        : t("project.created_success_title")
                }
                description={
                    successKind === "BUDGET"
                        ? t("project.budget_saved_success_desc")
                        : t("project.created_success_desc")
                }
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
