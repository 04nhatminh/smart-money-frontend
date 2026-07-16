import { Alert } from "react-native";
import { Receipt, TransactionRequest } from "../types/transaction.types";
import transactionApi from "../api/transaction.api";
import AIAPI from "../api/ai.api";
import authApi from "../api/auth.api";
import { Client } from "@stomp/stompjs";
import { parseDateStringtoString } from "../utils/dateFormatter";

export const createTransaction = async (payload: any) => {
  const result = await transactionApi.create(payload);

  if (!result.success) {
    throw new Error(result.message || "Tạo giao dịch thất bại");
  }

  return result.data;
};

export const getTransactions = async (params: any) => {
  const result = await transactionApi.getTransactions(params);

  if (!result.success) {
    throw new Error(result.message || "Lấy danh sách giao dịch thất bại");
  }

  return result.data;
};

const mapReceiptToPayload = (receipt: Receipt) => ({
  amount: receipt.amount,
  type: receipt.type === "INCOME" ? ("INCOME" as const) : ("EXPENSE" as const),
  category: receipt.category.toUpperCase(),
  description: receipt.description?.trim() || receipt.transactionName,
  date: parseDateStringtoString(receipt.date),
});

const mapVoiceTransactionToPayload = (transaction: TransactionRequest) => ({
  amount: transaction.amount,
  type: transaction.type === "INCOME" ? ("INCOME" as const) : ("EXPENSE" as const),
  category: transaction.category.toUpperCase(),
  description: transaction.description?.trim(),
  date: parseDateStringtoString(transaction.date),
});

export const useCreateTransaction = () => {

  const createManualTransaction = async (
    payload: TransactionRequest
  ) => {
    try {
      await createTransaction(payload);
      // Alert.alert("Success", "Transaction created successfully");
      return true;
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create transaction");
      throw error;
    }
  };

  const createFromReceipt = async (receipt: Receipt): Promise<boolean> => {
    try {
      const payload = mapReceiptToPayload(receipt);

      await createTransaction(payload);

      return true;
    } catch (error) {
      throw error;
    }
  };

  const createFromVoice = async (transaction: TransactionRequest) => {
    try {
      const payload = mapVoiceTransactionToPayload(transaction);
      await createTransaction(payload);
      Alert.alert("Success", "Voice transaction created successfully");
      return true;
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create voice transaction");
      throw error;
    }
  };

  return {
    createManualTransaction,
    createFromReceipt,
    createFromVoice,
  };
};