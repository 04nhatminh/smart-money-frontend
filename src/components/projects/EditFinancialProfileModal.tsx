import React, { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ButtonSave } from "../ButtonSave";
import {
  FINANCIAL_PROFILE_ROLES,
  FINANCIAL_PROFILE_LIVING_STATUSES,
  FINANCIAL_PROFILE_INCOME_LEVELS,
  FINANCIAL_PROFILE_TRANSPORT_MODES,
  FINANCIAL_PROFILE_SPENDING_STYLES,
  FINANCIAL_PROFILE_WORK_STYLES,
  FINANCIAL_PROFILE_FAMILY_STATUSES,
  FINANCIAL_PROFILE_STUDY_INTENSITIES,
  FINANCIAL_PROFILE_HEALTH_NEEDS,
  FinancialProfileFormValues,
  UserFinancialProfileData,
  toUpperCasePayload,
} from "../../types/budget_allocation.types";
import { BudgetAllocationApi } from "../../api/budgetAllocation.api";

const LABELS: Record<string, string> = {
  business_owner: "Business Owner",
  freelancer: "Freelancer",
  office_worker: "Office Worker",
  student: "Student",
  dorm: "Dorm",
  own_house: "Own House",
  rent_room: "Rent Room",
  with_family: "With Family",
  high: "High",
  low: "Low",
  medium: "Medium",
  bus: "Bus",
  car: "Car",
  motorbike: "Motorbike",
  ride_hailing: "Ride-hailing",
  balanced: "Balanced",
  frugal: "Frugal",
  spender: "Spender",
  hybrid: "Hybrid",
  none: "None",
  onsite: "On-site",
  part_time: "Part-time",
  remote: "Remote",
  married: "Married",
  single: "Single",
  course_heavy: "Course Heavy",
  normal: "Normal",
};

function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[styles.optionBtn, value === opt && styles.optionBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text
            style={[
              styles.optionText,
              value === opt && styles.optionTextActive,
            ]}
          >
            {LABELS[opt] ?? opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function profileToFormValues(p: UserFinancialProfileData): FinancialProfileFormValues {
  return {
    role: p.role.toLowerCase() as FinancialProfileFormValues["role"],
    living_status: p.living_status.toLowerCase() as FinancialProfileFormValues["living_status"],
    income_level: p.income_level.toLowerCase() as FinancialProfileFormValues["income_level"],
    transport_mode: p.transport_mode.toLowerCase() as FinancialProfileFormValues["transport_mode"],
    spending_style: p.spending_style.toLowerCase() as FinancialProfileFormValues["spending_style"],
    work_style: p.work_style.toLowerCase() as FinancialProfileFormValues["work_style"],
    family_status: p.family_status.toLowerCase() as FinancialProfileFormValues["family_status"],
    study_intensity: p.study_intensity.toLowerCase() as FinancialProfileFormValues["study_intensity"],
    health_need: p.health_need.toLowerCase() as FinancialProfileFormValues["health_need"],
  };
}

const DEFAULT_VALUES: FinancialProfileFormValues = {
  role: "office_worker",
  living_status: "rent_room",
  income_level: "medium",
  transport_mode: "motorbike",
  spending_style: "balanced",
  work_style: "onsite",
  family_status: "single",
  study_intensity: "normal",
  health_need: "normal",
};

type Props = {
  visible: boolean;
  profile: UserFinancialProfileData | null;
  onClose: () => void;
  onSaved: (profile: UserFinancialProfileData) => void;
};

export default function EditFinancialProfileModal({
  visible,
  profile,
  onClose,
  onSaved,
}: Props) {
  const [values, setValues] = useState<FinancialProfileFormValues>(DEFAULT_VALUES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setValues(profileToFormValues(profile));
    }
  }, [profile]);

  const set =
    <K extends keyof FinancialProfileFormValues>(key: K) =>
    (val: FinancialProfileFormValues[K]) =>
      setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = toUpperCasePayload(values);
      const res = await BudgetAllocationApi.updateUserFinancialProfile(payload);
      if (!res.success || !res.data) {
        Alert.alert("Error", res.message || "Failed to update profile");
        return;
      }
      onSaved(res.data);
    } catch {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.dragHandle} />

            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Edit Financial Profile</Text>
                <Text style={styles.subtitle}>
                  Update your profile to improve AI budget suggestions.
                </Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.label}>Your role</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_ROLES}
              value={values.role}
              onChange={set("role")}
            />

            <Text style={styles.label}>Living situation</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_LIVING_STATUSES}
              value={values.living_status}
              onChange={set("living_status")}
            />

            <Text style={styles.label}>Income level</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_INCOME_LEVELS}
              value={values.income_level}
              onChange={set("income_level")}
            />

            <Text style={styles.label}>Main transport</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_TRANSPORT_MODES}
              value={values.transport_mode}
              onChange={set("transport_mode")}
            />

            <Text style={styles.label}>Spending style</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_SPENDING_STYLES}
              value={values.spending_style}
              onChange={set("spending_style")}
            />

            <Text style={styles.label}>Work style</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_WORK_STYLES}
              value={values.work_style}
              onChange={set("work_style")}
            />

            <Text style={styles.label}>Family status</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_FAMILY_STATUSES}
              value={values.family_status}
              onChange={set("family_status")}
            />

            <Text style={styles.label}>Study intensity</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_STUDY_INTENSITIES}
              value={values.study_intensity}
              onChange={set("study_intensity")}
            />

            <Text style={styles.label}>Health need</Text>
            <OptionGroup
              options={FINANCIAL_PROFILE_HEALTH_NEEDS}
              value={values.health_need}
              onChange={set("health_need")}
            />

            <View style={styles.buttonRow}>
              <ButtonSave label="Cancel" variant="secondary" onPress={onClose} disabled={saving} />
              {saving ? (
                <View style={styles.savingBtn}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.savingText}>Saving...</Text>
                </View>
              ) : (
                <ButtonSave label="Save Changes" onPress={handleSubmit} />
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  dragHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginTop: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  optionBtnActive: {
    backgroundColor: "#EFEAF8",
    borderColor: "#4B3FD6",
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  optionTextActive: {
    color: "#4B3FD6",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  savingBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4B3FD6",
    borderRadius: 12,
    paddingVertical: 14,
  },
  savingText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
