import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ButtonSave } from "../ButtonSave";
import { UserFinancialProfileData } from "../../types/budget_allocation.types";
import { BudgetAllocationApi } from "../../api/budgetAllocation.api";

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

type ProfileRow = { icon: string; title: string; value: string };

function buildRows(p: UserFinancialProfileData): ProfileRow[] {
  return [
    { icon: "briefcase-outline", title: "Role", value: fmt(p.role) },
    { icon: "home-outline", title: "Living", value: fmt(p.living_status) },
    { icon: "cash-outline", title: "Income", value: fmt(p.income_level) },
    { icon: "car-outline", title: "Transport", value: fmt(p.transport_mode) },
    { icon: "wallet-outline", title: "Spending Style", value: fmt(p.spending_style) },
    { icon: "laptop-outline", title: "Work Style", value: fmt(p.work_style) },
    { icon: "people-outline", title: "Family", value: fmt(p.family_status) },
    { icon: "school-outline", title: "Study", value: fmt(p.study_intensity) },
    { icon: "fitness-outline", title: "Health Need", value: fmt(p.health_need) },
  ];
}

type Props = {
  profile: UserFinancialProfileData;
  loading: boolean;
};

export default function FinancialProfileDisplayStep({
  profile,
  loading,
}: Props) {
  const router = useRouter();
  const [aiLoading, setAiLoading] = useState(false);
  const [jobCreated, setJobCreated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const rows = buildRows(profile);

  const handleBudgetWithAI = async () => {
    setErrorMessage(null);
    try {
      setAiLoading(true);
      const res = await BudgetAllocationApi.generateBudget();
      if (res.success) {
        setJobCreated(true);
      } else {
        setErrorMessage(res.message ?? "Failed to generate budget");
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="person-circle-outline" size={56} color="#4B3FD6" />
        </View>

        <Text style={styles.title}>Financial Profile Found</Text>
        <Text style={styles.subtitle}>
          Your project is created! Your existing financial profile will personalise your budget allocation.
        </Text>

        <View style={styles.profileCard}>
          {rows.map((row) => (
            <View key={row.title} style={styles.profileRow}>
              <View style={styles.rowLeft}>
                <Ionicons name={row.icon as any} size={15} color="#4B3FD6" />
                <Text style={styles.rowLabel}>{row.title}</Text>
              </View>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {errorMessage && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <ButtonSave
            label="Cancel"
            variant="secondary"
            onPress={() => router.push("/(tabs)/home")}
            disabled={aiLoading || loading}
          />
          <ButtonSave
            label="Budget with AI"
            onPress={handleBudgetWithAI}
            loading={aiLoading}
            loadingText="Loading..."
          />
        </View>
      </View>

      {/* ── Success popup ── */}
      <Modal visible={jobCreated} transparent animationType="fade">
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 12,
    alignItems: "center",
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFEAF8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  profileCard: {
    width: "100%",
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#991B1B",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
});
