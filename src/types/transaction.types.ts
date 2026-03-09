export type TransactionType = "EXPENSE" | "INCOME";

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: TransactionType;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt?: string;

}

export interface CreateTransactionRequest {
  amount: number;
  category: string;
  type: TransactionType;
  description?: string;
  date: string;
}

export interface UpdateTransactionRequest {
  name?: string;
  amount?: number;
  category?: string;
  type?: TransactionType;
  description?: string;
  date?: string;
  createdAt?: string;
}

export interface TransactionQuery {
  type?: TransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
}
export interface TransactionListResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    transactions: Transaction[];
  };
}

export interface TransactionResponse {
    success: boolean;
    message: string;
    data: Transaction;
  }