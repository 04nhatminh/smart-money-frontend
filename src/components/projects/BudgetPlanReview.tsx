import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BudgetCategory } from "../../api/budget.api";
import {
  BudgetAllocationBasis,
  BudgetAllocationPlanResponse,
} from "../../types/budget_allocation.types";
import { i18n, t } from "../../i18n";

export type ApplyItem = { category: BudgetCategory; amountLimit: number };

type Props = {
  plan: BudgetAllocationPlanResponse;
  applying?: boolean;
  onApply: (items: ApplyItem[]) => void;
};

const MAX_BULK_ITEMS = 20;

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

const BASIS_LABELS: Record<BudgetAllocationBasis, string> = {
  HISTORY: "budget.basis_history",
  TEMPLATE: "budget.basis_template",
  FLOORED: "budget.basis_floored",
};

const BASIS_COLORS: Record<BudgetAllocationBasis, { bg: string; fg: string }> = {
  HISTORY: { bg: "#EDE9FE", fg: "#5B21B6" },
  TEMPLATE: { bg: "#E0F2FE", fg: "#0369A1" },
  FLOORED: { bg: "#FEF3C7", fg: "#92400E" },
};

/** Strip everything but digits and coerce to a whole number. */
const toNumber = (value: string): number => {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

export default function BudgetPlanReview({
  plan,
  applying = false,
  onApply,
}: Props) {
  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.locale === "vi" ? "vi-VN" : "en-US"),
    []
  );
  const format = (n: number) => formatter.format(Math.round(n || 0));

  // Editable per-category state (raw numeric strings) + dropped categories.
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    plan.allocations.forEach((a) => {
      initial[a.category] = String(Math.round(a.amount || 0));
    });
    return initial;
  });
  const [dropped, setDropped] = useState<Set<string>>(() => new Set());

  const setAmount = (category: string, text: string) =>
    setAmounts((prev) => ({ ...prev, [category]: text.replace(/\D/g, "") }));

  const toggleDrop = (category: string) =>
    setDropped((prev) => {
      const next = new Set(prev);
      next.has(category) ? next.delete(category) : next.add(category);
      return next;
    });

  const applyItems = useMemo<ApplyItem[]>(() => {
    return plan.allocations
      .filter((a) => !dropped.has(a.category))
      .map((a) => ({
        category: a.category,
        amountLimit: toNumber(amounts[a.category] ?? ""),
      }))
      .filter((item) => item.amountLimit > 0)
      .slice(0, MAX_BULK_ITEMS);
  }, [plan.allocations, amounts, dropped]);

  const canApply = !plan.overCommitted && applyItems.length > 0;

  // ---- Over-committed: nothing to allocate, don't offer apply. ----
  if (plan.overCommitted) {
    return (
      <View style={styles.blockedCard}>
        <Ionicons name="lock-closed" size={22} color="#B91C1C" />
        <Text style={styles.blockedTitle}>
          {t("budget.over_committed_title")}
        </Text>
        <Text style={styles.blockedDesc}>
          {t("budget.over_committed_desc")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {/* Headline summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t("budget.monthly_income")}</Text>
          <Text style={styles.summaryValue}>{format(plan.income)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {t("budget.reserved_savings")}
          </Text>
          <Text style={styles.summaryValue}>{format(plan.targetSavings)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {t("budget.spendable_envelope")}
          </Text>
          <Text style={styles.summaryValue}>{format(plan.envelope)}</Text>
        </View>

        {plan.surplusToSavings > 0 && (
          <View style={styles.savingsRow}>
            <View style={styles.savingsLabelWrap}>
              <Ionicons name="trending-up" size={16} color="#059669" />
              <Text style={styles.savingsLabel}>{t("budget.to_savings")}</Text>
            </View>
            <Text style={styles.savingsValue}>
              +{format(plan.surplusToSavings)}
            </Text>
          </View>
        )}
        {plan.surplusToSavings > 0 && (
          <Text style={styles.savingsHint}>{t("budget.to_savings_hint")}</Text>
        )}
      </View>

      {/* Cold-start gentle note */}
      {plan.coldStart && (
        <View style={styles.coldStartCard}>
          <Ionicons name="information-circle" size={16} color="#0369A1" />
          <Text style={styles.coldStartText}>
            {t("budget.cold_start_note")}
          </Text>
        </View>
      )}

      <Text style={styles.editHint}>{t("budget.plan_edit_hint")}</Text>

      {/* Editable allocation rows */}
      {plan.allocations.map((a) => {
        const isDropped = dropped.has(a.category);
        const basis = BASIS_COLORS[a.basis] ?? BASIS_COLORS.HISTORY;
        return (
          <View
            key={a.category}
            style={[styles.itemRow, isDropped && styles.itemRowDropped]}
          >
            <View style={styles.itemMain}>
              <View style={styles.itemTitleRow}>
                <Text
                  style={[
                    styles.itemName,
                    isDropped && styles.itemNameDropped,
                  ]}
                >
                  {t(CATEGORY_LABELS[a.category] ?? a.category)}
                </Text>
                <View
                  style={[styles.badge, { backgroundColor: basis.bg }]}
                >
                  <Text style={[styles.badgeText, { color: basis.fg }]}>
                    {t(BASIS_LABELS[a.basis] ?? "budget.basis_history")}
                  </Text>
                </View>
              </View>

              {a.recurring > 0 && !isDropped && (
                <Text style={styles.fixedNote}>
                  {t("budget.fixed_portion", {
                    fixed: format(a.recurring),
                    total: format(toNumber(amounts[a.category] ?? "")),
                  })}
                </Text>
              )}
            </View>

            {isDropped ? (
              <Pressable
                style={styles.restoreBtn}
                onPress={() => toggleDrop(a.category)}
                hitSlop={8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#4B3FD6" />
                <Text style={styles.restoreText}>
                  {t("budget.restore_category")}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.itemRight}>
                <TextInput
                  style={styles.amountInput}
                  value={format(toNumber(amounts[a.category] ?? ""))}
                  onChangeText={(text) => setAmount(a.category, text)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  editable={!applying}
                />
                <Pressable
                  onPress={() => toggleDrop(a.category)}
                  hitSlop={8}
                  disabled={applying}
                >
                  <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            )}
          </View>
        );
      })}

      {/* Apply */}
      <Pressable
        style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
        onPress={() => canApply && onApply(applyItems)}
        disabled={!canApply || applying}
      >
        <Text style={styles.applyBtnText}>
          {applying ? t("budget.applying") : t("budget.apply_plan")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: "#F8F7FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E5FF",
    padding: 14,
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E9E5FF",
  },
  savingsLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#059669",
  },
  savingsHint: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
  },
  coldStartCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coldStartText: {
    fontSize: 13,
    color: "#075985",
    flex: 1,
    lineHeight: 18,
  },
  editHint: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  itemRowDropped: {
    opacity: 0.6,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  itemNameDropped: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  fixedNote: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  amountInput: {
    minWidth: 96,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
    color: "#4B3FD6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B3FD6",
  },
  applyBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#3F2CCB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  blockedCard: {
    marginTop: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  blockedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991B1B",
    textAlign: "center",
  },
  blockedDesc: {
    fontSize: 13,
    color: "#B91C1C",
    textAlign: "center",
    lineHeight: 19,
  },
});
