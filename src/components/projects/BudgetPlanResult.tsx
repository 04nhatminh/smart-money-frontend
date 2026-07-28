import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  BulkBudgetsResponse,
  BudgetItem,
} from "../../api/budget.api";
import { useThemeMode } from "../../theme/ThemeProvider";
import { i18n, t } from "../../i18n";

type Props = {
  result: BulkBudgetsResponse;
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

const ALERT: Record<
  BudgetItem["alertLevel"],
  { label: string; bar: string; text: string }
> = {
  SAFE: { label: "budget.alert_normal", bar: "#059669", text: "#059669" },
  CAUTION: { label: "budget.alert_caution", bar: "#D97706", text: "#B45309" },
  WARNING: { label: "budget.alert_warning", bar: "#EA580C", text: "#C2410C" },
  EXCEEDED: { label: "budget.alert_exceeded", bar: "#DC2626", text: "#B91C1C" },
};

export default function BudgetPlanResult({ result }: Props) {
  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' || mode === 'purple' ? '#FFFFFF' : theme.card;

  const styles = useMemo(() => StyleSheet.create({
    wrap: {
      marginTop: 16,
      gap: 10,
    },
    successHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    successTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#065F46",
      flex: 1,
    },
    card: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 12,
      gap: 8,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },
    pill: {
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    pillText: {
      fontSize: 11,
      fontWeight: "700",
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.inputBg,
      overflow: "hidden",
    },
    progressFill: {
      height: 8,
      borderRadius: 4,
    },
    cardBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: theme.subtext,
    },
    failCard: {
      backgroundColor: "#FFFBEB",
      borderWidth: 1,
      borderColor: "#FDE68A",
      borderRadius: 12,
      padding: 12,
      gap: 4,
    },
    failHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    failTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: "#92400E",
    },
    failText: {
      fontSize: 12,
      color: "#92400E",
      lineHeight: 17,
    },
  }), [theme, mode]);

  const formatter = useMemo(
    () => new Intl.NumberFormat(i18n.locale === "vi" ? "vi-VN" : "en-US"),
    []
  );
  const format = (n: number) => formatter.format(Math.round(n || 0));

  const failed = result.failedItems ?? [];

  return (
    <View style={styles.wrap}>
      <View style={styles.successHeader}>
        <Ionicons name="checkmark-circle" size={20} color="#059669" />
        <Text style={styles.successTitle}>
          {t("budget.plan_applied_desc", { count: result.totalCreated })}
        </Text>
      </View>

      {result.budgets.map((b) => {
        const alert = ALERT[b.alertLevel] ?? ALERT.SAFE;
        const pct = Math.min(100, Math.max(0, b.progressPercent || 0));
        return (
          <View key={b.budgetId} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardName}>
                {t(CATEGORY_LABELS[b.category] ?? b.category)}
              </Text>
              <View
                style={[styles.pill, { backgroundColor: `${alert.bar}22` }]}
              >
                <Text style={[styles.pillText, { color: alert.text }]}>
                  {t(alert.label)}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${pct}%`, backgroundColor: alert.bar },
                ]}
              />
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.metaText}>
                {t("budget.spent")}: {format(b.spent)}
              </Text>
              <Text style={styles.metaText}>
                {t("budget.remaining")}: {format(b.remaining)}
              </Text>
              <Text style={styles.metaText}>
                {t("budget.limit")}: {format(b.amountLimit)}
              </Text>
            </View>
          </View>
        );
      })}

      {failed.length > 0 && (
        <View style={styles.failCard}>
          <View style={styles.failHeader}>
            <Ionicons name="alert-circle" size={16} color="#B45309" />
            <Text style={styles.failTitle}>
              {t("budget.some_items_failed")}
            </Text>
          </View>
          {failed.map((f, i) => (
            <Text key={`${f.category}-${i}`} style={styles.failText}>
              • {t(CATEGORY_LABELS[f.category] ?? f.category)}: {f.error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
