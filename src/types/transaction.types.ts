export type TransactionType = "EXPENSE" | "INCOME";

export interface TransactionRequest {
  amount: number;
  category: string;
  type: TransactionType;
  description?: string;
  date: string;
}

export interface TransactionResponse {
  id: string;
  userId?: string;
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  verified?: boolean;
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
  count: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  transactions: TransactionResponse[];
}

export interface GetTransactionsParams {
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: TransactionType;
  page?: number;
  size?: number;
}

export interface TransactionDateRange {
  dateRange: "all_time" | "today" | "yesterday" | "this_week" | "this_month" | "custom";
}

export interface TransactionFilter {
  type: "all" | "expense" | "income";
  categories: string[];
  dateRange: TransactionDateRange["dateRange"];
  customStartDate?: string;
  customEndDate?: string;
}

export interface Receipt {
  type: TransactionType;
  transactionName: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}


