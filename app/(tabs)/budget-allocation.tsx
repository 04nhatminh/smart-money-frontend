import React, { useEffect, useState } from "react";
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
import SetupFinancialProfileModal from "../../src/components/projects/SetupFinancialProfileModal";
import CreateBudgetAllocationModal from "../../src/components/projects/CreateBudgetAllocationModal";
import EditFinancialProfileModal from "../../src/components/projects/EditFinancialProfileModal";
import { BudgetAllocationApi } from "../../src/api/budgetAllocation.api";
import {
    GenerateBudgetAllocationPayload,
    UserFinancialProfileData,
} from "../../src/types/budget_allocation.types";

const PROFILE_LABELS: Record<string, string> = {
    BUSINESS_OWNER: "Business Owner",
    FREELANCER: "Freelancer",
    OFFICE_WORKER: "Office Worker",
    STUDENT: "Student",
    DORM: "Dorm",
    OWN_HOUSE: "Own House",
    RENT_ROOM: "Rent Room",
    WITH_FAMILY: "With Family",
    HIGH: "High",
    LOW: "Low",
    MEDIUM: "Medium",
    BUS: "Bus",
    CAR: "Car",
    MOTORBIKE: "Motorbike",
    RIDE_HAILING: "Ride-hailing",
    BALANCED: "Balanced",
    FRUGAL: "Frugal",
    SPENDER: "Spender",
    HYBRID: "Hybrid",
    NONE: "None",
    ONSITE: "On-site",
    PART_TIME: "Part-time",
    REMOTE: "Remote",
    MARRIED: "Married",
    SINGLE: "Single",
    COURSE_HEAVY: "Course Heavy",
    NORMAL: "Normal",
};

const fmt = (v: string) => PROFILE_LABELS[v?.toUpperCase?.()] ?? v;

export default function BudgetAllocationPage() {
    const router = useRouter();

    const [profile, setProfile] = useState<UserFinancialProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [showSetupProfile, setShowSetupProfile] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [budgetPayload, setBudgetPayload] = useState<GenerateBudgetAllocationPayload | null>(null);

    const [budgetLoading, setBudgetLoading] = useState(false);
    const [budgetJobCreated, setBudgetJobCreated] = useState(false);
    const [budgetError, setBudgetError] = useState<string | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setProfileLoading(true);
        const res = await BudgetAllocationApi.getUserFinancialProfile();
        setProfile(res.success && res.data ? res.data : null);
        setProfileLoading(false);
    };

    const handleProfileSubmit = (payload: GenerateBudgetAllocationPayload) => {
        setShowSetupProfile(false);
        setBudgetPayload(payload);
        setShowCreateModal(true);
    };

    const handleProfileSaved = (savedProfile: UserFinancialProfileData) => {
        setShowCreateModal(false);
        setProfile(savedProfile);
    };

    const handleProfileUpdated = (updatedProfile: UserFinancialProfileData) => {
        setShowEditProfile(false);
        setProfile(updatedProfile);
    };

    const handleGenerateBudget = async () => {
        setBudgetError(null);
        try {
            setBudgetLoading(true);
            const res = await BudgetAllocationApi.generateBudget();
            if (res.success) {
                setBudgetJobCreated(true);
            } else {
                setBudgetError(res.message ?? "Failed to generate budget");
            }
        } finally {
            setBudgetLoading(false);
        }
    };

    const profileRows = profile
        ? [
              { icon: "briefcase-outline", title: "Role", value: fmt(profile.role) },
              { icon: "home-outline", title: "Living", value: fmt(profile.living_status) },
              { icon: "cash-outline", title: "Income", value: fmt(profile.income_level) },
              { icon: "car-outline", title: "Transport", value: fmt(profile.transport_mode) },
              { icon: "wallet-outline", title: "Spending Style", value: fmt(profile.spending_style) },
              { icon: "laptop-outline", title: "Work Style", value: fmt(profile.work_style) },
              { icon: "people-outline", title: "Family", value: fmt(profile.family_status) },
              { icon: "school-outline", title: "Study", value: fmt(profile.study_intensity) },
              { icon: "fitness-outline", title: "Health Need", value: fmt(profile.health_need) },
          ]
        : [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Budget Allocation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Section 1: Financial Profile ── */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-circle-outline" size={20} color="#4B3FD6" />
                        <Text style={styles.sectionTitle}>Financial Profile</Text>
                    </View>

                    {profileLoading ? (
                        <ActivityIndicator
                            size="small"
                            color="#4B3FD6"
                            style={{ marginVertical: 16 }}
                        />
                    ) : profile ? (
                        <>
                            <View style={styles.profileRows}>
                                {profileRows.map((row) => (
                                    <View key={row.title} style={styles.profileRow}>
                                        <View style={styles.rowLeft}>
                                            <Ionicons
                                                name={row.icon as any}
                                                size={14}
                                                color="#4B3FD6"
                                            />
                                            <Text style={styles.rowLabel}>{row.title}</Text>
                                        </View>
                                        <Text style={styles.rowValue}>{row.value}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.updateBtn}
                                onPress={() => setShowEditProfile(true)}
                            >
                                <Ionicons name="create-outline" size={16} color="#4B3FD6" />
                                <Text style={styles.updateBtnText}>Update Profile</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>
                                You don't have any user profile yet. Create a new one?
                            </Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => setShowSetupProfile(true)}
                            >
                                <Ionicons name="add" size={16} color="#FFFFFF" />
                                <Text style={styles.createBtnText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── Section 2: Budget with AI (only when profile exists) ── */}
                {profile && (
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="sparkles" size={20} color="#4B3FD6" />
                            <Text style={styles.sectionTitle}>Budget Allocation</Text>
                        </View>
                        <Text style={styles.budgetDesc}>
                            Generate a personalised budget allocation based on your financial profile using AI.
                        </Text>
                        {budgetError && (
                            <View style={styles.errorCard}>
                                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                                <Text style={styles.errorText}>{budgetError}</Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.aiBtn, budgetLoading && styles.aiBtnDisabled]}
                            onPress={handleGenerateBudget}
                            disabled={budgetLoading}
                        >
                            {budgetLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                            )}
                            <Text style={styles.aiBtnText}>
                                {budgetLoading ? "Generating..." : "Budget with AI"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* ── Modals ── */}
            <SetupFinancialProfileModal
                visible={showSetupProfile}
                onClose={() => setShowSetupProfile(false)}
                onSubmit={handleProfileSubmit}
            />

            <CreateBudgetAllocationModal
                visible={showCreateModal}
                payload={budgetPayload}
                onClose={() => setShowCreateModal(false)}
                onSaved={handleProfileSaved}
            />

            <EditFinancialProfileModal
                visible={showEditProfile}
                profile={profile}
                onClose={() => setShowEditProfile(false)}
                onSaved={handleProfileUpdated}
            />

            {/* ── Budget job created popup ── */}
            <Modal visible={budgetJobCreated} transparent animationType="fade">
                <View style={styles.popupOverlay}>
                    <View style={styles.popupCard}>
                        <View style={styles.popupIconWrap}>
                            <View style={styles.popupIconCircle}>
                                <Ionicons name="checkmark-circle" size={52} color="#059669" />
                            </View>
                        </View>
                        <Text style={styles.popupTitle}>Budget Allocation Job Created!</Text>
                        <Text style={styles.popupSubtitle}>
                            Your budget is being processed by AI. Check the Budgets tab shortly.
                        </Text>
                        <Pressable
                            style={styles.popupBtn}
                            onPress={() => router.push("/(tabs)/home")}
                        >
                            <Text style={styles.popupBtnText}>Exit</Text>
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
    profileRows: {
        gap: 10,
    },
    profileRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    rowLabel: {
        fontSize: 13,
        color: "#374151",
        fontWeight: "500",
    },
    rowValue: {
        fontSize: 13,
        color: "#4B3FD6",
        fontWeight: "600",
    },
    updateBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: "#EFEAF8",
        alignSelf: "flex-start",
    },
    updateBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#4B3FD6",
    },
    emptyState: {
        gap: 14,
    },
    emptyText: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
    },
    createBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 25,
        backgroundColor: "#4B3FD6",
        alignSelf: "flex-start",
    },
    createBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    budgetDesc: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
        marginBottom: 16,
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
