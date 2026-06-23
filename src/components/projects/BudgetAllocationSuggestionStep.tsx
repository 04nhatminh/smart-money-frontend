import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ButtonSave } from "../ButtonSave";
import { useAuth } from "../../context/AuthContext";
import { UserIncomeApi } from "../../api/userIncome.api";
import { UserFinancialProfileAPI } from "../../api/userFinancialProfile.api";
import { t } from "../../i18n";

type Props = {
  loading: boolean;
  onSkip: () => void;
  onCreate: () => void | Promise<void>;
};

export default function BudgetAllocationSuggestionStep({
  loading,
  onSkip,
  onCreate,
}: Props) {
  const { user } = useAuth();
  const [detailLoading, setDetailLoading] = useState(false);
  const isIncomeReady = !!user?.incomeSetupCompleted;
  const isFinancialReady = !!user?.financialSetupCompleted;
  const isLoading = loading || detailLoading;

  const description = !isIncomeReady
    ? t("budget.set_up_income_before_budget_allocation_suggestions")
    : !isFinancialReady
      ? t("budget.financial_profile_required_to_generate_personalized_budget_allocation_suggestions")
      : t("budget.your_project_is_ready_set_up_ai_powered_budget_allocation_based_on_your_financial_profile_to_stay_on_track");

  const handleCreate = async () => {
    if (!isIncomeReady || !isFinancialReady) return;

    try {
      setDetailLoading(true);

      const [incomeResponse, financialResponse] = await Promise.all([
        UserIncomeApi.getMe(),
        UserFinancialProfileAPI.getMe(),
      ]);

      if (!incomeResponse?.success || !financialResponse?.success) {
        return;
      }

      await onCreate();
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="pie-chart" size={56} color="#4B3FD6" />
      </View>

      <Text style={styles.title}>{t("budget.title")}</Text>

      <Text style={styles.description}>{description}</Text>

      {isIncomeReady && isFinancialReady ? (
        <View style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="sparkles" size={16} color="#4B3FD6" />
            </View>
            <Text style={styles.featureText}>
              {t("budget.ai_powered_category_suggestions")}
            </Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="person-circle-outline" size={16} color="#4B3FD6" />
            </View>
            <Text style={styles.featureText}>
              {t("budget.tailored_to_your_financial_profile")}
            </Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              <Ionicons name="checkmark-circle" size={16} color="#4B3FD6" />
            </View>
            <Text style={styles.featureText}>
              {t("budget.organized_automatically_by_category")}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noticeCard}>
          <Ionicons
            name={isIncomeReady ? "person-circle-outline" : "wallet-outline"}
            size={18}
            color="#4B3FD6"
          />
          <Text style={styles.noticeText}>{description}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <ButtonSave
          label={t("budget.skip")}
          variant="secondary"
          onPress={onSkip}
          disabled={isLoading}
        />
        {isIncomeReady && isFinancialReady && (
          <ButtonSave
            label={t("budget.create_budget")}
            onPress={handleCreate}
            loading={isLoading}
            loadingText={detailLoading ? t("budget.checking_profile") : t("budget.generating")}
          />
        )}
      </View>
    </View>
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
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
    textAlign: "center",
  },

  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  featureCard: {
    width: "100%",
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 36,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0D9FA",
    alignItems: "center",
    justifyContent: "center",
  },

  featureText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },

  noticeCard: {
    width: "100%",
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 36,
  },

  noticeText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    fontWeight: "500",
    flex: 1,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
});
