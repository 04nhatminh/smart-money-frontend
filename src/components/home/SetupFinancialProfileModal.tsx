import React, { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
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
  toUpperCasePayload,
  GenerateBudgetAllocationPayload,
} from "../../types/budget_allocation.types";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: GenerateBudgetAllocationPayload) => void;
};

const getOptionLabel = (value: string) => {
  switch (value) {
    case "business_owner":
      return t("budget.role_business_owner");
    case "freelancer":
      return t("budget.role_freelancer");
    case "office_worker":
      return t("budget.role_office_worker");
    case "student":
      return t("budget.role_student");
    case "dorm":
      return t("budget.living_dorm");
    case "own_house":
      return t("budget.living_own_house");
    case "rent_room":
      return t("budget.living_rent_room");
    case "with_family":
      return t("budget.living_with_family");
    case "high":
      return t("budget.level_high");
    case "low":
      return t("budget.level_low");
    case "medium":
      return t("budget.level_medium");
    case "bus":
      return t("budget.transport_bus");
    case "car":
      return t("budget.transport_car");
    case "motorbike":
      return t("budget.transport_motorbike");
    case "ride_hailing":
      return t("budget.transport_ride_hailing");
    case "balanced":
      return t("budget.spending_balanced");
    case "frugal":
      return t("budget.spending_frugal");
    case "spender":
      return t("budget.spending_spender");
    case "hybrid":
      return t("budget.work_hybrid");
    case "none":
      return t("budget.work_none");
    case "onsite":
      return t("budget.work_onsite");
    case "part_time":
      return t("budget.work_part_time");
    case "remote":
      return t("budget.work_remote");
    case "married":
      return t("budget.family_married");
    case "single":
      return t("budget.family_single");
    case "course_heavy":
      return t("budget.study_course_heavy");
    case "normal":
      return t("budget.study_normal");
    default:
      return value;
  }
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
            {getOptionLabel(opt)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
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

export default function SetupFinancialProfileModal({
  visible,
  onClose,
  onSubmit,
}: Props) {
  const [values, setValues] =
    useState<FinancialProfileFormValues>(DEFAULT_VALUES);
  const [step, setStep] = useState<"form" | "success">("form");
  const [pendingPayload, setPendingPayload] =
    useState<GenerateBudgetAllocationPayload | null>(null);

  useEffect(() => {
    if (!visible) setStep("form");
  }, [visible]);

  const set =
    <K extends keyof FinancialProfileFormValues>(key: K) =>
    (val: FinancialProfileFormValues[K]) =>
      setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    const payload = toUpperCasePayload(values);
    setPendingPayload(payload);
    setStep("success");
  };

  const handleContinue = () => {
    if (pendingPayload) onSubmit(pendingPayload);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === "success" ? (
            <View style={styles.successContent}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-circle" size={64} color="#4B3FD6" />
              </View>
              <Text style={styles.successTitle}>
                {t("budget.profile_ready_title")}
              </Text>
              <Text style={styles.successSubtitle}>
                {t("budget.profile_ready_subtitle")}
              </Text>
              <View style={styles.buttonRow}>
                <ButtonSave
                  label={t("budget.cancel_button")}
                  variant="secondary"
                  onPress={onClose}
                />
                <ButtonSave
                  label={t("budget.continue_button")}
                  onPress={handleContinue}
                />
              </View>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.dragHandle} />

              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.title}>
                    {t("budget.financial_profile_title")}
                  </Text>
                  <Text style={styles.subtitle}>
                    {t("budget.financial_profile_help")}
                  </Text>
                </View>
                <Pressable style={styles.closeBtn} onPress={onClose}>
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>

              <Text style={styles.label}>{t("budget.role")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_ROLES}
                value={values.role}
                onChange={set("role")}
              />

              <Text style={styles.label}>{t("budget.living")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_LIVING_STATUSES}
                value={values.living_status}
                onChange={set("living_status")}
              />

              <Text style={styles.label}>{t("budget.income")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_INCOME_LEVELS}
                value={values.income_level}
                onChange={set("income_level")}
              />

              <Text style={styles.label}>{t("budget.transport")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_TRANSPORT_MODES}
                value={values.transport_mode}
                onChange={set("transport_mode")}
              />

              <Text style={styles.label}>{t("budget.spending_style")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_SPENDING_STYLES}
                value={values.spending_style}
                onChange={set("spending_style")}
              />

              <Text style={styles.label}>{t("budget.work_style")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_WORK_STYLES}
                value={values.work_style}
                onChange={set("work_style")}
              />

              <Text style={styles.label}>{t("budget.family")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_FAMILY_STATUSES}
                value={values.family_status}
                onChange={set("family_status")}
              />

              <Text style={styles.label}>{t("budget.study")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_STUDY_INTENSITIES}
                value={values.study_intensity}
                onChange={set("study_intensity")}
              />

              <Text style={styles.label}>{t("budget.health_need")}</Text>
              <OptionGroup
                options={FINANCIAL_PROFILE_HEALTH_NEEDS}
                value={values.health_need}
                onChange={set("health_need")}
              />

              <View style={styles.buttonRow}>
                <ButtonSave
                  label={t("budget.cancel_button")}
                  variant="secondary"
                  onPress={onClose}
                />
                <ButtonSave
                  label={t("budget.continue_button")}
                  onPress={handleSubmit}
                />
              </View>
            </ScrollView>
          )}
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

  successContent: {
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
  },

  successIconBox: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#EFEAF8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
    textAlign: "center",
  },

  successSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 32,
  },
});
