import { Dimensions, StyleSheet } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export const projectStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },

  scrollContainer: {
    paddingBottom: 30,
    margin: 5,
  },

  title: {
    marginTop: 25,
    fontSize: 32,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 20,
  },

  typeRow: {
    flexDirection: "row",
    marginBottom: 20
  },

   typeBtn: {
    flex: 1,
    backgroundColor: "#E5E5EA",
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
    marginRight: 10
  },

  typeBtnActive: {
    backgroundColor: "#4B3FD6",
  },

  typeBtnDisabled: {
    backgroundColor: "#F0F0F0",
  },

  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },

  typeButtonTextActive: {
    color: "#FFFFFF",
  },

  typeButtonTextDisabled: {
    color: "#A0A0A0",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
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
    color: "#6B5CF6",
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
    backgroundColor: "#EFEAF8",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },

  createButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#4B3FD6",
  },

  name: {
    fontSize: 14, 
    fontWeight: "600", 
    marginBottom: 12,
    color: "#979797"
  },

  warningBox: {
    backgroundColor: "#FFF4E5",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },

  warningText: {
    color: "#C26D00",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },

  priorityContainer: {
    gap: 12,

    marginBottom: 12,
  },

  priorityCard: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },

  priorityCardActive: {
    borderColor: "#5B67F1",
    backgroundColor: "#EEF1FF",
  },

  priorityCardDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E4E4E4",
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
    color: "#111827",
  },

  priorityTitleActive: {
    color: "#4254D0",
  },

  priorityTitleDisabled: {
    color: "#9CA3AF",
  },

  priorityDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: "#6B7280",
  },

  priorityDescriptionDisabled: {
    color: "#B0B0B0",
  },

  usedBadge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  usedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
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

});