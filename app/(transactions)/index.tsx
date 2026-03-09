import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable
} from "react-native";

import { TransactionAPI } from "../../src/api/transaction.api";
import { Transaction } from "../../src/types/transaction.types";

export default function TransactionList() {

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
  try {

    const res = await TransactionAPI.getAll();

    setTransactions(res.data.data.transactions);

  } catch (error) {
    console.log(error);
  } finally {
    setLoading(false);
  }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3629B7" />
      </View>
    );
  }

  console.log(transactions);

  return (
    <View style={styles.container}>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>

            <View style={styles.left}>
              <Text style={styles.category}>{item.category}</Text>
            </View>

            <View style={styles.right}>
              <Text
                style={[
                  styles.amount,
                  item.type === "EXPENSE"
                    ? styles.expense
                    : styles.income
                ]}
              >
                {item.type === "EXPENSE" ? "-" : "+"}
                {item.amount.toLocaleString()}
              </Text>

              <Text style={styles.date}>{item.date}</Text>

              <Pressable
                style={styles.editBtn}
                onPress={() =>
                  router.push({
                    pathname: "/editTransaction",
                    params: { id: item.id }
                  })
                }
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color="#3629B7"
                />
              </Pressable>
            </View>

          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    padding: 16,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  left: {
    flex: 1,
  },

  right: {
    alignItems: "flex-end",
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  category: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },

  amount: {
    fontSize: 16,
    fontWeight: "600",
  },

  expense: {
    color: "#FF4D6D",
  },

  income: {
    color: "#2ECC71",
  },

  date: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  editBtn: {
    marginTop: 6,
    padding: 4,
  }

});