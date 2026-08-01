import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

import { budgetAPI, BulkBudgetsResponse } from "../../src/api/budget.api";
import { BudgetAllocationPlanResponse } from "../../src/types/budget_allocation.types";
import { useAuth } from "../../src/context/AuthContext";
import { t } from "../../src/i18n";
import BudgetPlanReview, {
  ApplyItem,
} from "../../src/components/projects/BudgetPlanReview";
import BudgetPlanResult from "../../src/components/projects/BudgetPlanResult";
import FinancialSetupModal from "../../src/components/financialSetup/FinancialSetupModal";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { Theme, ThemeMode } from "../../src/theme/tokens";

const FINANCIAL_SETUP_REQUIRED = "FINANCIAL_SETUP_REQUIRED";

export default function BudgetAllocationPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;

  const styles = useMemo(() => createStyles(theme, mode, accent, surface), [theme, mode, accent, surface]);

  const [computing, setComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);
  const [plan, setPlan] = useState<BudgetAllocationPlanResponse | null>(null);

  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applied, setApplied] = useState<BulkBudgetsResponse | null>(null);

  const [setupRequired, setSetupRequired] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleCompute = async () => {
    setComputeError(null);
    setApplyError(null);
    setApplied(null);
    setSetupRequired(false);
    setComputing(true);

    try {
      const res = await budgetAPI.computeAllocation();

      if (res.success && res.data) {
        setPlan(res.data);
        return;
      }

      // Financial setup incomplete → route the user to finish onboarding.
      if (res.errorCode === FINANCIAL_SETUP_REQUIRED) {
        setPlan(null);
        setSetupRequired(true);
        setComputeError(
          t(
            "budget.financial_profile_required_to_generate_personalized_budget_allocation_suggestions"
          )
        );
        return;
      }

      setComputeError(res.message ?? t("budget.failed_generate_budget_allocation"));
    } catch (error: any) {
      setComputeError(
        error?.message ?? t("budget.failed_generate_budget_allocation")
      );
    } finally {
      setComputing(false);
    }
  };

  const handleApply = async (items: ApplyItem[]) => {
    if (!plan) return;

    setApplyError(null);
    setApplying(true);

    try {
      const response = await budgetAPI.saveBulk({
        month: plan.month,
        year: plan.year,
        budgets: items,
      });

      if (response.success && response.data) {
        setApplied(response.data);
      } else {
        setApplyError(
          response.message ?? t("budget.failed_save_budget_allocation")
        );
      }
    } catch (error: any) {
      setApplyError(
        error?.message ?? t("budget.failed_save_budget_allocation")
      );
    } finally {
      setApplying(false);
    }
  };

  const handleSetupSuccess = async () => {
    setShowSetup(false);
    setSetupRequired(false);
    setComputeError(null);
    await refreshUser();
    // Re-run the computation now that the profile is complete.
    handleCompute();
  };

  const showComputeButton = !applied;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={surface}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("budget.title")}</Text>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color={accent} />
              <Text style={styles.sectionTitle}>{t("budget.title")}</Text>
            </View>

            <Text style={styles.budgetDesc}>
              {t("budget.auto_budget_intro")}
            </Text>

            {/* Financial-setup gate */}
            {setupRequired && (
              <View style={styles.warningCard}>
                <Ionicons name="alert-circle" size={16} color="#D97706" />
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={styles.warningText}>
                    {t("budget.setup_required_desc")}
                  </Text>
                  <TouchableOpacity
                    style={styles.setupBtn}
                    onPress={() => setShowSetup(true)}
                  >
                    <Text style={styles.setupBtnText}>
                      {t("budget.complete_setup")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {computeError && !setupRequired && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{computeError}</Text>
              </View>
            )}

            {showComputeButton && (
              <TouchableOpacity
                style={[
                  styles.aiBtn,
                  (computing || applying) && styles.aiBtnDisabled,
                ]}
                onPress={handleCompute}
                disabled={computing || applying}
              >
                {computing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                )}
                <Text style={styles.aiBtnText}>
                  {computing
                    ? t("budget.generating")
                    : plan
                    ? t("budget.recompute")
                    : t("budget.create_budget_allocation")}
                </Text>
              </TouchableOpacity>
            )}

            {/* Editable preview */}
            {plan && !applied && (
              <BudgetPlanReview
                plan={plan}
                applying={applying}
                onApply={handleApply}
              />
            )}

            {applyError && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{applyError}</Text>
              </View>
            )}

            {/* Applied result */}
            {applied && (
              <>
                <BudgetPlanResult result={applied} />
                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => router.push("/(tabs)/budgets")}
                >
                  <Text style={styles.doneBtnText}>
                    {t("budget.view_budgets")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FinancialSetupModal
        visible={showSetup}
        mode="onboarding"
        onClose={() => setShowSetup(false)}
        onSuccess={handleSetupSuccess}
      />
    </SafeAreaView>
  );
}

// Style factory theo theme: nhận theme/mode/accent/surface để mọi màu nền/chữ đi theo token.
const createStyles = (
  theme: Theme,
  mode: ThemeMode,
  accent: string,
  surface: string
) =>
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
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.inputBg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.text,
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
    backgroundColor: surface,
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
    color: theme.text,
  },
  budgetDesc: {
    fontSize: 14,
    color: theme.subtext,
    lineHeight: 20,
    marginBottom: 16,
  },
  // Giữ nguyên màu cảnh báo (amber) — màu ngữ nghĩa, không theo theme.
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    lineHeight: 18,
  },
  setupBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#D97706",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  setupBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Giữ nguyên màu lỗi (đỏ) — màu ngữ nghĩa, không theo theme.
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 4,
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
    // Nút tô đặc màu primary, giữ chữ trắng.
    backgroundColor: theme.primary,
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
  doneBtn: {
    height: 48,
    borderRadius: 14,
    // Nút tô đặc màu primary, giữ chữ trắng.
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
