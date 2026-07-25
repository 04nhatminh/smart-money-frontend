import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
import { router, useLocalSearchParams } from "expo-router";

import { budgetAPI, BudgetItem } from "../../../src/api/budget.api";
import { CircularProgress } from "../../../src/components/CircularProgress";
import EditBudgetModal from "../../../src/components/budget/EditBudgetModal";
import ConfirmExitModal from "../../../src/components/ConfirmExitModal";
import SuccessModal from "../../../src/components/SuccessModal";
import { formatVND } from "../../../src/utils/formatCurrency";
import { formatDateTime } from "../../../src/utils/dateFormatter";
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../../src/utils/dataRefreshEmitter";
import { t } from "../../../src/i18n";
import { useLanguage } from "../../../src/i18n/LanguageProvider";
import transactionApi from "../../../src/api/transaction.api";
import { TransactionResponse } from "../../../src/types/transaction.types";
import { TransactionItem } from "../../../src/components/transactions/TransactionItem";
import { useThemeMode } from "../../../src/theme/ThemeProvider";
import { Theme, ThemeMode } from "../../../src/theme/tokens";

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

const getAlertLevelStyle = (alertLevel: string) => {
    switch (alertLevel) {
        case "EXCEEDED":
            return { color: "#F44336", bgColor: "#FFEBEE" };
        case "WARNING":
            return { color: "#FF9800", bgColor: "#FFF3E0" };
        case "CAUTION":
            return { color: "#FFC107", bgColor: "#FFFDE7" };
        default:
            return { color: "#4CAF50", bgColor: "#E8F5E9" };
    }
};

export default function BudgetDetailScreen() {
    useLanguage(); // re-render on EN/VI switch
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, mode } = useThemeMode();
    // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
    const accent = mode === "dark" ? theme.link : theme.primary;
    // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
    const surface = mode === "green" ? "#FFFFFF" : theme.card;
    const styles = useMemo(
        () => createStyles(theme, mode, accent, surface),
        [theme, mode, accent, surface]
    );

    const [budget, setBudget] = useState<BudgetItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

    const fetchBudget = useCallback(async () => {
        if (!id) return;
        try {
            const res = await budgetAPI.getBudgetDetail(id);
            if (res.success && res.data) {
                setBudget(res.data);
            } else {
                Alert.alert(t("common.error"), res.message || t("budget.not_found"));
            }
        } catch (err) {
            console.error("Failed to load budget detail:", err);
            Alert.alert(t("common.error"), t("budget.not_found"));
        }
    }, [id]);

    useEffect(() => {
        fetchBudget().finally(() => setLoading(false));
    }, [fetchBudget]);

    useEffect(() => {
        if (!budget) return;

        const fetchTransactions = async () => {
            const startDate = formatDateTime(new Date(budget.year, budget.month - 1, 1, 0, 0));
            const endDate = formatDateTime(new Date(budget.year, budget.month, 0, 23, 59));

            try {
                setTransactionsLoading(true);
                const res = await transactionApi.getTransactions({
                    category: budget.category,
                    startDate,
                    endDate,
                    page: 0,
                    size: 100,
                });
                if (res.success && res.data) {
                    setTransactions(res.data.transactions || []);
                }
            } catch (err) {
                console.error("Failed to load budget transactions:", err);
            } finally {
                setTransactionsLoading(false);
            }
        };

        fetchTransactions();
    }, [budget?.category, budget?.month, budget?.year]);

    const handleDelete = () => {
        if (!budget) return;
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!budget) return;
        setShowDeleteConfirm(false);
        try {
            setDeleting(true);
            const res = await budgetAPI.deleteBudget(budget.budgetId);
            if (res.success) {
                dataRefreshEmitter.emit(FINANCIAL_DATA_UPDATED);
                setShowDeleteSuccess(true);
            } else {
                Alert.alert(t("common.error"), res.message || t("budget.delete_failed"));
            }
        } catch (err) {
            console.error("Failed to delete budget:", err);
            Alert.alert(t("common.error"), t("budget.delete_failed"));
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteSuccessDone = () => {
        setShowDeleteSuccess(false);
        router.back();
    };

    const handleBudgetUpdated = () => {
        setEditModalVisible(false);
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("budget.detail_title")}</Text>
                    <View style={styles.editButton} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>{t("budget.loading_detail")}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!budget) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("budget.detail_title")}</Text>
                    <View style={styles.editButton} />
                </View>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
                    <Text style={styles.notFoundText}>{t("budget.not_found")}</Text>
                    <Pressable style={styles.goBackButton} onPress={() => router.back()}>
                        <Text style={styles.goBackButtonText}>{t("budget.go_back")}</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const categoryInfo = categoryIconMap[budget.category] || categoryIconMap.OTHER;
    const progressPercent = Math.min(budget.progressPercent, 100);
    const alertStyle = getAlertLevelStyle(budget.alertLevel);
    const progressColor =
        budget.alertLevel === "EXCEEDED" ? "#F44336" :
            budget.alertLevel === "WARNING" ? "#FF9800" :
                budget.alertLevel === "CAUTION" ? "#FFC107" :
                    "#4CAF50";

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("budget.detail_title")}</Text>
                <TouchableOpacity
                    onPress={() => setEditModalVisible(true)}
                    style={styles.editButton}
                >
                    <Ionicons name="pencil-outline" size={18} color={accent} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <CircularProgress
                                percentage={progressPercent}
                                size={90}
                                strokeWidth={6}
                                color={progressColor}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
                                    <Ionicons name={categoryInfo.icon as any} size={36} color={categoryInfo.color} />
                                </View>
                            </CircularProgress>
                            <View style={styles.categoryDetails}>
                                <Text style={styles.categoryName}>{t(categoryInfo.displayName)}</Text>
                                <Text style={[styles.alertBadge, { backgroundColor: alertStyle.bgColor, color: alertStyle.color }]}>
                                    {getAlertLabel(budget.alertLevel)}
                                </Text>
                                <Text style={styles.monthText}>
                                    {t("budget.month_label")} {budget.month}/{budget.year}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>{t("budget.spent")}</Text>
                                <Text style={styles.statValue}>{formatVND(budget.spent)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>{t("budget.limit")}</Text>
                                <Text style={styles.statValue}>{formatVND(budget.amountLimit)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>{t("budget.remaining")}</Text>
                                <Text style={[styles.statValue, { color: budget.remaining >= 0 ? '#4CAF50' : '#F44336' }]}>
                                    {formatVND(budget.remaining)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>{t("budget.created_at")}</Text>
                            <Text style={styles.metaValue}>
                                {budget.createdAt ? budget.createdAt.split("T")[0] : "N/A"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>{t("budget.transactions_title")}</Text>

                        {transactionsLoading ? (
                            <ActivityIndicator size="small" color={theme.primary} style={styles.transactionsLoading} />
                        ) : transactions.length > 0 ? (
                            <View style={styles.transactionsList}>
                                {transactions.map((transaction) => (
                                    <TransactionItem key={transaction.id} transaction={transaction} />
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.noTransactionsText}>{t("budget.no_transactions")}</Text>
                        )}
                    </View>

                    <Pressable
                        style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                        onPress={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.deleteButtonText}>{t("budget.delete_budget")}</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </ScrollView>

            <EditBudgetModal
                visible={editModalVisible}
                budget={budget}
                onClose={() => setEditModalVisible(false)}
                onUpdated={handleBudgetUpdated}
            />

            <ConfirmExitModal
                visible={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title={t("budget.delete_budget")}
                description={t("budget.delete_confirm_desc")}
                cancelText={t("common.cancel")}
                confirmText={t("common.delete")}
                confirmVariant="danger"
            />

            <SuccessModal
                visible={showDeleteSuccess}
                onDone={handleDeleteSuccessDone}
                title={t("budget.delete_success")}
                description={t("budget.delete_success_desc")}
            />
        </SafeAreaView>
    );
}

const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string) =>
    StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.bg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backButton: {
        width: 40,
        height: 40,
        padding: 8,
        borderRadius: 20,
        backgroundColor: theme.inputBg,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: theme.text,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: accent + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        paddingBottom: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.subtext,
    },
    notFoundText: {
        marginTop: 12,
        fontSize: 18,
        fontWeight: '600',
        color: '#EF4444',
    },
    goBackButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.primary,
        borderRadius: 25,
    },
    goBackButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    card: {
        backgroundColor: surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    iconContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryDetails: {
        flex: 1,
        marginLeft: 14,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 6,
    },
    alertBadge: {
        fontSize: 11,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    monthText: {
        fontSize: 12,
        color: theme.subtext,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: theme.subtext,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: theme.border,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaLabel: {
        fontSize: 13,
        color: theme.subtext,
        fontWeight: '500',
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 4,
    },
    transactionsList: {
        marginHorizontal: -16,
    },
    transactionsLoading: {
        marginVertical: 20,
    },
    noTransactionsText: {
        fontSize: 13,
        color: theme.subtext,
        textAlign: 'center',
        paddingVertical: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        borderRadius: 16,
        paddingVertical: 16,
        shadowColor: '#DC2626',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    deleteButtonDisabled: {
        opacity: 0.6,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
