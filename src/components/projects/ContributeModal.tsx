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
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 12,
    },
  }), [theme, mode]);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount("");
      setNote("");
      setError(null);
      setLoading(false);
    }
  }, [visible]);

  const onChangeAmount = (value: string) => {
    const numeric = parseCurrencyToNumber(value);
    setAmount(formatNumberWithDots(numeric));
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    const numericAmount = parseCurrencyToNumber(amount);
    // amount > 0 (0.01 minimum) — the server validates the same.
    if (!numericAmount || numericAmount <= 0) {
      setError(t("project.contribute_amount_positive"));
      return;
    }

    setLoading(true);
    setError(null);
    const res = await ProjectAPI.addContribution(project.projectId, {
      amount: numericAmount,
      note: note.trim() ? note.trim() : undefined,
    });
    setLoading(false);

    if (res.success && res.data) {
      onContributed(res.data);
    } else {
      setError(res.message || t("project.contribute_failed"));
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
            <Text style={styles.remainingLabel}>{t("project.remaining")}</Text>
            <Text style={styles.remainingValue}>
              {formatCurrencyVND(project.remaining)} {project.currency}
            </Text>
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
