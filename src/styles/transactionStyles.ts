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

  amountSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  amount: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 10,
  },

  category: {
    flexDirection: "row",
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    color: "#888",
  },

  value: {
    fontSize: 14,
    fontWeight: "500",
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
    color: "#3629B7",
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
    marginBottom: 6
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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
    color: "#5B5BD6",
    marginRight: 8,
  },

  amountDetail: {
    fontSize: 22,
    fontWeight: "700",
    flexShrink: 0,
  },

});