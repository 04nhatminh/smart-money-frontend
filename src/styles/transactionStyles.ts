import { StyleSheet } from "react-native";

export const transactionStyles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F6F6F6"
  },

  title: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 20
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

  expenseActive: {
    backgroundColor: "#FF4D6D"
  },

  incomeActive: {
    backgroundColor: "#8E8CD8"
  },

  typeText: {
    color: "white",
    fontWeight: "600"
  },

  form: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 25,
    gap: 10
  },

  cancel: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    backgroundColor: "#E5E5EA"
  },

  cancelText: {
    fontWeight: "600"
  },

  name: {
    fontSize: 14, 
    fontWeight: "600", 
    marginBottom: 12,
    color: "#979797"
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
    borderColor: "#E5E5EA",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  timeInput: {
    flex: 1,
    height: 46,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    justifyContent: "center",
    paddingHorizontal: 16,
  },


  dateText: {
    fontSize: 14,
    color: "#1F2937",
  },

});