import { StyleSheet } from "react-native";

export const projectListStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3F2CCB",
  },

  header: {
    backgroundColor: "#3F2CCB",
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

  content: {
    flex: 1,
    backgroundColor: "#F6F6F8",
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
    backgroundColor: "#ECEAF4",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  filterTabButtonActive: {
    backgroundColor: "#DDD9F5",
  },

  filterTabText: {
    fontSize: 13,
    color: "#A1A1AA",
    fontWeight: "600",
  },

  filterTabTextActive: {
    color: "#6663C7",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

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
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    color: "#2C2C2C",
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
    color: "#8E8E93",
    fontWeight: "500",
  },

  amountText: {
    fontSize: 12,
    color: "#3A3A3C",
    fontWeight: "700",
  },

  progressBarBackground: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
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
    color: "#8E8E93",
  },

  footerValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2C2C2C",
  },

  timeLeftText: {
    fontSize: 12,
    color: "#8E8E93",
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
    color: "#9CA3AF",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F1F0FF",
  },

  filterOptionText: {
    fontSize: 14,
    color: "#3A3A3C",
    fontWeight: "500",
  },

  filterOptionTextActive: {
    color: "#4B3FD6",
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
  backgroundColor: "#F3F4F6",
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
  backgroundColor: "#FFFFFF",
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
    color: "#111827",
  },

  deleteMenuText: {
    color: "#DC2626",
  },

  menuDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
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