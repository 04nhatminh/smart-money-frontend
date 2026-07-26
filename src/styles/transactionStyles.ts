import { StyleSheet } from "react-native";
import { useMemo } from "react";
import { useThemeMode } from "../theme/ThemeProvider";
import { Theme, ThemeMode } from "../theme/tokens";

// ==================== DYNAMIC STYLES ====================
// Styles dùng chung cho màn hình chi tiết giao dịch + modal thêm/sửa,
// build lại theo theme hiện tại (light / dark / green).
export function useTransactionStyles() {
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" ? "#FFFFFF" : theme.card;

  const styles = useMemo(
    () => createTransactionStyles(theme, mode, accent, surface),
    [theme, mode]
  );

  return { styles, theme, mode, accent, surface };
}

const createTransactionStyles = (
  theme: Theme,
  mode: ThemeMode,
  accent: string,
  surface: string
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.bg,
    },

    title: {
      fontSize: 26,
      fontWeight: "600",
      marginBottom: 20,
      color: theme.text,
    },

    typeRow: {
      flexDirection: "row",
      marginBottom: 20,
    },

    typeBtn: {
      flex: 1,
      backgroundColor: theme.inputBg,
      padding: 12,
      borderRadius: 20,
      alignItems: "center",
      marginRight: 10,
    },

    expenseActive: {
      backgroundColor: "#FF4D6D",
    },

    incomeActive: {
      backgroundColor: "#4adcbf",
    },

    typeText: {
      color: theme.text,
      fontWeight: "600",
    },

    // Chữ trên nút loại đang chọn (nền hồng/xanh đậm) luôn trắng.
    typeTextActive: {
      color: "#FFFFFF",
    },

    form: {
      backgroundColor: surface,
      padding: 20,
      borderRadius: 20,
    },

    buttonRow: {
      flexDirection: "row",
      marginTop: 25,
      gap: 10,
    },

    cancel: {
      flex: 1,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 25,
      backgroundColor: theme.inputBg,
    },

    cancelText: {
      fontWeight: "600",
      color: theme.text,
    },

    name: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 12,
      color: theme.subtext,
    },

    row: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14,
    },

    dateInput: {
      flex: 2,
      height: 46,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      paddingHorizontal: 16,
    },

    timeInput: {
      flex: 1,
      height: 46,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      paddingHorizontal: 16,
    },

    dateText: {
      fontSize: 14,
      color: theme.text,
    },

    amountSection: {
      alignItems: "center",
      marginBottom: 30,
    },

    amount: {
      fontSize: 28,
      fontWeight: "700",
      marginTop: 10,
      color: theme.text,
    },

    category: {
      flexDirection: "row",
      fontSize: 16,
      color: theme.subtext,
      marginTop: 4,
    },

    card: {
      backgroundColor: surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 20,
    },

    label: {
      fontSize: 14,
      color: theme.subtext,
    },

    value: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
    },

    expense: {
      color: "#FF4D6D",
    },

    income: {
      color: "#2ECC71",
    },

    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    editBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    editText: {
      color: accent,
      fontWeight: "600",
    },

    deleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    deleteText: {
      color: "#FF4D6D",
      fontWeight: "600",
    },

    errorText: {
      color: "#FF4D6D",
      fontSize: 12,
      marginTop: 4,
      marginBottom: 6,
    },

    summaryCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: surface,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },

    iconBox: {
      width: 45,
      height: 45,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 15,
      marginLeft: 4,
    },
    summaryTextWrap: {
      flex: 1,
    },

    titleDetail: {
      flex: 1,
      fontSize: 18,
      fontWeight: "600",
      color: accent,
      marginRight: 8,
    },

    amountDetail: {
      fontSize: 22,
      fontWeight: "700",
      flexShrink: 0,
    },
  });
