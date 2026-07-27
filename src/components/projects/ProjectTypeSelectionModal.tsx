import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectPersonal: () => void;
  onSelectGroup: () => void;
};

export default function ProjectTypeSelectionModal({
  visible,
  onClose,
  onSelectPersonal,
  onSelectGroup,
}: Props) {
  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 36,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    closeBtn: {
      padding: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.subtext,
      marginTop: 4,
      marginBottom: 20,
    },
    optionsContainer: {
      gap: 12,
    },
    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    optionPressed: {
      backgroundColor: accent + "15",
      borderColor: accent + "40",
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    optionContent: {
      flex: 1,
      marginRight: 8,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    optionDesc: {
      fontSize: 13,
      color: theme.subtext,
      lineHeight: 18,
    },
  }), [theme, mode]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t("project.select_project_type_title") || "Chọn loại dự án"}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.subtext} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {t("project.select_project_type_desc") ||
              "Chọn loại dự án bạn muốn bắt đầu"}
          </Text>

          <View style={styles.optionsContainer}>
            {/* Personal option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionPressed,
              ]}
              onPress={() => {
                onClose();
                onSelectPersonal();
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: accent + "15" }]}>
                <Ionicons name="person" size={24} color={accent} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t("project.type_personal") || "Cá nhân"}
                </Text>
                <Text style={styles.optionDesc}>
                  {t("project.personal_project_desc") ||
                    "Tạo mục tiêu tiết kiệm và quản lý ngân sách cá nhân"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </Pressable>

            {/* Group option */}
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionPressed,
              ]}
              onPress={() => {
                onClose();
                onSelectGroup();
              }}
            >
              <View style={[styles.iconWrap, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="people" size={24} color="#D97706" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {t("project.type_group") || "Nhóm"}
                </Text>
                <Text style={styles.optionDesc}>
                  {t("project.group_project_desc") ||
                    "Chọn nhóm để thêm hoặc quản lý dự án chung"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
