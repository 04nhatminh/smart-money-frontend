import { TransactionRequest, TransactionType } from "../types/transaction.types";

export interface ParsedTransaction {
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
  date: string;
}

// Category mapping từ keywords
const CATEGORY_MAP: { [key: string]: string } = {
  // Expense categories
  "ăn": "FOOD",
  "uống": "FOOD",
  "cơm": "FOOD",
  "phở": "FOOD",
  "đồ ăn": "FOOD",
  "xăng": "TRANSPORT",
  "xe": "TRANSPORT",
  "taxi": "TRANSPORT",
  "bus": "TRANSPORT",
  "vé": "TRANSPORT",
  "điện": "UTILITIES",
  "nước": "UTILITIES",
  "internet": "UTILITIES",
  "điện thoại": "UTILITIES",
  "mua": "SHOPPING",
  "quần áo": "SHOPPING",
  "sách": "SHOPPING",
  "y tế": "HEALTH",
  "bệnh viện": "HEALTH",
  "thuốc": "HEALTH",
  "giải trí": "ENTERTAINMENT",
  "phim": "ENTERTAINMENT",
  "game": "ENTERTAINMENT",
  
  // Income categories
  "lương": "SALARY",
  "thưởng": "BONUS",
  "bán": "SELLING",
  "bán hàng": "SELLING",
  "freelance": "FREELANCE",
  "đầu tư": "INVESTMENT",
  "lãi": "INTEREST",
};

const TRANSACTION_TYPE_KEYWORDS = {
  EXPENSE: ["chi", "trả", "mua", "tệ", "tiêu"],
  INCOME: ["thu", "nhận", "kiếm", "được", "lãi", "lương"],
};

/**
 * Parse transaction từ notification content
 * Hỗ trợ nhiều format:
 * 1. "Chi 50000 cho ăn uống: Cơm chiều"
 * 2. JSON object trong notification data
 * 3. Freeform text parsing
 */
export const parseTransactionFromNotification = (
  content: string,
  notificationData?: Record<string, any>
): ParsedTransaction | null => {
  try {
    // 1️⃣ Nếu data là structured JSON
    if (notificationData?.transaction) {
      return parseStructuredTransaction(notificationData.transaction);
    }

    // 2️⃣ Parse từ text content
    return parseTextTransaction(content);
  } catch (err) {
    console.error("parseTransactionFromNotification error:", err);
    return null;
  }
};

/**
 * Parse transaction từ structured object
 */
const parseStructuredTransaction = (data: any): ParsedTransaction | null => {
  const amount = parseAmount(data.amount || data.price || data.value);
  if (amount === null) return null;

  return {
    amount,
    type: (data.type || "EXPENSE") as TransactionType,
    category: data.category || guessCategory(data.description || ""),
    description: data.description || data.note || "",
    date: data.date || new Date().toISOString(),
  };
};

/**
 * Parse transaction từ text content
 * Regex patterns để match: "Chi/Thu [amount] [category/description]"
 */
const parseTextTransaction = (text: string): ParsedTransaction | null => {
  // Match patterns như: "Chi 500k cho ăn" hoặc "Thu 2 triệu từ lương"
  const patterns = [
    /(?:chi|trả|mua|tiêu)\s*(?:đi\s*)?([0-9.,]+\s*(?:k|triệu|tỷ)?)\s*(?:cho\s*)?(.+)/i,
    /(?:thu|nhận|kiếm|được)\s*([0-9.,]+\s*(?:k|triệu|tỷ)?)\s*(?:từ\s*)?(.+)/i,
    /([0-9.,]+\s*(?:k|triệu|tỷ)?)\s*(?:cho|từ|cho việc|do)\s*(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount !== null) {
        const description = match[2]?.trim() || "";
        
        return {
          amount,
          type: detectTransactionType(text),
          category: guessCategory(description),
          description,
          date: new Date().toISOString(),
        };
      }
    }
  }

  return null;
};

/**
 * Parse số tiền từ string với các unit (k, triệu, tỷ)
 * "500k" → 500000
 * "2 triệu" → 2000000
 */
  const parseAmount = (amountStr: string | number): number | null => {
    if (typeof amountStr === "number") {
      return Math.abs(amountStr);
    }

    if (!amountStr) return null;

    let str = String(amountStr)
      .trim()
      .toLowerCase();

    // remove currency symbols
    str = str.replace(/(vnd|vnđ|đ)/g, "").trim();

    // detect unit
    let multiplier = 1;

    if (str.includes("tỷ") || str.includes("tỉ")) {
      multiplier = 1_000_000_000;
    } else if (
      str.includes("triệu") ||
      str.includes("tr")
    ) {
      multiplier = 1_000_000;
    } else if (
      str.includes("k") ||
      str.includes("nghìn")
    ) {
      multiplier = 1_000;
    }

    // remove all non-digit except dot/comma/minus
    str = str.replace(/[^\d.,-]/g, "");

    // CASE 1:
    // 10,000 or 10.000 => thousand separator
    if (/^\d{1,3}([.,]\d{3})+$/.test(str)) {
      str = str.replace(/[.,]/g, "");
    } else {
      // decimal format
      str = str.replace(",", ".");
    }

    const value = parseFloat(str);

    if (isNaN(value)) return null;

    return Math.abs(Math.round(value * multiplier));
  };

/**
 * Detect transaction type (CHI/THU) từ text
 */
const detectTransactionType = (text: string): TransactionType => {
  const lowerText = text.toLowerCase();

  for (const keyword of TRANSACTION_TYPE_KEYWORDS.INCOME) {
    if (lowerText.includes(keyword)) return "INCOME";
  }

  for (const keyword of TRANSACTION_TYPE_KEYWORDS.EXPENSE) {
    if (lowerText.includes(keyword)) return "EXPENSE";
  }

  return "EXPENSE"; // default
};

/**
 * Đoán category từ description
 */
const guessCategory = (description: string): string => {
  const lowerDesc = description.toLowerCase();

  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lowerDesc.includes(keyword)) {
      return category;
    }
  }

  return "OTHER";
};

/**
 * Format transaction từ notification để hiển thị
 */
export const formatTransactionDisplay = (
  parsed: ParsedTransaction
): string => {
  const typeStr = parsed.type === "INCOME" ? "💰 Thu" : "💸 Chi";
  const amountStr = formatCurrency(parsed.amount);
  return `${typeStr} ${amountStr} - ${parsed.description}`;
};

/**
 * Format tiền tệ
 */
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toLocaleString("en-US")} Tr VND`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toLocaleString("en-US")}k VND`;
  }
  return `${amount.toLocaleString("en-US")} VND`;
};

export default {
  parseAmount,
  parseTransactionFromNotification,
  formatTransactionDisplay,
};
