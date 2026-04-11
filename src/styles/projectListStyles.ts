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
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
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

  emptyWrap: {
    paddingTop: 40,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});