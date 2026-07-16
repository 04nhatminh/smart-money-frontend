import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BudgetAllocationResult } from "../../types/project.types";
import { i18n, t } from "../../i18n";

type Props = {
  budgetResult?: BudgetAllocationResult | null;
  loading?: boolean;
  budgetLoading?: boolean;
  showHeader?: boolean;
  showActions?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "budget.category_food",
  TRANSPORTATION: "budget.category_transportation",
  CLOTHING: "budget.category_clothing",
  UTILITIES: "budget.category_utilities",
  ENTERTAINMENT: "budget.category_entertainment",
  HEALTH: "budget.category_health",
  EDUCATION: "budget.category_education",
  SHOPPING: "budget.category_shopping",
  OTHER: "budget.category_other",
};

export default function BudgetAllocationReview({
  budgetResult = null,
  loading = false,
  showHeader = true,
  showActions = true,
  onConfirm,
  onCancel,
}: Props) {
  const numberFormatter = new Intl.NumberFormat(
    i18n.locale === "vi" ? "vi-VN" : "en-US"
  );

  return (
    <>
      {showHeader && (
        <View style={styles.stepHeader}>
          <Text style={styles.headerTitle}>{t("budget.title")}</Text>
        </View>
      )}

      {budgetResult && (
        <>
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Ionicons name="sparkles" size={20} color="#4B3FD6" />
              <Text style={styles.reviewTitle}>
                {t("budget.ai_suggested_spending_plan")}
              </Text>
            </View>

            <Text style={styles.reviewIntro}>
              {t("budget.to_reach_your_goal_ai_suggests_limiting_these_categories")}
            </Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("budget.total_budget")}</Text>
              <Text style={styles.totalValue}>
                {numberFormatter.format(budgetResult.totalBudget)}{" "}
                {budgetResult.currency}
              </Text>
            </View>

            {budgetResult.categories.map((item, index) => (
              <View key={`${item.category}-${index}`} style={styles.categoryRow}>
                <View style={styles.categoryTextWrap}>
                  <Text style={styles.categoryName}>
                    {t(CATEGORY_LABELS[item.category] ?? item.category)}
                  </Text>

                  {item.reason ? (
                    <Text style={styles.categoryReason}>{item.reason}</Text>
                  ) : null}
                </View>

                <View style={styles.categoryAmountWrap}>
                  <Text style={styles.categoryAmount}>
                    {numberFormatter.format(Number(item.amount ?? 0))}{" "}
                    {budgetResult.currency}
                  </Text>

                  {item.percentage != null && (
                    <Text style={styles.categoryPercent}>
                      {Number(item.percentage).toFixed(1)}%
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {!budgetResult && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{t("budget.no_suggestion_available")}</Text>
        </View>
      )}

      {showActions && (
        <View style={styles.actionWrap}>
          {onConfirm && (
            <Pressable
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? t("budget.confirming") : t("budget.confirm_button")}
              </Text>
            </Pressable>
          )}

          {onCancel && (
            <Pressable style={styles.dangerButton} onPress={onCancel}>
              <Text style={styles.dangerButtonText}>{t("budget.cancel_button")}</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  stepHeader: {
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#262626",
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 14,
    marginTop: 16,
    gap: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  reviewIntro: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    flexShrink: 0,
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
    textAlign: "right",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  categoryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  categoryReason: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#6B7280",
  },
  categoryAmountWrap: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B3FD6",
  },
  categoryPercent: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
  actionWrap: {
    marginTop: 20,
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#3F2CCB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ECEAF2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  dangerButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F3F1F8",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4D6D",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
