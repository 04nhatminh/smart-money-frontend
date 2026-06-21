import React from "react";
import { Pressable, Text, View } from "react-native";
import { BudgetAllocationResult } from "../../types/project.types";
import { savingPlanStyles as styles } from "../../styles/savingPlanStyles";
import { i18n, t } from "../../i18n";

type Props = {
  budgetResult?: BudgetAllocationResult | null;
  loading?: boolean;
  budgetLoading?: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function BudgetAllocationReview({
  budgetResult = null,
  loading = false,
  onBack,
  onConfirm,
  onCancel,
}: Props) {
  const numberFormatter = new Intl.NumberFormat(
    i18n.locale === "vi" ? "vi-VN" : "en-US"
  );

  return (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.headerTitle}>{t("budget.title")}</Text>
      </View>

      {budgetResult && (
        <>
          <Text style={styles.reviewTitle}>
            {t("budget.ai_suggested_spending_plan")}
          </Text>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewIntro}>
              {t("budget.to_reach_your_goal_ai_suggests_limiting_these_categories")}
            </Text>

            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>{t("budget.total_budget")}</Text>
              <Text style={styles.reviewValue}>
                {numberFormatter.format(budgetResult.totalBudget)}{" "}
                {budgetResult.currency}
              </Text>
            </View>

            {budgetResult.categories.map((item, index) => (
              <View key={`${item.category}-${index}`} style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>
                  {item.category}
                  {item.percentage != null ? ` (${item.percentage.toFixed(1)}%)` : ""}
                  {item.reason ? ` - ${item.reason}` : ""}
                </Text>
                <Text style={styles.reviewValue}>
                  {numberFormatter.format(item.amount)} {budgetResult.currency}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {!budgetResult && (
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>{t("budget.no_suggestion_available")}</Text>
        </View>
      )}

      <Pressable
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={onConfirm}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? t("budget.confirming") : t("budget.confirm_button")}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>{t("budget.edit_button")}</Text>
      </Pressable>

      <Pressable style={styles.dangerButton} onPress={onCancel}>
        <Text style={styles.dangerButtonText}>{t("budget.cancel_button")}</Text>
      </Pressable>
    </>
  );
}
