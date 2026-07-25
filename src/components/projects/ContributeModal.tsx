import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { InputField } from "../InputField";
import { ButtonSave } from "../ButtonSave";
import { ProjectAPI } from "../../api/project.api";
import { ProjectDetailResponse } from "../../types/project.types";
import {
  formatCurrencyVND,
  formatNumberWithDots,
  parseCurrencyToNumber,
} from "../../utils/project";
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  project: ProjectDetailResponse;
  onClose: () => void;
  /** Called with the updated project after a successful contribution. */
  onContributed: (updated: ProjectDetailResponse) => void;
};

/**
 * Manual press-to-contribute (adaptive-engine guide, Screen 5). The everyday,
 * unprompted way to fund a saving goal — writes the same ProjectContribution as
 * accepting a CONTRIBUTE_TO_PROJECT suggestion, so progress adds into one number.
 * Only mounted when the project's status is contributable.
 */
export default function ContributeModal({
  visible,
  project,
  onClose,
  onContributed,
}: Props) {
  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;

  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 32,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.subtext,
      marginBottom: 16,
    },
    remainingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
    },
    remainingLabel: {
      fontSize: 13,
      color: theme.subtext,
      fontWeight: "500",
    },
    remainingValue: {
      fontSize: 15,
      color: theme.text,
      fontWeight: "700",
    },
    fieldLabel: {
      fontSize: 13,
      color: theme.text,
      fontWeight: "600",
      marginBottom: 6,
      marginLeft: 4,
    },

    // Nút điền nhanh + hộp gợi ý vượt mức: tint xanh dương info cố định (nền
    // sáng + chữ xanh đậm cùng tông icon) — đọc tốt ở cả 3 theme nên giữ nguyên.
    quickFillButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#EFF6FF",
      borderWidth: 1,
      borderColor: "#BFDBFE",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    quickFillText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#2563EB",
    },
    exceedingContainer: {
      backgroundColor: "#EFF6FF",
      borderWidth: 1,
      borderColor: "#BFDBFE",
      borderRadius: 12,
      padding: 12,
      marginTop: -8,
      marginBottom: 12,
    },
    exceedingText: {
      fontSize: 12,
      color: "#1E40AF",
      fontWeight: "500",
      marginBottom: 8,
    },
    adjustButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#93C5FD",
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    adjustButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#2563EB",
    },

    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
  }), [theme, mode]);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isExceeding, setIsExceeding] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount("");
      setNote("");
      setError(null);
      setIsExceeding(false);
      setLoading(false);
    }
  }, [visible]);

  const onChangeAmount = (value: string) => {
    const numeric = parseCurrencyToNumber(value);
    setAmount(formatNumberWithDots(numeric));
    if (error) setError(null);
    if (isExceeding) setIsExceeding(false);
  };

  const handleSubmit = async () => {
    const numericAmount = parseCurrencyToNumber(amount);
    // amount > 0 (0.01 minimum) — the server validates the same.
    if (!numericAmount || numericAmount <= 0) {
      setError(t("project.contribute_amount_positive"));
      setIsExceeding(false);
      return;
    }

    if (numericAmount > project.remaining) {
      setIsExceeding(true);
      setError(
        t("project.contribute_exceeds_remaining")
          .replace("{amount}", `${formatCurrencyVND(numericAmount)} ${project.currency}`)
          .replace("{remaining}", `${formatCurrencyVND(project.remaining)} ${project.currency}`)
      );
      return;
    }

    setLoading(true);
    setError(null);
    setIsExceeding(false);
    const res = await ProjectAPI.addContribution(project.projectId, {
      amount: numericAmount,
      note: note.trim() ? note.trim() : undefined,
    });
    setLoading(false);

    if (res.success && res.data) {
      onContributed(res.data);
    } else {
      const errMsg = res.message || t("project.contribute_failed");
      setError(errMsg);
      if (errMsg.includes("PROJECT_CONTRIBUTION_EXCEEDS_REMAINING") || errMsg.toLowerCase().includes("exceeds")) {
        setIsExceeding(true);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{t("project.contribute_title")}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.subtext} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            {t("project.contribute_subtitle").replace("{name}", project.name)}
          </Text>

          <View style={styles.remainingRow}>
            <View>
              <Text style={styles.remainingLabel}>{t("project.remaining")}</Text>
              <Text style={styles.remainingValue}>
                {formatCurrencyVND(project.remaining)} {project.currency}
              </Text>
            </View>
            {project.remaining > 0 && (
              <Pressable
                style={styles.quickFillButton}
                onPress={() => onChangeAmount(project.remaining.toString())}
              >
                <Ionicons name="flash-outline" size={13} color="#2563EB" />
                <Text style={styles.quickFillText}>{t("project.contribute_quick_fill")}</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.fieldLabel}>{t("project.contribute_amount")}</Text>
          <InputField
            iconName="cash-outline"
            placeholder={t("project.contribute_amount_placeholder")}
            value={amount}
            onChangeText={onChangeAmount}
            keyboardType="numeric"
            rightText={project.currency}
            error={error ?? undefined}
          />

          {isExceeding && project.remaining > 0 && (
            <View style={styles.exceedingContainer}>
              <Text style={styles.exceedingText}>
                {t("project.contribute_suggest_adjust")}
              </Text>
              <Pressable
                style={styles.adjustButton}
                onPress={() => {
                  onChangeAmount(project.remaining.toString());
                  setIsExceeding(false);
                  setError(null);
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={15} color="#2563EB" />
                <Text style={styles.adjustButtonText}>
                  {t("project.contribute_adjust_to").replace("{amount}", `${formatCurrencyVND(project.remaining)} ${project.currency}`)}
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.fieldLabel}>{t("project.contribute_note")}</Text>
          <InputField
            iconName="create-outline"
            placeholder={t("project.contribute_note_placeholder")}
            value={note}
            onChangeText={setNote}
            maxLength={255}
          />

          <View style={styles.actions}>
            <ButtonSave
              label={t("common.cancel")}
              variant="secondary"
              disabled={loading}
              onPress={onClose}
            />
            <ButtonSave
              label={t("project.contribute_action")}
              variant="primary"
              loading={loading}
              loadingText={t("project.contribute_action")}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
