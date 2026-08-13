import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../theme/ThemeProvider";
import { Theme, ThemeMode } from "../../theme/tokens";
import { t, tLang, Lang } from "../../i18n";
import { formatVND } from "../../utils/formatCurrency";
import {
  BudgetUpdateSuggestion,
  GroupChangeSuggestion,
  ProjectChangeSuggestion,
  SavingsPlanSuggestion,
  TransactionChangeSuggestion,
} from "../../types/ai.types";

export type ConfirmStatus = "pending" | "applying" | "confirmed" | "denied" | "error";

export type ChatConfirmPayload = {
  projectChangeSuggestions?: ProjectChangeSuggestion[] | null;
  budgetSuggestions?: BudgetUpdateSuggestion[] | null;
  savingsSuggestions?: SavingsPlanSuggestion[] | null;
  transactionChangeSuggestions?: TransactionChangeSuggestion[] | null;
  groupChangeSuggestions?: GroupChangeSuggestion[] | null;
};

type Props = {
  payload: ChatConfirmPayload;
  status: ConfirmStatus;
  errorMsg?: string;
  /** Conversation language from the backend's detection — falls back to the app locale. */
  lang?: Lang;
  onConfirm: () => void;
  onDeny: () => void;
};

const PROJECT_OP_KEY: Record<ProjectChangeSuggestion["operation"], string> = {
  CREATE: "ai.confirm_op_project_create",
  SHORTEN: "ai.confirm_op_project_shorten",
  EXTEND: "ai.confirm_op_project_extend",
  DELETE: "ai.confirm_op_project_delete",
};

const TRANSACTION_OP_KEY: Record<TransactionChangeSuggestion["operation"], string> = {
  CREATE: "ai.confirm_op_tx_create",
  UPDATE: "ai.confirm_op_tx_update",
  DELETE: "ai.confirm_op_tx_delete",
};

const GROUP_OP_KEY: Record<GroupChangeSuggestion["operation"], string> = {
  CREATE_GROUP: "ai.confirm_op_group_create",
  INVITE_MEMBER: "ai.confirm_op_group_invite",
  LOCK_GROUP: "ai.confirm_op_group_lock",
  CREATE_GROUP_PROJECT: "ai.confirm_op_group_project_create",
  JOIN_GROUP_PROJECT: "ai.confirm_op_group_project_join",
};

/** Deadlines arrive as ISO dates ("2027-03-01"); show them as dd/MM/yyyy, raw if unparseable. */
function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const dd = `${parsed.getDate()}`.padStart(2, "0");
  const mm = `${parsed.getMonth() + 1}`.padStart(2, "0");
  return `${dd}/${mm}/${parsed.getFullYear()}`;
}

function formatMoney(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return formatVND(value);
}

/**
 * Confirm/dismiss card for a chat turn that carries a `pendingActionId`.
 *
 * The backend only executes the mutation when the app POSTs that id to
 * /api/v1/ai/chat/confirm — answering "yes" as a plain chat message does not
 * apply anything. This card is what turns the reply's proposal into that call,
 * and echoes the concrete numbers being committed so the user sees exactly what
 * the confirmation covers.
 */
export default function ChatConfirmCard({
  payload,
  status,
  errorMsg,
  lang,
  onConfirm,
  onDeny,
}: Props) {
  const { theme, mode } = useThemeMode();
  const accent = mode === "dark" ? theme.link : theme.primary;
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;
  const styles = useMemo(() => createStyles(theme, mode, accent, surface), [theme, mode, accent, surface]);

  // Match the actual conversation language, not just the app's UI locale — same rule the
  // Yes/No chips follow.
  const tr = (key: string) => (lang ? tLang(key, lang) : t(key));

  const projects = payload.projectChangeSuggestions ?? [];
  const budgets = payload.budgetSuggestions ?? [];
  const savings = payload.savingsSuggestions ?? [];
  const transactions = payload.transactionChangeSuggestions ?? [];
  const groups = payload.groupChangeSuggestions ?? [];

  const isResolved = status === "confirmed" || status === "denied";
  const isApplying = status === "applying";

  const row = (key: string, label: string, value: string | null, previous?: string | null) => {
    if (!value) return null;
    return (
      <View style={styles.row} key={key}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowValueGroup}>
          {!!previous && previous !== value && (
            <>
              <Text style={styles.rowValueOld}>{previous}</Text>
              <Ionicons name="arrow-forward" size={12} color={theme.subtext} style={styles.rowArrow} />
            </>
          )}
          <Text style={styles.rowValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const section = (
    key: string,
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    rows: React.ReactNode[],
    reason?: string
  ) => (
    <View style={styles.section} key={key}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={14} color={accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {rows}
      {!!reason && <Text style={styles.reason}>{reason}</Text>}
    </View>
  );

  const sections: React.ReactNode[] = [];

  projects.forEach((p, i) => {
    const opLabel = tr(PROJECT_OP_KEY[p.operation] ?? "ai.confirm_op_generic");
    sections.push(
      section(
        `project-${i}`,
        "flag-outline",
        `${opLabel}: ${p.projectName}`,
        [
          row(`p${i}-target`, tr("ai.confirm_field_target"), formatMoney(p.targetAmount)),
          row(
            `p${i}-deadline`,
            tr("ai.confirm_field_deadline"),
            formatDate(p.newDeadline),
            formatDate(p.currentDeadline)
          ),
          row(
            `p${i}-monthly`,
            tr("ai.confirm_field_monthly"),
            formatMoney(p.newMonthlySaving),
            formatMoney(p.currentMonthlySaving)
          ),
          row(
            `p${i}-budget`,
            tr("ai.confirm_field_available_budget"),
            formatMoney(p.availableBudgetAfter),
            formatMoney(p.availableBudgetBefore)
          ),
        ],
        p.reason
      )
    );
  });

  budgets.forEach((b, i) => {
    sections.push(
      section(
        `budget-${i}`,
        "pie-chart-outline",
        `${tr("ai.confirm_op_budget")}: ${b.category}`,
        [
          row(
            `b${i}-amount`,
            tr("ai.confirm_field_amount"),
            formatMoney(b.suggestedAmount),
            formatMoney(b.currentAmount)
          ),
        ],
        b.reason
      )
    );
  });

  savings.forEach((s, i) => {
    sections.push(
      section(
        `saving-${i}`,
        "wallet-outline",
        `${tr("ai.confirm_op_savings")}: ${s.projectName}`,
        [
          row(
            `s${i}-saved`,
            tr("ai.confirm_field_money_saved"),
            formatMoney(s.newMoneySaved),
            formatMoney(s.currentMoneySaved)
          ),
          row(`s${i}-add`, tr("ai.confirm_field_add_amount"), formatMoney(s.suggestedAddAmount)),
          row(
            `s${i}-months`,
            tr("ai.confirm_field_month_left"),
            s.suggestedMonthLeft === null || s.suggestedMonthLeft === undefined
              ? null
              : `${s.suggestedMonthLeft}`
          ),
          row(
            `s${i}-owed`,
            tr("ai.confirm_field_money_owed"),
            formatMoney(s.suggestedMoneyOwed),
            formatMoney(s.currentMoneyOwed)
          ),
        ],
        s.reason
      )
    );
  });

  transactions.forEach((tx, i) => {
    sections.push(
      section(
        `tx-${i}`,
        "swap-horizontal-outline",
        tr(TRANSACTION_OP_KEY[tx.operation] ?? "ai.confirm_op_generic"),
        [
          row(`t${i}-amount`, tr("ai.confirm_field_amount"), formatMoney(tx.newAmount), formatMoney(tx.currentAmount)),
          row(`t${i}-type`, tr("ai.confirm_field_type"), tx.newType, tx.currentType),
          row(`t${i}-cat`, tr("ai.confirm_field_category"), tx.newCategory, tx.currentCategory),
          row(`t${i}-desc`, tr("ai.confirm_field_description"), tx.newDescription, tx.currentDescription),
          row(`t${i}-date`, tr("ai.confirm_field_date"), formatDate(tx.newDate), formatDate(tx.currentDate)),
        ],
        tx.reason
      )
    );
  });

  groups.forEach((g, i) => {
    sections.push(
      section(
        `group-${i}`,
        "people-outline",
        tr(GROUP_OP_KEY[g.operation] ?? "ai.confirm_op_generic"),
        [
          row(`g${i}-group`, tr("ai.confirm_field_group"), g.groupName),
          row(`g${i}-project`, tr("ai.confirm_field_project"), g.projectName),
          row(`g${i}-email`, tr("ai.confirm_field_email"), g.email),
          row(`g${i}-target`, tr("ai.confirm_field_target"), formatMoney(g.targetAmount)),
          row(
            `g${i}-months`,
            tr("ai.confirm_field_total_months"),
            g.totalMonths === null || g.totalMonths === undefined ? null : `${g.totalMonths}`
          ),
          row(`g${i}-priority`, tr("ai.confirm_field_priority"), g.priority),
          row(`g${i}-impact`, tr("ai.confirm_field_impact"), g.impact),
        ],
        g.reason
      )
    );
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="shield-checkmark-outline" size={16} color={accent} />
        <Text style={styles.cardTitle}>{tr("ai.confirm_card_title")}</Text>
      </View>

      {sections.length > 0 ? (
        sections
      ) : (
        // pendingActionId with no structured preview — the reply text above is the only
        // description of the change, so the card is just the commit control.
        <Text style={styles.emptyHint}>{tr("ai.confirm_card_generic_hint")}</Text>
      )}

      {status === "error" && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color="#B45309" />
          <Text style={styles.errorText}>{errorMsg || tr("ai.confirm_failed")}</Text>
        </View>
      )}

      {isResolved ? (
        <View style={styles.resolvedRow}>
          <Ionicons
            name={status === "confirmed" ? "checkmark-circle" : "close-circle"}
            size={16}
            color={status === "confirmed" ? "#15803D" : theme.subtext}
          />
          <Text
            style={[
              styles.resolvedText,
              { color: status === "confirmed" ? "#15803D" : theme.subtext },
            ]}
          >
            {status === "confirmed" ? tr("ai.confirm_applied") : tr("ai.confirm_dismissed")}
          </Text>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.denyBtn, isApplying && styles.btnDisabled]}
            onPress={onDeny}
            disabled={isApplying}
          >
            <Text style={styles.denyBtnText}>{tr("ai.confirm_dismiss")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, isApplying && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={isApplying}
          >
            {isApplying ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.confirmBtnText}>{tr("ai.confirm_apply")}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string) =>
  StyleSheet.create({
    card: {
      maxWidth: "90%",
      marginTop: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: accent + "55",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    cardTitle: {
      marginLeft: 6,
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      textTransform: "uppercase",
    },
    section: {
      marginBottom: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    sectionTitle: {
      marginLeft: 6,
      fontSize: 13,
      fontWeight: "700",
      color: theme.text,
      flexShrink: 1,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 3,
    },
    rowLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginRight: 10,
      flexShrink: 1,
    },
    rowValueGroup: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },
    rowValueOld: {
      fontSize: 12,
      color: theme.subtext,
      textDecorationLine: "line-through",
    },
    rowArrow: {
      marginHorizontal: 4,
    },
    rowValue: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.text,
    },
    reason: {
      marginTop: 4,
      fontSize: 12,
      fontStyle: "italic",
      color: theme.subtext,
      lineHeight: 17,
    },
    emptyHint: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 4,
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      marginBottom: 4,
    },
    errorText: {
      marginLeft: 4,
      fontSize: 12,
      color: "#B45309",
      flexShrink: 1,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 6,
    },
    denyBtn: {
      backgroundColor: theme.inputBg,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 8,
    },
    denyBtnText: {
      color: theme.subtext,
      fontSize: 13,
      fontWeight: "600",
    },
    confirmBtn: {
      backgroundColor: theme.primary,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 8,
      minWidth: 96,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmBtnText: {
      color: "#FFF",
      fontSize: 13,
      fontWeight: "600",
    },
    btnDisabled: {
      opacity: 0.6,
    },
    resolvedRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },
    resolvedText: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: "600",
    },
  });
