import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import SuccessModal from "../SuccessModal";
import FinancialSetupModal from "../financialSetup/FinancialSetupModal";
import BudgetAllocationSuggestionStep from "../projects/BudgetAllocationSuggestionStep";
import BudgetPlanReview, { ApplyItem } from "../projects/BudgetPlanReview";
import { useProjectStyles } from "../../styles/projectStyles";
import { budgetAPI } from "../../api/budget.api";
import { BudgetAllocationPlanResponse } from "../../types/budget_allocation.types";
import { useAuth } from "../../context/AuthContext";
import type { UserResponse } from "../../types/auth.types";
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../utils/dataRefreshEmitter";
import { t } from "../../i18n";

type Props = {
    visible: boolean;
    onClose: () => void;
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

/**
 * Standalone gen-budget flow (suggestion step -> editable plan review), shown
 * after actions that change the monthly saving commitment — e.g. joining a
 * group project — so the user's budgets reflect the new envelope. Mirrors
 * steps 3–4 of CreateProjectModal.
 */
export default function BudgetGenerationModal({ visible, onClose }: Props) {
    const { styles, theme } = useProjectStyles();
    const { user, refreshUser } = useAuth();

    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetPlan, setBudgetPlan] = useState<BudgetAllocationPlanResponse | null>(null);
    const [budgetSaveLoading, setBudgetSaveLoading] = useState(false);
    const [showFinancialSetup, setShowFinancialSetup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const resetAll = () => {
        setBudgetLoading(false);
        setBudgetPlan(null);
        setBudgetSaveLoading(false);
        setShowFinancialSetup(false);
    };

    const handleClose = () => {
        resetAll();
        onClose();
    };

    const runBudgetGeneration = async (currentUser: UserResponse | null = user) => {
        if (!currentUser?.id) {
            Alert.alert(t("project.budget_title"), t("project.user_not_found"));
            return;
        }

        if (!currentUser.financialSetupCompleted) {
            setShowFinancialSetup(true);
            return;
        }

        try {
            setBudgetLoading(true);
            setBudgetPlan(null);

            const response = await budgetAPI.computeAllocation();

            if (!response?.success || !response.data) {
                if (isMissingFinancialSetupError(response?.errorCode)) {
                    setShowFinancialSetup(true);
                    return;
                }

                throw new Error(
                    response?.message || t("project.failed_generate_budget_allocation")
                );
            }

            setBudgetPlan(response.data);
        } catch (error: any) {
            Alert.alert(
                t("project.budget_title"),
                error?.message || t("project.failed_generate_budget_allocation")
            );
        } finally {
            setBudgetLoading(false);
        }
    };

    const handleApplyBudgetAllocation = async (items: ApplyItem[]) => {
        if (!budgetPlan) {
            Alert.alert(t("project.budget_title"), t("project.no_budget_result"));
            return;
        }

        try {
            setBudgetSaveLoading(true);

            const response = await budgetAPI.saveBulk({
                month: budgetPlan.month,
                year: budgetPlan.year,
                budgets: items,
            });

            if (!response?.success) {
                throw new Error(
                    response?.message || t("project.failed_save_budget_allocation")
                );
            }

            dataRefreshEmitter.emit(FINANCIAL_DATA_UPDATED);

            setShowSuccessModal(true);
        } catch (error: any) {
            Alert.alert(
                t("common.error"),
                error?.message || t("project.failed_save_budget_allocation")
            );
        } finally {
            setBudgetSaveLoading(false);
        }
    };

    const handleFinancialSetupSuccess = async () => {
        setShowFinancialSetup(false);
        const latestUser = await refreshUser();

        if (!latestUser?.financialSetupCompleted) {
            return;
        }

        await runBudgetGeneration(latestUser);
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        handleClose();
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
                                style={styles.modalScrollView}
                                contentContainerStyle={[styles.scrollContainer, { paddingBottom: 40 }]}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="on-drag"
                                nestedScrollEnabled
                                automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                            >
                                {!budgetPlan ? (
                                    <BudgetAllocationSuggestionStep
                                        loading={budgetLoading}
                                        onSkip={handleClose}
                                        onCreate={() => runBudgetGeneration()}
                                    />
                                ) : (
                                    <>
                                        <BudgetPlanReview
                                            plan={budgetPlan}
                                            applying={budgetSaveLoading}
                                            onApply={handleApplyBudgetAllocation}
                                        />
                                        <Pressable
                                            style={{ height: 48, alignItems: "center", justifyContent: "center", marginTop: 8 }}
                                            onPress={handleClose}
                                            disabled={budgetSaveLoading}
                                        >
                                            <Text style={{ fontSize: 15, fontWeight: "600", color: theme.subtext }}>
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
                title={t("project.budget_saved_success_title")}
                description={t("project.budget_saved_success_desc")}
                buttonText={t("common.done")}
            />

            <FinancialSetupModal
                visible={showFinancialSetup}
                mode="onboarding"
                onSuccess={handleFinancialSetupSuccess}
            />
        </>
    );
}
