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

  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },

  typeButtonTextActive: {
    color: "#FFFFFF",
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

});