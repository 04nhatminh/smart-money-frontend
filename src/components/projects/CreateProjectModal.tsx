import React, { useMemo, useState, useEffect } from "react";
import { Alert, Modal, View, ScrollView, Text } from "react-native";

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
import { UserIncomeApi } from "../../api/userIncome.api";
import CreateProjectStep from "./CreateProjectStep";
import SavingPlanModeStep from "./SavingPlanModeStep";
import SavingPlanReviewStep from "./SavingPlanReviewStep";
import SetupIncomeModal from "./SetupIncomeModal";
import { t } from "../../i18n";
import { ProjectAPI } from "../../api/project.api";
import { BudgetAIAPI } from "../../api/budgetAI.api";
import { budgetAPI } from "../../api/budget.api";
import { UserFinancialProfileAPI } from "../../api/userFinancialProfile.api";
import { initWebSocket, subscribeBudgetJob } from "../../services/websocket";
import { ButtonSave } from "../ButtonSave";

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

    const [showIncomeRequiredModal, setShowIncomeRequiredModal] = useState(false);
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

    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetResult, setBudgetResult] = useState<BudgetAllocationResult | null>(null);
    const [budgetSaveLoading, setBudgetSaveLoading] = useState(false);

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
        setCreatedProjectId(null);
        setAdvisorLoading(false);
        setConfirmLoading(false);
        setShowSetupIncome(false);
        setBudgetLoading(false);
        setBudgetResult(null);
        setBudgetSaveLoading(false);
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

            const hasIncome =
            incomeResponse?.success &&
            !!incomeResponse?.data;

            if (!hasIncome) {
            setShowIncomeRequiredModal(true);
            return;
            }

            setStep(2);
        } catch (error: any) {
            const status = error?.response?.status;

            if (status === 404) {
            setShowIncomeRequiredModal(true);
            return;
            }

            Alert.alert(
            "Income Error",
            error?.response?.data?.message ||
                error?.message ||
                "Failed to check income information"
            );
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
            error?.message ||
                "Failed to get AI suggestion"
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
        if (step === 1) {
            return;
        }

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

    const createProject =
    async (
      useAdvisorDeadline:
        boolean
    ) => {

      try {

        setConfirmLoading(true);

        const payload =
          useAdvisorDeadline &&
          advisorData
            ? buildPayloadWithAdvisor(
                advisorData
              )
            : buildPayload();

        const response =
          await ProjectAPI.create(
            payload
          );

        if (
          !response?.success
        ) {

          throw new Error(
            response?.message ||
            "Failed to create project"
          );
        }

        setStep(3);

      } catch (error: any) {

        Alert.alert(
          "Create Project Error",
          error?.message ||
            "Failed to create project"
        );

      } finally {

        setConfirmLoading(false);
      }
    };

    const handleConfirmAdvisorPlan =
        async () => {
        await createProject(true);
    }; 

    const handleKeepOriginalPlan =
        async () => {
        await createProject(false);
    };

    const handleSaveBudgetAllocation = async () => {
        if (!budgetResult) {
            Alert.alert("Budget", "No budget allocation result to save.");
            return;
        }

        try {
            setBudgetSaveLoading(true);

            const now = new Date();

            const payload = {
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            budgets: budgetResult.categories.map((item) => ({
                category: item.category,
                amountLimit: item.amount,
            })),
            };

            console.log(
                "🟣 [Budget] Bulk payload:",
                JSON.stringify(payload, null, 2)
                );

            const response = await budgetAPI.createBulk(payload);

            if (!response?.success) {
            throw new Error(response?.message || "Failed to save budget allocation");
            }

            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert(
            "Budget Allocation",
            error?.message || "Failed to save budget allocation"
            );
        } finally {
            setBudgetSaveLoading(false);
        }
        };

    const handleCreateBudgetAllocation = async () => {
        try {
            setBudgetLoading(true);
            setBudgetResult(null);

            const profileResponse = await UserFinancialProfileAPI.getMe();

            if (!profileResponse?.success || !profileResponse.data) {
            setBudgetLoading(false);

            Alert.alert(
                "Financial Profile Required",
                "Please create your financial profile before generating budget allocation."
            );

            return;
            }

            const userId = profileResponse.data.userId;

            await initWebSocket(userId);

            const generateResponse = await BudgetAIAPI.generate();

            if (!generateResponse?.success || !generateResponse.data?.jobId) {
            throw new Error(
                generateResponse?.message || "Failed to generate budget allocation"
            );
            }

            const jobId = generateResponse.data.jobId;

            console.log("🟣 Budget generate jobId:", jobId);

            await subscribeBudgetJob(
            jobId,
            (message) => {
                console.log("✅ Budget allocation completed:", message);

                setBudgetResult(message.result);
                setBudgetLoading(false);
            },
            (error) => {
                console.error("❌ Budget allocation socket error:", error);

                setBudgetLoading(false);

                Alert.alert(
                "Budget Allocation",
                "Failed to receive budget allocation result."
                );
            }
            );
        } catch (error: any) {
            setBudgetLoading(false);

            Alert.alert(
            "Budget Allocation",
            error?.message || "Failed to create budget allocation"
            );
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
                                    budgetResult={budgetResult}
                                    loading={budgetSaveLoading}
                                    onBack={handleBackStep}
                                    onCreateBudget={handleCreateBudgetAllocation}
                                    onConfirm={handleSaveBudgetAllocation}
                                    onCancel={handleClose}
                                />
                            )}
                        </ScrollView>

                       {showIncomeRequiredModal && (
                            <View style={styles.popupOverlay}>
                                <View style={styles.popupCard}>

                                <Text style={styles.popupTitle}>
                                    Income setup required
                                </Text>

                                <Text style={styles.popupMessage}>
                                    To generate a suitable saving plan,
                                    please set up your income information first.
                                </Text>

                                <View style={styles.popupActions}>
                                    <ButtonSave
                                    label="Cancel"
                                    variant="secondary"
                                    onPress={() =>
                                        setShowIncomeRequiredModal(false)
                                    }
                                    />

                                    <ButtonSave
                                    label="Create"
                                    onPress={() => {
                                        setShowIncomeRequiredModal(false);
                                        setShowSetupIncome(true);
                                    }}
                                    />
                                </View>

                                </View>
                            </View>
                        )}
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
        </>
    )
}
