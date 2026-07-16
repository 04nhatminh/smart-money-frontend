import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { KeyboardScreen } from "../KeyboardScreen";
import { budgetAPI, BudgetItem } from "../../src/api/budget.api";
import { CircularProgress } from "../../src/components/CircularProgress";
import { formatVND } from "../../src/utils/formatCurrency";
import AppBottomBar from "../../src/components/AppBottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";
import { Receipt } from "../../src/types/transaction.types";
import { FinancialSetupApi } from "../../src/api/financialSetup.api";
import { FinancialSetup } from "../../src/types/financialSetup";
import FinancialSetupModal from "../../src/components/financialSetup/FinancialSetupModal";
import { t } from "../../src/i18n";
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../src/utils/dataRefreshEmitter";
import { useLanguage } from "../../src/i18n/LanguageProvider";

const getAlertLabel = (alertLevel: string) => {
    switch (alertLevel) {
        case "EXCEEDED":
            return t("budget.alert_exceeded");
        case "WARNING":
            return t("budget.alert_warning");
        case "CAUTION":
            return t("budget.alert_caution");
        default:
            return t("budget.alert_normal");
    }
};

// Category icon mapping
const categoryIconMap: { [key: string]: { icon: string; color: string; displayName: string } } = {
    FOOD: { icon: "restaurant", color: "#FF9800", displayName: "budget.category_food" },
    TRANSPORTATION: { icon: "car", color: "#2196F3", displayName: "budget.category_transportation" },
    CLOTHING: { icon: "shirt", color: "#E91E63", displayName: "budget.category_clothing" },
    UTILITIES: { icon: "flash", color: "#FFC107", displayName: "budget.category_utilities" },
    ENTERTAINMENT: { icon: "film", color: "#9C27B0", displayName: "budget.category_entertainment" },
    HEALTH: { icon: "heart", color: "#F44336", displayName: "budget.category_health" },
    EDUCATION: { icon: "book", color: "#3629B7", displayName: "budget.category_education" },
    SHOPPING: { icon: "bag", color: "#4CAF50", displayName: "budget.category_shopping" },
    OTHER: { icon: "more", color: "#757575", displayName: "budget.category_other" },
};

export default function BudgetListPage() {
    const { lang, setLang } = useLanguage();
    const router = useRouter();
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [financialSetup, setFinancialSetup] = useState<FinancialSetup | null>(null);
    const [setupLoading, setSetupLoading] = useState(true);
    const [showEditSetup, setShowEditSetup] = useState(false);

    // States for Quick Action Modals
    const [cameraVisible, setCameraVisible] = useState(false);
    const [voiceVisible, setVoiceVisible] = useState(false);
    const [manualVisible, setManualVisible] = useState(false);

    const { createFromReceipt, createFromVoice } = useCreateTransaction();

    useEffect(() => {
        loadBudgets();
        loadFinancialSetup();

        // AI chat can execute a real budget mutation on the user's behalf (confirm-then-execute via
        // plain "yes"/"no") — there's no shared context/query cache for this data, so re-fetch here
        // when that happens instead of showing stale numbers until the next manual reload.
        const refreshListener = () => loadBudgets();
        dataRefreshEmitter.on(FINANCIAL_DATA_UPDATED, refreshListener);
        return () => {
            dataRefreshEmitter.off(FINANCIAL_DATA_UPDATED, refreshListener);
        };
    }, []);

    const loadFinancialSetup = async () => {
        try {
            setSetupLoading(true);
            const res = await FinancialSetupApi.getFinancialSetup();
            if (res.success && res.data) {
                setFinancialSetup(res.data as FinancialSetup);
            } else {
                setFinancialSetup(null);
            }
        } catch {
            setFinancialSetup(null);
        } finally {
            setSetupLoading(false);
        }
    };

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const result = await budgetAPI.getBudgets(month, year);
            if (result.success && result.data) {
                setBudgets(result.data.items || []);
            }
        } catch (error) {
            console.error("Failed to load budgets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadBudgets(), loadFinancialSetup()]);
        setRefreshing(false);
    };

    const handleCreateReceiptTransaction = async (receipt: Receipt) => {
        const success = await createFromReceipt(receipt);
        if (success) setCameraVisible(false);
    };

    const handleCreateVoiceTransaction = async (transaction: any) => {
        const success = await createFromVoice(transaction);
        if (success) setVoiceVisible(false);
    };

    const getAlertLevelStyle = (alertLevel: string) => {
        switch (alertLevel) {
            case 'EXCEEDED':
                return { color: '#F44336', bgColor: '#FFEBEE' };
            case 'WARNING':
                return { color: '#FF9800', bgColor: '#FFF3E0' };
            case 'CAUTION':
                return { color: '#FFC107', bgColor: '#FFFDE7' };
            default:
                return { color: '#4CAF50', bgColor: '#E8F5E9' };
        }
    };

    const renderBudgetCard = (item: BudgetItem) => {
        const categoryInfo = categoryIconMap[item.category] || categoryIconMap.OTHER;
        const progressPercent = Math.min(item.progressPercent, 100);
        const alertStyle = getAlertLevelStyle(item.alertLevel);
        const progressColor =
            item.alertLevel === 'EXCEEDED' ? '#F44336' :
                item.alertLevel === 'WARNING' ? '#FF9800' :
                    item.alertLevel === 'CAUTION' ? '#FFC107' :
                        '#4CAF50';

        return (
            <View key={item.budgetId} style={styles.budgetCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.categoryInfo}>
                        <CircularProgress
                            percentage={progressPercent}
                            size={80}
                            strokeWidth={5}
                            color={progressColor}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
                                <Ionicons name={categoryInfo.icon as any} size={32} color={categoryInfo.color} />
                            </View>
                        </CircularProgress>
                        <View style={styles.categoryDetails}>
                            <Text style={styles.categoryName}>{t(categoryInfo.displayName)}</Text>
                            <Text style={[styles.alertBadge, { backgroundColor: alertStyle.bgColor, color: alertStyle.color }]}>
                                {getAlertLabel(item.alertLevel)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.amountInfo}>
                        <Text style={styles.remainingAmount}>{formatVND(item.remaining)}</Text>
                        <Text style={styles.remainingLabel}>{t("budget.remaining")}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t("budget.spent")}</Text>
                            <Text style={styles.statValue}>{formatVND(item.spent)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t("budget.limit")}</Text>
                            <Text style={styles.statValue}>{formatVND(item.amountLimit)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>{t("budget.remaining")}</Text>
                            <Text style={[styles.statValue, { color: item.remaining >= 0 ? '#4CAF50' : '#F44336' }]}>
                                {formatVND(item.remaining)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderFinancialSetupSection = () => {
        if (setupLoading) {
            return (
                <View style={styles.profileCard}>
                    <ActivityIndicator size="small" color="#4B3FD6" />
                </View>
            );
        }

        if (!financialSetup || !financialSetup.financialSetupCompleted) {
            return (
                <View style={styles.profileCard}>
                    <View style={styles.profileCardHeader}>
                        <View style={styles.profileCardTitleRow}>
                            <Ionicons name="wallet-outline" size={22} color="#4B3FD6" />
                            <Text style={styles.profileCardTitle}>
                                {t("financialSetup.card_title")}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.profileEmptyText}>
                        {t("financialSetup.empty_desc")}
                    </Text>
                    <TouchableOpacity
                        style={styles.profileSetupBtn}
                        onPress={() => setShowEditSetup(true)}
                    >
                        <Ionicons name="wallet-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.profileSetupBtnText}>
                            {t("financialSetup.setup_now")}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const setupRows = [
            {
                label: t("financialSetup.row_income"),
                value: formatVND(financialSetup.income),
            },
            {
                label: t("financialSetup.row_pace"),
                value: t(`financialSetup.savingPace.${financialSetup.savingPace}`),
            },
            {
                label: t("financialSetup.row_support"),
                value: t(
                    `financialSetup.interventionLevel.${financialSetup.interventionLevel}`
                ),
            },
            {
                label: t("financialSetup.row_focus"),
                value: t(`financialSetup.focusMode.${financialSetup.focusMode}`),
            },
        ];

        return (
            <View style={styles.profileCard}>
                <View style={styles.profileCardHeader}>
                    <View style={styles.profileCardTitleRow}>
                        <Ionicons name="wallet-outline" size={22} color="#4B3FD6" />
                        <Text style={styles.profileCardTitle}>
                            {t("financialSetup.card_title")}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => setShowEditSetup(true)}
                    >
                        <Ionicons name="pencil-outline" size={16} color="#4B3FD6" />
                        <Text style={styles.editBtnText}>{t("common.edit")}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileGrid}>
                    {setupRows.map((row) => (
                        <View key={row.label} style={styles.profileGridItem}>
                            <Text style={styles.profileGridLabel}>{row.label}</Text>
                            <Text style={styles.profileGridValue}>{row.value}</Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                {/* Sticky Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("budget.tab_title")}</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/budget-allocation')}
                        style={styles.generateButton}
                    >
                        <Ionicons name="sparkles" size={18} color="#3629B7" />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3629B7" />
                </View>
                <AppBottomBar
                    onCameraOpen={() => setCameraVisible(true)}
                    onVoiceOpen={() => setVoiceVisible(true)}
                    onFormOpen={() => setManualVisible(true)}
                />
            </SafeAreaView>
        );
    }

    return (
        <KeyboardScreen keyboardVerticalOffset={80}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                {/* Sticky Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("budget.tab_title")}</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/budget-allocation')}
                        style={styles.generateButton}
                    >
                        <Ionicons name="sparkles" size={18} color="#3629B7" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#3629B7']}
                            tintColor="#3629B7"
                        />
                    }
                >
                    <View style={styles.content}>
                        {renderFinancialSetupSection()}

                        {budgets.length > 0 ? (
                            <>
                                {budgets.map((budget) => renderBudgetCard(budget))}
                            </>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="wallet-outline" size={60} color="#CCC" />
                                <Text style={styles.emptyText}>{t("budget.no_budgets_yet")}</Text>
                                <Text style={styles.emptySubText}>{t("budget.use_ai_to_create_first_budget")}</Text>
                                <TouchableOpacity
                                    style={styles.emptyButton}
                                    onPress={() => router.push('/(tabs)/budget-allocation')}
                                >
                                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                                    <Text style={styles.emptyButtonText}>{t("budget.generate_budget")}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* App Bottom Bar */}
                <AppBottomBar
                    onCameraOpen={() => setCameraVisible(true)}
                    onVoiceOpen={() => setVoiceVisible(true)}
                    onFormOpen={() => setManualVisible(true)}
                />

                {/* Modals for App Bottom Bar Quick Actions */}
                <CameraModal
                    visible={cameraVisible}
                    onClose={() => setCameraVisible(false)}
                    onCaptureBill={handleCreateReceiptTransaction}
                />

                <VoiceInputModal
                    visible={voiceVisible}
                    onClose={() => setVoiceVisible(false)}
                    onCaptureVoice={handleCreateVoiceTransaction}
                />

                <AddTransactionModal
                    visible={manualVisible}
                    onClose={() => setManualVisible(false)}
                />

                <FinancialSetupModal
                    visible={showEditSetup}
                    onClose={() => {
                        setShowEditSetup(false);
                        loadFinancialSetup();
                    }}
                />
            </SafeAreaView>
        </KeyboardScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
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
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        paddingBottom: 100, // extra spacing so last item isn't covered by BottomBar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    budgetCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryDetails: {
        flex: 1,
        marginLeft: 12,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    alertBadge: {
        fontSize: 11,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    amountInfo: {
        alignItems: 'flex-end',
    },
    remainingAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    remainingLabel: {
        fontSize: 12,
        color: '#999',
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#F0F0F0',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#3629B7',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 20,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    generateButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFEAF8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    profileCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileCardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    profileCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111111',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EFEAF8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B3FD6',
    },
    profileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    profileGridItem: {
        backgroundColor: '#F5F3FF',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    profileGridLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 2,
    },
    profileGridValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B3FD6',
    },
    profileEmptyText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    profileSetupBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#4B3FD6',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 20,
    },
    profileSetupBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
});
