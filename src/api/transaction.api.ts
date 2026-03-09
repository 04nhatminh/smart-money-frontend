import http from "./http";
import { tokenStorage } from "../storage/tokenStorage";
import {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQuery,
  TransactionListResponse,
  TransactionResponse,
} from "../types/transaction.types";

const normalizeAuthHeader = (authHeader?: string) => {
  if (!authHeader) return undefined;
  return authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader}`;
};

export const TransactionAPI = {

  create: (data: CreateTransactionRequest) =>
    http.post<Transaction>("/api/v1/transactions", data),

  getAll: () =>
    http.get<TransactionListResponse>("/api/v1/transactions"),

  getById: (id: string) =>
    http.get<TransactionResponse>(`/api/v1/transactions/${id}`),

  update: (id: string, data: UpdateTransactionRequest) =>
    http.put<Transaction>(`/api/v1/transactions/${id}`, data),

  delete: (id: string) =>
    http.delete(`/api/v1/transactions/${id}`),
};