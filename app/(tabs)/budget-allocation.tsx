import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { BudgetAllocationApi } from "../../src/api/budgetAllocation.api";
import { BudgetAllocationResult } from "../../src/types/budget_allocation.types";
import { useAuth } from "../../src/context/AuthContext";
import { initWebSocket, subscribeBudgetJob } from "../../src/services/websocket";
import { userStorage } from "../../src/storage/userStorage";
import { i18n, t } from "../../src/i18n";
// ==============================
// CACHE HELPERS
// ==============================
const getFinancialProfileReadyFromCache = async (): Promise<boolean> => {
  const cachedUser = await userStorage.getUser();

  if (!cachedUser) {
    return false;
  }

  const userData = cachedUser as any;

  return userData.onboardingCompleted

};

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "budget.category_food",
  TRANSPORTATION: "budget.category_transportation",
  CLOTHING: "budget.category_clothing",
  UTILITIES: "budget.category_utilities",
  ENTERTAINMENT: "budget.category_entertainment",
  HEALTH: "budget.category_health",
  EDUCATION: "budget.category_education",
  SHOPPING: "budget.category_shopping",
  OTHER: "budget.category_other",
};


export default function BudgetAllocationPage() {
    const router = useRouter();
    const { user } = useAuth();

    console.log("1. User data on Budget Allocation Page:", JSON.stringify(user, null, 2));

    const unsubscribeBudgetJobRef = useRef<(() => void) | null>(null);

    const [financialProfileReady, setFinancialProfileReady] = useState(true);

    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetJobCreated, setBudgetJobCreated] = useState(false);
    const [budgetError, setBudgetError] = useState<string | null>(null);
    const [budgetResult, setBudgetResult] = useState<BudgetAllocationResult | null>(null);
    const numberFormatter = new Intl.NumberFormat(
        i18n.locale === "vi" ? "vi-VN" : "en-US"
    );

    useEffect(() => {
        checkFinancialProfileCache();

        return () => {
            unsubscribeBudgetJobRef.current?.();
            unsubscribeBudgetJobRef.current = null;
        };
    }, [user?.id]);

    useEffect(() => {
        console.log(
            "6. Budget state updated:",
            JSON.stringify(budgetResult, null, 2)
        );
    }, [budgetResult]);

    const checkFinancialProfileCache = async () => {
        try {
            const ready = await getFinancialProfileReadyFromCache();

            /**
             * Nếu cache không có flag thì không block màn hình này.
             * Backend generateBudget vẫn có thể validate profile ở phía server.
             */
            if (ready === false) {
                setFinancialProfileReady(false);
            } else {
                setFinancialProfileReady(true);
            }
        } catch (error) {
            console.warn("Failed to read financial profile cache:", error);

            /**
             * Không đọc được cache thì vẫn cho generate.
             * Không nên gọi API profile ở page này nữa.
             */
            setFinancialProfileReady(true);
        }
    };

    const normalizeBudgetResult = (rawResult: any): BudgetAllocationResult => {
        const categoriesFromResult =
            rawResult?.categories ??
            rawResult?.budgets?.map((item: any) => ({
                category: item.category,
                amount: Number(item.amount ?? item.amountLimit ?? 0),
                percentage: item.percentage,
                reason: item.reason,
            })) ??
            [];

        return {
            totalBudget: Number(rawResult?.totalBudget ?? rawResult?.total ?? 0),
            currency: rawResult?.currency ?? "VND",
            categories: categoriesFromResult,
        };
    };

    const handleGenerateBudget = async () => {
        setBudgetError(null);
        setBudgetResult(null);

        try {
            if (!user?.id) {
                setBudgetError(t("budget.user_not_found"));
                return;
            }

            const ready = await getFinancialProfileReadyFromCache();

            if (ready === false) {
                setFinancialProfileReady(false);
                setBudgetError(t("budget.financial_profile_required_to_generate_personalized_budget_allocation_suggestions"));
                return;
            }

            setFinancialProfileReady(true);
            setBudgetLoading(true);

            await initWebSocket(user.id);

            const res = await BudgetAllocationApi.generateBudget();
            const jobId = res.data?.jobId;

            if (res.success && jobId) {
                console.log("1. Budget API jobId:", jobId);

                unsubscribeBudgetJobRef.current?.();

                unsubscribeBudgetJobRef.current = await subscribeBudgetJob(
                    jobId,
                    (message) => {
                        if (
                            message.type === "BUDGET_ALLOCATION_RESULT" &&
                            message.status === "COMPLETED" &&
                            message.result
                        ) {
                            const normalizedResult = normalizeBudgetResult(message.result);

                            setBudgetResult(normalizedResult);
                            setBudgetLoading(false);
                            setBudgetJobCreated(false);
                        }
                    },
                    (error) => {
                        console.error("Budget allocation socket error:", error);

                        setBudgetLoading(false);
                        setBudgetJobCreated(false);
                        setBudgetError(t("budget.failed_receive_budget_result"));
                    }
                );

                setBudgetJobCreated(true);
            } else {
                setBudgetError(res.message ?? t("budget.failed_generate_budget_allocation"));
                setBudgetLoading(false);
            }
        } catch (error: any) {
            setBudgetError(error?.message ?? t("budget.failed_generate_budget_allocation"));
            setBudgetLoading(false);
            setBudgetJobCreated(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>{t("budget.title")}</Text>

                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="sparkles" size={20} color="#4B3FD6" />
                        <Text style={styles.sectionTitle}>{t("budget.title")}</Text>
                    </View>

                    <Text style={styles.budgetDesc}>
                        {t("budget.financial_profile_help")}
                    </Text>

                    {!financialProfileReady && (
                        <View style={styles.warningCard}>
                            <Ionicons name="alert-circle" size={16} color="#D97706" />
                            <Text style={styles.warningText}>
                                {t("budget.financial_profile_required_to_generate_personalized_budget_allocation_suggestions")}
                            </Text>
                        </View>
                    )}

                    {budgetError && (
                        <View style={styles.errorCard}>
                            <Ionicons name="alert-circle" size={16} color="#DC2626" />
                            <Text style={styles.errorText}>{budgetError}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.aiBtn,
                            (budgetLoading || !financialProfileReady) && styles.aiBtnDisabled,
                        ]}
                        onPress={handleGenerateBudget}
                        disabled={budgetLoading || !financialProfileReady}
                    >
                        {budgetLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                        )}

                        <Text style={styles.aiBtnText}>
                            {budgetLoading ? t("budget.generating") : t("budget.create_budget_allocation")}
                        </Text>
                    </TouchableOpacity>

                    {budgetResult && (
                        <View style={styles.resultCard}>
                            <View style={styles.resultRow}>
                                <Text style={styles.resultLabel}>{t("budget.total_budget")}</Text>

                                <Text style={styles.resultAmount}>
                                    {numberFormatter.format(budgetResult.totalBudget)}{" "}
                                    {budgetResult.currency}
                                </Text>
                            </View>

                            {budgetResult.categories.map((item, index) => (
                                <View
                                    key={`${item.category}-${index}`}
                                    style={styles.categoryRow}
                                >
                                    <View style={styles.categoryTextWrap}>
                                        <Text style={styles.categoryName}>
                                            {t(CATEGORY_LABELS[item.category] ?? item.category)}
                                        </Text>

                                        {item.reason ? (
                                            <Text style={styles.categoryReason}>
                                                {item.reason}
                                            </Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.categoryAmountWrap}>
                                        <Text style={styles.categoryAmount}>
                                            {numberFormatter.format(Number(item.amount ?? 0))}{" "}
                                            {budgetResult.currency}
                                        </Text>

                                        {item.percentage != null && (
                                            <Text style={styles.categoryPercent}>
                                                {Number(item.percentage).toFixed(1)}%
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={budgetJobCreated} transparent animationType="fade">
                <View style={styles.popupOverlay}>
                    <View style={styles.popupCard}>
                        <View style={styles.popupIconWrap}>
                            <View style={styles.popupIconCircle}>
                                <Ionicons name="checkmark-circle" size={52} color="#059669" />
                            </View>
                        </View>

                        <Text style={styles.popupTitle}>
                            {t("budget.budget_job_created_title")}
                        </Text>

                        <Text style={styles.popupSubtitle}>
                            {t("budget.budget_job_created_desc")}
                        </Text>

                        <Pressable
                            style={styles.popupBtn}
                            onPress={() => setBudgetJobCreated(false)}
                        >
                            <Text style={styles.popupBtnText}>{t("common.continue")}</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        marginTop: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        gap: 16,
    },
    sectionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    budgetDesc: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
        marginBottom: 16,
    },
    warningCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF3C7",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FCD34D",
    },
    warningText: {
        fontSize: 13,
        color: "#92400E",
        flex: 1,
    },
    errorCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEE2E2",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    errorText: {
        fontSize: 13,
        color: "#991B1B",
        flex: 1,
    },
    aiBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#4B3FD6",
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 20,
        alignSelf: "flex-start",
    },
    aiBtnDisabled: {
        opacity: 0.6,
    },
    aiBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    resultCard: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 14,
        gap: 12,
    },
    resultRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    resultLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
        flex: 1,
    },
    resultAmount: {
        fontSize: 14,
        fontWeight: "800",
        color: "#059669",
        textAlign: "right",
        flexShrink: 0,
    },
    categoryRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    categoryTextWrap: {
        flex: 1,
        minWidth: 0,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    categoryReason: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 17,
        color: "#6B7280",
    },
    categoryAmountWrap: {
        alignItems: "flex-end",
        flexShrink: 0,
    },
    categoryAmount: {
        fontSize: 13,
        fontWeight: "700",
        color: "#4B3FD6",
    },
    categoryPercent: {
        marginTop: 3,
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    popupOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    popupCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        paddingTop: 52,
        paddingBottom: 28,
        paddingHorizontal: 24,
        alignItems: "center",
        width: "100%",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    popupIconWrap: {
        position: "absolute",
        top: -40,
        alignItems: "center",
    },
    popupIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#D1FAE5",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 4,
        borderColor: "#FFFFFF",
        shadowColor: "#059669",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    popupTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111111",
        textAlign: "center",
        marginBottom: 10,
    },
    popupSubtitle: {
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 19,
        textAlign: "center",
        marginBottom: 24,
    },
    popupBtn: {
        backgroundColor: "#4B3FD6",
        borderRadius: 25,
        paddingVertical: 13,
        paddingHorizontal: 48,
    },
    popupBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 0.4,
    },
});
