import { StyleSheet } from "react-native";

export const savingPlanStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
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
    backgroundColor: "#F7F7F8",
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
    color: "#262626",
  },

  assistantCard: {
    backgroundColor: "#FFFFFF",
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
    color: "#202020",
  },

  assistantQuestion: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 18,
  },

  modeButtonRow: {
    flexDirection: "row",
    gap: 12,
  },

  modeButton: {
    flex: 1,
    height: 42,
    backgroundColor: "#EDECF3",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modeButtonActive: {
    backgroundColor: "#3F2CCB",
  },

  modeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B4B4B",
  },

  modeButtonTextActive: {
    color: "#FFFFFF",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#242424",
    marginBottom: 10,
  },

  suggestionBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9D9DE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  suggestionText: {
    fontSize: 14,
    color: "#555",
  },

  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E2E2E",
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
    backgroundColor: "#ECEAF2",
    alignItems: "center",
    justifyContent: "center",
  },

  lightButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B4B4B",
  },

  reviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#242424",
    marginBottom: 10,
  },

  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9D9DE",
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
  },

  reviewIntro: {
    fontSize: 13,
    color: "#707070",
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
    color: "#444",
  },

  reviewValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2D2D2D",
  },

  reviewInput: {
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#D8D8DE",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: "right",
    fontSize: 14,
    color: "#2D2D2D",
    backgroundColor: "#FFF",
  },

  primaryButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#3F2CCB",
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
    backgroundColor: "#ECEAF2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },

  dangerButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F3F1F8",
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
    color: "#7A7A7A",
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
  color: "#4B3FD6",
},

});