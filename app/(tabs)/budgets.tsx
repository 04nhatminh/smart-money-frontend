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
import { budgetAPI, BudgetItem } from "../../src/api/budget.api";
import { CircularProgress } from "../../src/components/CircularProgress";
import { formatVND } from "../../src/utils/formatCurrency";
import AppBottomBar from "../../src/components/AppBottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";
import { Receipt } from "../../src/types/transaction.types";
import { BudgetAllocationApi } from "../../src/api/budgetAllocation.api";
import { UserFinancialProfileData } from "../../src/types/budget_allocation.types";
import EditFinancialProfileModal from "../../src/components/projects/EditFinancialProfileModal";

const PROFILE_LABELS: Record<string, string> = {
    BUSINESS_OWNER: "Business Owner", FREELANCER: "Freelancer",
    OFFICE_WORKER: "Office Worker", STUDENT: "Student",
    DORM: "Dorm", OWN_HOUSE: "Own House", RENT_ROOM: "Rent Room", WITH_FAMILY: "With Family",
    HIGH: "High", LOW: "Low", MEDIUM: "Medium",
    BUS: "Bus", CAR: "Car", MOTORBIKE: "Motorbike", RIDE_HAILING: "Ride-hailing",
    BALANCED: "Balanced", FRUGAL: "Frugal", SPENDER: "Spender",
    HYBRID: "Hybrid", NONE: "None", ONSITE: "On-site", PART_TIME: "Part-time", REMOTE: "Remote",
    MARRIED: "Married", SINGLE: "Single",
    COURSE_HEAVY: "Course Heavy", NORMAL: "Normal",
};

const fmt = (v: string) => PROFILE_LABELS[v?.toUpperCase?.()] ?? v;

// Category icon mapping
const categoryIconMap: { [key: string]: { icon: string; color: string; displayName: string } } = {
    FOOD: { icon: 'restaurant', color: '#FF9800', displayName: 'Food' },
    TRANSPORTATION: { icon: 'car', color: '#2196F3', displayName: 'Transport' },
    CLOTHING: { icon: 'shirt', color: '#E91E63', displayName: 'Clothing' },
    UTILITIES: { icon: 'flash', color: '#FFC107', displayName: 'Utilities' },
    ENTERTAINMENT: { icon: 'film', color: '#9C27B0', displayName: 'Entertainment' },
    HEALTH: { icon: 'heart', color: '#F44336', displayName: 'Health' },
    EDUCATION: { icon: 'book', color: '#3629B7', displayName: 'Education' },
    SHOPPING: { icon: 'bag', color: '#4CAF50', displayName: 'Shopping' },
    OTHER: { icon: 'more', color: '#757575', displayName: 'Other' },
};

export default function BudgetListPage() {
    const router = useRouter();
    const [budgets, setBudgets] = useState<BudgetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [financialProfile, setFinancialProfile] = useState<UserFinancialProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showEditProfile, setShowEditProfile] = useState(false);

    // States for Quick Action Modals
    const [cameraVisible, setCameraVisible] = useState(false);
    const [voiceVisible, setVoiceVisible] = useState(false);
    const [manualVisible, setManualVisible] = useState(false);

    const { createFromReceipt, createFromVoice } = useCreateTransaction();

    useEffect(() => {
        loadBudgets();
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setProfileLoading(true);
            const res = await BudgetAllocationApi.getUserFinancialProfile();
            if (res.success && res.data) {
                setFinancialProfile(res.data);
            } else {
                setFinancialProfile(null);
            }
        } catch {
            setFinancialProfile(null);
        } finally {
            setProfileLoading(false);
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
        await Promise.all([loadBudgets(), loadProfile()]);
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
                            <Text style={styles.categoryName}>{categoryInfo.displayName}</Text>
                            <Text style={[styles.alertBadge, { backgroundColor: alertStyle.bgColor, color: alertStyle.color }]}>
                                {item.alertLevel}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.amountInfo}>
                        <Text style={styles.remainingAmount}>{formatVND(item.remaining)}</Text>
                        <Text style={styles.remainingLabel}>Còn lại</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Đã tiêu</Text>
                            <Text style={styles.statValue}>{formatVND(item.spent)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Giới hạn</Text>
                            <Text style={styles.statValue}>{formatVND(item.amountLimit)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Còn lại</Text>
                            <Text style={[styles.statValue, { color: item.remaining >= 0 ? '#4CAF50' : '#F44336' }]}>
                                {formatVND(item.remaining)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderFinancialProfileSection = () => {
        if (profileLoading) {
            return (
                <View style={styles.profileCard}>
                    <ActivityIndicator size="small" color="#4B3FD6" />
                </View>
            );
        }

        if (!financialProfile) {
            return (
                <View style={styles.profileCard}>
                    <View style={styles.profileCardHeader}>
                        <View style={styles.profileCardTitleRow}>
                            <Ionicons name="person-circle-outline" size={22} color="#4B3FD6" />
                            <Text style={styles.profileCardTitle}>Financial Profile</Text>
                        </View>
                    </View>
                    <Text style={styles.profileEmptyText}>No financial profile set up yet.</Text>
                    <TouchableOpacity
                        style={styles.profileSetupBtn}
                        onPress={() => router.push('/(tabs)/budget-allocation')}
                    >
                        <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                        <Text style={styles.profileSetupBtnText}>Set Up Profile</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const profileRows = [
            { label: "Role", value: fmt(financialProfile.role) },
            { label: "Living", value: fmt(financialProfile.living_status) },
            { label: "Income", value: fmt(financialProfile.income_level) },
            { label: "Transport", value: fmt(financialProfile.transport_mode) },
            { label: "Spending", value: fmt(financialProfile.spending_style) },
            { label: "Work Style", value: fmt(financialProfile.work_style) },
            { label: "Family", value: fmt(financialProfile.family_status) },
            { label: "Study", value: fmt(financialProfile.study_intensity) },
            { label: "Health", value: fmt(financialProfile.health_need) },
        ];

        return (
            <View style={styles.profileCard}>
                <View style={styles.profileCardHeader}>
                    <View style={styles.profileCardTitleRow}>
                        <Ionicons name="person-circle-outline" size={22} color="#4B3FD6" />
                        <Text style={styles.profileCardTitle}>Financial Profile</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => setShowEditProfile(true)}
                    >
                        <Ionicons name="pencil-outline" size={16} color="#4B3FD6" />
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileGrid}>
                    {profileRows.map((row) => (
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
                    <Text style={styles.headerTitle}>Budgets</Text>
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Sticky Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Budgets</Text>
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
                    {renderFinancialProfileSection()}

                    {budgets.length > 0 ? (
                        <>
                            {budgets.map((budget) => renderBudgetCard(budget))}
                        </>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="wallet-outline" size={60} color="#CCC" />
                            <Text style={styles.emptyText}>No budgets yet</Text>
                            <Text style={styles.emptySubText}>Use AI to create your first budget allocation</Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => router.push('/(tabs)/budget-allocation')}
                            >
                                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                                <Text style={styles.emptyButtonText}>Generate Budget</Text>
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

            <EditFinancialProfileModal
                visible={showEditProfile}
                profile={financialProfile}
                onClose={() => setShowEditProfile(false)}
                onSaved={(updated) => {
                    setFinancialProfile(updated);
                    setShowEditProfile(false);
                }}
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
        </SafeAreaView>
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