import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../theme/ThemeProvider";
import { Transaction } from "../../types/transaction.types";
import { CATEGORY_ICONS_LIST } from "../../constants/categories";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const { theme } = useThemeMode();
  const isExpense = transaction.type === "EXPENSE";
  const categoryInfo =
    CATEGORY_ICONS_LIST[transaction.category.toLowerCase()] ||
    CATEGORY_ICONS_LIST.other;

  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(transaction.amount);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, { backgroundColor: theme.card }]}
    >
      <View style={styles.content}>
        <View
          style={[styles.iconBg, { backgroundColor: categoryInfo.color + "20" }]}
        >
          <Ionicons
            name={categoryInfo.icon as any}
            size={24}
            color={categoryInfo.color}
          />
        </View>

        <View style={styles.info}>
        
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.text }]}>
              {transaction.description ? transaction.description : transaction.category}
            </Text>
            {transaction.verified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#10B981"
                style={styles.verifiedIcon}
              />
            )}
          </View>
          <Text style={[styles.category, { color: theme.subtext }]}>
            {transaction.date}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text
          style={[
            styles.amount,
            {
              color: isExpense ? "#EF4444" : "#10B981",
            },
          ]}
        >
          {isExpense ? "-" : "+"}
          {formattedAmount}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: "400",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
  },
});
