import { StyleSheet } from "react-native";
import { useMemo } from "react";
import { useThemeMode } from "../theme/ThemeProvider";
import { Theme, ThemeMode } from "../theme/tokens";

// ==================== DYNAMIC STYLES ====================
// Styles cho màn hình danh sách project (header màu brand + list card),
// build lại theo theme hiện tại (light / dark / green).
export function useProjectListStyles() {
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;

  const styles = useMemo(
    () => createProjectListStyles(theme, mode, accent, surface),
    [theme, mode]
  );

  return { styles, theme, mode, accent, surface };
}

const createProjectListStyles = (
  theme: Theme,
  mode: ThemeMode,
  accent: string,
  surface: string
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.primary,
    },

    header: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 20,
    },

    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },

    // Chữ/trên header luôn nằm trên nền primary đậm nên giữ trắng cố định.
    title: {
      color: "#FFFFFF",
      fontSize: 34,
      fontWeight: "700",
    },

    createButton: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },

    createButtonText: {
      color: "#2C2C2C",
      fontSize: 16,
      fontWeight: "600",
    },

    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  filterIconButtonActive: {
    backgroundColor: "#3629B7",
  },

  filterActiveDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

    // Search box trắng cố định trên header màu — chữ trong đó cũng cố định tối.
    searchBox: {
      flex: 1,
      height: 42,
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      paddingHorizontal: 14,
      justifyContent: "center",
    },

    searchInput: {
      fontSize: 14,
      color: "#1F2937",
    },

    content: {
      flex: 1,
      backgroundColor: theme.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 16,
    },

    filterTabs: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },

    filterTabButton: {
      flex: 1,
      height: 36,
      backgroundColor: theme.inputBg,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    filterTabButtonActive: {
      backgroundColor: accent + "30",
    },

    filterTabText: {
      fontSize: 13,
      color: theme.subtext,
      fontWeight: "600",
    },

    filterTabTextActive: {
      color: accent,
    },

    summaryRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 18,
    },

    // Hai card tổng quan dùng pastel nhận diện (nền sáng cố định, chữ đậm) —
    // đọc tốt ở cả 3 theme nên giữ nguyên, tương tự thẻ pastel ở home.
    summaryCard: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },

    savedCard: {
      backgroundColor: "#F5D9C8",
    },

    amountCard: {
      backgroundColor: "#DAD7F3",
    },

    summaryLabel: {
      fontSize: 13,
      color: "#8E8E93",
      fontWeight: "600",
      marginBottom: 8,
    },

    summaryValue: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
    },

    savedValue: {
      color: "#F97316",
    },

    amountValue: {
      color: "#4338CA",
    },

    summarySubText: {
      fontSize: 12,
      color: "#C08497",
      fontWeight: "600",
    },

    listContent: {
      paddingBottom: 120,
      gap: 14,
    },

    projectCard: {
      backgroundColor: surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1.5,
    },

    projectCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },

    projectTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginRight: 8,
    },

    projectTagRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },

    typeChip: {
      minWidth: 64,
      height: 28,
      borderRadius: 14,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },

    // Chip loại project: tint nhận diện cố định (nền sáng + chữ đậm) — giữ nguyên.
    personalChip: {
      borderColor: "#6C63FF",
      backgroundColor: "#EEF0FF",
    },

    groupChip: {
      borderColor: "#FF6482",
      backgroundColor: "#FFF0F3",
    },

    typeChipText: {
      fontSize: 12,
      fontWeight: "600",
    },

    personalChipText: {
      color: "#5B5BD6",
    },

    groupChipText: {
      color: "#FF4D6D",
    },

    deadlineChip: {
      minWidth: 72,
      height: 28,
      borderRadius: 14,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#6C63FF",
      backgroundColor: "#F4F4FF",
    },

    deadlineChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#5B5BD6",
    },

    amountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },

    amountLabel: {
      fontSize: 12,
      color: theme.subtext,
      fontWeight: "500",
    },

    amountText: {
      fontSize: 12,
      color: theme.text,
      fontWeight: "700",
    },

    progressBarBackground: {
      width: "100%",
      height: 8,
      borderRadius: 999,
      backgroundColor: theme.border,
      overflow: "hidden",
      marginBottom: 12,
    },

    progressBarFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: "#4FD1C5",
    },

    projectFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    progressTextRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    footerLabel: {
      fontSize: 12,
      color: theme.subtext,
    },

    footerValue: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.text,
    },

    timeLeftText: {
      fontSize: 12,
      color: theme.subtext,
    },

    completedText: {
      color: "#16A34A",
      fontWeight: "700",
    },

    overdueText: {
      color: "#DC2626",
      fontWeight: "700",
    },

    emptyWrap: {
      paddingTop: 40,
      alignItems: "center",
    },

    emptyText: {
      fontSize: 14,
      color: theme.subtext,
    },

    filterOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.18)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
      paddingTop: 145,
      paddingRight: 18,
    },

    filterModalCard: {
      width: 170,
      backgroundColor: surface,
      borderRadius: 16,
      paddingVertical: 8,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },

    filterOption: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    filterOptionActive: {
      backgroundColor: accent + "15",
    },

    filterOptionText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: "500",
    },

    filterOptionTextActive: {
      color: accent,
      fontWeight: "700",
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

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    moreButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.inputBg,
    },

    menuOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.2)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },

    menuContainer: {
      width: "78%",
      maxWidth: 320,
      backgroundColor: surface,
      borderRadius: 18,
      paddingVertical: 8,
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.16,
      shadowRadius: 14,
      elevation: 8,
    },

    menuItem: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      gap: 12,
    },

    menuItemText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },

    deleteMenuText: {
      color: "#DC2626",
    },

    menuDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: 14,
    },

    debtRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
    },

    debtText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#DC2626",
    },
  });
