export const EXPENSE_CATEGORIES = [
  "food",
  "transportation",
  "clothing",
  "utilities",
  "entertainment",
  "health",
  "education",
  "other",
];

export const INCOME_CATEGORIES = [
  "salary",
  "bonus",
  "investment",
  "gift",
  "other",
];

export const CATEGORY_ICONS: Record<string, any> = {
  food: "restaurant-outline",
  transportation: "car-outline",
  clothing: "shirt-outline",
  utilities: "flash-outline",
  entertainment: "game-controller-outline",
  health: "fitness-outline",
  education: "school-outline",
  salary: "wallet-outline",
  bonus: "cash-outline",
  investment: "trending-up-outline",
  gift: "gift-outline",
  other: "ellipsis-horizontal-outline",
};

export const CATEGORY_ENUM_MAP: Record<string, string> = {
  food: "FOOD",
  transportation: "TRANSPORTATION",
  clothing: "CLOTHING",
  utilities: "UTILITIES",
  entertainment: "ENTERTAINMENT",
  health: "HEALTH",
  education: "EDUCATION",
  shopping: "SHOPPING",
  other: "OTHER",
};

export const CATEGORY_DISPLAY_MAP = Object.entries(CATEGORY_ENUM_MAP).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {} as Record<string, string>
);