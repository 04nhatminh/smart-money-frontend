import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CATEGORY_ICONS } from "../../src/constants/categories";
import { Ionicons } from "@expo/vector-icons";

import { TransactionAPI } from "../../src/api/transaction.api";
import { Transaction } from "../../src/types/transaction.types"
import { transactionStyles as styles } from "../../src/styles/transactionStyles";
import { ButtonSave } from "../../src/components/ButtonSave";

export default function TransactionDetail() {

    const { id } = useLocalSearchParams();

    const [transaction, setTransaction] = useState<Transaction | null>(null);

    const fetchTransaction = async () => {
        try {
            const res = await TransactionAPI.getById(id as string);
            setTransaction(res.data.data);
        }
        catch (error) {
            console.log(error);
        }   
    };

    useEffect(() => {
        fetchTransaction();
    }, []);

    if (!transaction) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }   

    const isExpense = transaction.type === "EXPENSE";

    return (
        <View style={styles.container}>

            {/* Amount Section */}
            <View style={styles.amountSection}>
                <Ionicons
                    name="wallet-outline"
                    size={36}
                    color="#3629B7"
                />

                <Text style={[styles.amount,
                    isExpense ? styles.expense : styles.income
                ]}>
                    {isExpense ? "-" : "+"}{transaction.amount.toLocaleString()} đ
                </Text>

                <Text style={styles.category}>
                    <Ionicons
                        name={CATEGORY_ICONS[transaction.category] || "pricetag-outline"}
                        size={20}
                    />
                    {transaction.category}
                </Text>
            </View>

            {/* Details Card */}
            <View style={styles.card}>
                <Row label="Description" value={transaction.description || "No description"} />
                <Row label="Date" value={new Date(transaction.date).toLocaleString()} />
                <Row label="Type" value={transaction.type} />
                <Row label="Description" value={transaction.description || "No description"} />
            </View>

            {/* Actions */}
            <View style={styles.actions}>

                <ButtonSave
                    label="Edit"
                    variant="secondary"
                    onPress={() => router.push({
                        pathname: "/editTransaction",
                        params: { id: transaction.id }
                    })}
                    customStyle= { { marginRight: 10 } }
                />

                <ButtonSave
                    label="Delete"
                    variant="danger"
                    onPress={() => {
                        // Handle delete action
                    }}
                    customStyle= { { marginLeft: 10 } }
            
                />
            </View>
        </View>
    );
}

const Row = ({ label, value }: any) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);
