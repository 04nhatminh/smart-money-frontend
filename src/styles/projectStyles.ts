import { StyleSheet } from "react-native";
import { useMemo } from "react";
import { useThemeMode } from "../theme/ThemeProvider";
import { Theme, ThemeMode } from "../theme/tokens";

// ==================== DYNAMIC STYLES ====================
// Styles dùng chung cho các modal/step tạo & sửa project,
// build lại theo theme hiện tại (light / dark / green).
export function useProjectStyles() {
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" ? "#FFFFFF" : theme.card;

  const styles = useMemo(
    () => createProjectStyles(theme, mode, accent, surface),
    [theme, mode]
  );

  return { styles, theme, mode, accent, surface };
}

const createProjectStyles = (
  theme: Theme,
  mode: ThemeMode,
  accent: string,
  surface: string
) =>
  StyleSheet.create({
    keyboardContainer: {
      width: "100%",
      flex: 1,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.18)",
      justifyContent: "flex-start",
    },

    modalContainer: {
      flex: 1,
      marginTop: 28,
      width: "100%",
      backgroundColor: surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },

    modalScrollView: {
      flex: 1,
    },

    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },

    title: {
      marginTop: 10,
      fontSize: 32,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 20,
    },

    typeRow: {
      flexDirection: "row",
      marginBottom: 20
    },

    typeBtn: {
      flex: 1,
      backgroundColor: theme.inputBg,
      padding: 12,
      borderRadius: 20,
      alignItems: "center",
      marginRight: 10
    },

    typeBtnActive: {
      backgroundColor: theme.primary,
    },

    typeBtnDisabled: {
      backgroundColor: theme.inputBg,
      opacity: 0.6,
    },

    typeButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
    },

    typeButtonTextActive: {
      color: "#FFFFFF",
    },

    typeButtonTextDisabled: {
      color: theme.subtext,
    },

    formCard: {
      backgroundColor: surface,
      borderRadius: 18,
      padding: 15,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },

    helperText: {
      fontSize: 12,
      color: accent,
      marginTop: -8,
      marginBottom: 12,
      marginLeft: 4,
    },

    buttonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 8,
    },

    cancelButton: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },

    cancelButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },

    createButton: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      backgroundColor: theme.primary,
    },

    name: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 12,
      color: theme.subtext
    },

    warningBox: {
      backgroundColor: "#FFF4E5",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 12,
    },

    warningText: {
      color: "#C26D00",
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
    },

    priorityContainer: {
      gap: 12,

      marginBottom: 12,
    },

    priorityCard: {
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 18,
      padding: 10,
      backgroundColor: surface,
    },

    priorityCardActive: {
      borderColor: accent,
      backgroundColor: accent + "15",
    },

    priorityCardDisabled: {
      backgroundColor: theme.inputBg,
      borderColor: theme.border,
    },

    priorityHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },

    priorityTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },

    priorityTitleActive: {
      color: accent,
    },

    priorityTitleDisabled: {
      color: theme.subtext,
    },

    priorityDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.subtext,
    },

    priorityDescriptionDisabled: {
      color: theme.subtext,
    },

    usedBadge: {
      backgroundColor: theme.inputBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },

    usedBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.subtext,
    },

    highPriorityCard: {
      borderLeftWidth: 5,
      borderLeftColor: "#EF4444",
    },

    mediumPriorityCard: {
      borderLeftWidth: 5,
      borderLeftColor: "#F59E0B",
    },

    lowPriorityCard: {
      borderLeftWidth: 5,
      borderLeftColor: "#10B981",
    },

    priorityChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },

    priorityChipText: {
      fontSize: 12,
      fontWeight: "700",
    },

    highPriorityChip: {
      backgroundColor: "#FEE2E2",
    },

    highPriorityText: {
      color: "#DC2626",
    },

    mediumPriorityChip: {
      backgroundColor: "#FEF3C7",
    },

    mediumPriorityText: {
      color: "#D97706",
    },

    lowPriorityChip: {
      backgroundColor: "#D1FAE5",
    },

    lowPriorityText: {
      color: "#059669",
    },

    switchGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 8,
    },

    switchLabelCol: {
      flex: 1,
      paddingRight: 16,
    },

    switchLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },

    switchSubLabel: {
      marginTop: 4,
      fontSize: 12,
      color: theme.subtext,
      lineHeight: 18,
    },

    popupOverlay: {
      position: "absolute",

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      backgroundColor: "rgba(0,0,0,0.45)",

      justifyContent: "center",
      alignItems: "center",

      zIndex: 9999,
    },

    popupCard: {
      width: "85%",
      backgroundColor: surface,

      borderRadius: 24,

      padding: 24,
    },

    popupTitle: {
      fontSize: 18,
      fontWeight: "700",

      color: theme.text,

      marginBottom: 12,
    },

    popupMessage: {
      fontSize: 14,

      lineHeight: 22,

      color: theme.subtext,

      marginBottom: 24,
    },

    popupActions: {
      flexDirection: "row",

      gap: 12,
    },

  });
