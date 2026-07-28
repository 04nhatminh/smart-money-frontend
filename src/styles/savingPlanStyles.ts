import { StyleSheet } from "react-native";
import { useMemo } from "react";
import { useThemeMode } from "../theme/ThemeProvider";
import { Theme, ThemeMode } from "../theme/tokens";

// ==================== DYNAMIC STYLES ====================
// Styles cho luồng lập kế hoạch tiết kiệm (AI assistant + review),
// build lại theo theme hiện tại (light / dark / green).
export function useSavingPlanStyles() {
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;

  const styles = useMemo(
    () => createSavingPlanStyles(theme, mode, accent, surface),
    [theme, mode]
  );

  return { styles, theme, mode, accent, surface };
}

const createSavingPlanStyles = (
  theme: Theme,
  mode: ThemeMode,
  accent: string,
  surface: string
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 8,
      backgroundColor: theme.bg,
    },

    backButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.text,
    },

    assistantCard: {
      backgroundColor: surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
      marginBottom: 18,
    },

    assistantHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },

    assistantTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },

    assistantQuestion: {
      fontSize: 14,
      color: theme.subtext,
      marginBottom: 18,
    },

    modeButtonRow: {
      flexDirection: "row",
      gap: 12,
    },

    modeButton: {
      flex: 1,
      height: 42,
      backgroundColor: theme.inputBg,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    modeButtonActive: {
      backgroundColor: theme.primary,
    },

    modeButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },

    modeButtonTextActive: {
      color: "#FFFFFF",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 10,
    },

    suggestionBox: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },

    suggestionText: {
      fontSize: 14,
      color: theme.subtext,
    },

    questionText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 12,
    },

    yesNoRow: {
      flexDirection: "row",
      gap: 12,
    },

    lightButton: {
      minWidth: 86,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },

    lightButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },

    reviewTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 10,
    },

    reviewCard: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 22,
    },

    reviewIntro: {
      fontSize: 13,
      color: theme.subtext,
      marginBottom: 14,
    },

    reviewRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      gap: 12,
    },

    reviewLabel: {
      flex: 1,
      fontSize: 15,
      color: theme.subtext,
    },

    reviewValue: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },

    reviewInput: {
      minWidth: 140,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      textAlign: "right",
      fontSize: 14,
      color: theme.text,
      backgroundColor: theme.inputBg,
    },

    primaryButton: {
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.primary,
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
      backgroundColor: theme.inputBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },

    secondaryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },

    dangerButton: {
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },

    dangerButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FF4D6D",
    },

    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },

    emptyText: {
      fontSize: 16,
      color: theme.subtext,
      textAlign: "center",
    },

    disabledButton: {
      opacity: 0.6,
    },

    stepHeader: {
      marginBottom: 18,
    },

    stepActionRow: {
      marginTop: 8,
    },

    aiStatusText: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 8,
    },

    aiAgreeText: {
      color: "#16A34A",
    },

    aiAdjustText: {
      color: accent,
    },

    // Hộp lỗi gợi ý: tint hồng cảnh báo cố định (mọi theme) — chữ trong đó
    // cũng cố định tối để không thành chữ sáng trên nền sáng ở dark mode.
    suggestionErrorBox: {
      borderColor: "#FFB4C2",
      backgroundColor: "#FFF5F7",
    },

    suggestionErrorTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FF4D6D",
      marginBottom: 8,
    },

    suggestionErrorText: {
      fontSize: 13,
      color: "#555555",
      lineHeight: 20,
      marginBottom: 14,
    },

    inlineEditButton: {
      height: 38,
      borderRadius: 12,
      backgroundColor: "#FF4D6D",
      alignItems: "center",
      justifyContent: "center",
    },

    inlineEditButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 14,
    },

  });
