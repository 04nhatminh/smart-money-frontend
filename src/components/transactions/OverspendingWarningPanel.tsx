import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { formatVND } from "../../utils/formatCurrency";
import { OverspendingWarning } from "../../services/overspendingWarning.service";

interface Props {
  visible: boolean;
  warning: OverspendingWarning | null;
  onClose: () => void;
}

export default function OverspendingWarningPanel({
  visible,
  warning,
  onClose,
}: Props) {
  if (!warning) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="warning" size={40} color="#D97706" />
          </View>

          <Text style={styles.title}>{t("overspending.warning_title")}</Text>

          <Text style={styles.desc}>
            {t("overspending.warning_message", {
              deficit: formatVND(warning.deficit),
              income: formatVND(warning.setupIncome),
            })}
          </Text>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t("overspending.monthly_expense")}
              </Text>
              <Text style={[styles.summaryValue, styles.expenseValue]}>
                {formatVND(warning.monthlyTotalExpense)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t("overspending.monthly_income")}
              </Text>
              <Text style={[styles.summaryValue, styles.incomeValue]}>
                {formatVND(warning.monthlyTotalIncome)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowLast]}>
              <Text style={styles.summaryLabel}>
                {t("overspending.setup_income")}
              </Text>
              <Text style={styles.summaryValue}>
                {formatVND(warning.setupIncome)}
              </Text>
            </View>
          </View>

          <Pressable style={styles.dismissBtn} onPress={onClose}>
            <Text style={styles.dismissText}>{t("overspending.dismiss")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
  },

  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 14,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    color: "#B45309",
    marginBottom: 8,
  },

  desc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#374151",
    marginBottom: 16,
  },

  summaryBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  summaryRowLast: {
    borderBottomWidth: 0,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#64748B",
    flexShrink: 1,
    marginRight: 8,
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },

  expenseValue: {
    color: "#DC2626",
  },

  incomeValue: {
    color: "#16A34A",
  },

  dismissBtn: {
    marginTop: 12,
    backgroundColor: "#D97706",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
    minWidth: 140,
    alignItems: "center",
  },

  dismissText: {
    color: "#fff",
    fontWeight: "600",
  },
});
