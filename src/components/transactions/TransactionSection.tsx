import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { TransactionItem } from "./TransactionItem";
import { TransactionResponse } from "../../types/transaction.types";
import { useThemeMode } from "../../theme/ThemeProvider";

interface TransactionSectionProps {
  title: string;
  transactions: TransactionResponse[];
  onTransactionPress?: (transaction: TransactionResponse) => void;
}

export const TransactionSection: React.FC<TransactionSectionProps> = ({
  title,
  transactions,
  onTransactionPress,
}) => {
  const { theme } = useThemeMode();

  if (transactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.subtext }]}>
        {title}
      </Text>
      <View style={styles.transactionsList}>
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onPress={() => onTransactionPress?.(transaction)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  transactionsList: {
    gap: 0,
  },
});
