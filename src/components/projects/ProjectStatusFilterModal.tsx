import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProjectStatusFilter } from "../../types/project.types";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  value: ProjectStatusFilter;
  onClose: () => void;
  onChange: (value: ProjectStatusFilter) => void;
};

interface FilterOptionConfig {
  value: ProjectStatusFilter;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

const FILTER_OPTIONS: FilterOptionConfig[] = [
  {
    value: "ALL",
    labelKey: "project.status_all",
    icon: "apps-outline",
    color: "#3629B7",
    bgColor: "#EEF0FF",
  },
  {
    value: "ACTIVE",
    labelKey: "project.status_active",
    icon: "flash-outline",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  {
    value: "COMPLETED",
    labelKey: "project.status_completed",
    icon: "trophy-outline",
    color: "#2563EB",
    bgColor: "#EFF6FF",
  },
  {
    value: "FROZEN",
    labelKey: "project.status_frozen",
    icon: "pause-circle-outline",
    color: "#D97706",
    bgColor: "#FEF3C7",
  },
  {
    value: "ABANDONED",
    labelKey: "project.status_abandoned",
    icon: "hand-left-outline",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  {
    value: "EXPIRED",
    labelKey: "project.status_expired",
    icon: "alert-circle-outline",
    color: "#991B1B",
    bgColor: "#FEE2E2",
  },
];

export default function ProjectStatusFilterModal({
  visible,
  value,
  onClose,
  onChange,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.sheetContainer}>
          {/* Top handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{t("project.filter_status_title")}</Text>
            <View style={styles.headerActions}>
              {value !== "ALL" && (
                <Pressable
                  style={styles.resetButton}
                  onPress={() => onChange("ALL")}
                >
                  <Text style={styles.resetText}>{t("project.filter_reset")}</Text>
                </Pressable>
              )}
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>
          </View>

          {/* Options List */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {FILTER_OPTIONS.map((item) => {
              const selected = value === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[
                    styles.optionCard,
                    selected && styles.optionCardSelected,
                  ]}
                  onPress={() => {
                    onChange(item.value);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {t(item.labelKey)}
                    </Text>
                  </View>

                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={selected ? "#3629B7" : "#CBD5E1"}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Footer Apply Button */}
          <View style={styles.footer}>
            <Pressable style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>{t("project.filter_apply")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleBar: {
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  resetText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3629B7",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  optionsList: {
    maxHeight: 340,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  optionCardSelected: {
    backgroundColor: "#F5F3FF",
    borderColor: "#3629B7",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  optionLabelSelected: {
    color: "#3629B7",
    fontWeight: "700",
  },
  footer: {
    marginTop: 16,
  },
  applyButton: {
    backgroundColor: "#3629B7",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
