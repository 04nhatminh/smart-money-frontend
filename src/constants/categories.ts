export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Clothing",
  "Utilities",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Investment",
  "Gift",
  "Other",
];

export const CATEGORY_ICONS: Record<string, any> = {
  Food: "restaurant-outline",
  Transportation: "car-outline",
  Clothing: "shirt-outline",
  Utilities: "flash-outline",
  Entertainment: "game-controller-outline",
  Health: "fitness-outline",
  Education: "school-outline",
  Salary: "wallet-outline",
  Bonus: "cash-outline",
  Investment: "trending-up-outline",
  Gift: "gift-outline",
  Other: "ellipsis-horizontal-outline",
};

export const CATEGORY_ENUM_MAP: Record<string, string> = {
  Food: "FOOD",
  Transportation: "TRANSPORTATION",
  Clothing: "CLOTHING",
  Utilities: "UTILITIES",
  Entertainment: "ENTERTAINMENT",
  Health: "HEALTH",
  Education: "EDUCATION",
  Shopping: "SHOPPING",
  Other: "OTHER",
};

export const CATEGORY_DISPLAY_MAP = Object.entries(CATEGORY_ENUM_MAP).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {} as Record<string, string>
);