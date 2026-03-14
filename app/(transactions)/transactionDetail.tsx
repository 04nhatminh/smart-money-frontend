import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CATEGORY_DISPLAY_MAP, CATEGORY_ICONS } from "../../src/constants/categories";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../src/i18n";

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
                <Text>{t("common.loading")}</Text>
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
                
                <View style={styles.category}>
                    <Ionicons
                        name={CATEGORY_ICONS[transaction.category] || "pricetag-outline"}
                        size={20}
                        style={{ marginRight: 5 }}
                    />
                    <Text >
                        {t(`category.${CATEGORY_DISPLAY_MAP[transaction.category]}`)}
                    </Text>
                </View>
            </View>

            {/* Details Card */}
            <View style={styles.card}>
                <Row label="Date" value={transaction.date} />
                <Row label="Type" value={t(`transaction.${transaction.type.toLowerCase()}`)} />
                <Row label="Description" value={transaction.description || t("transaction.noDescription")} />
            </View>

            {/* Actions */}
            <View style={styles.actions}>

                <ButtonSave
                    label={t("common.edit")}
                    variant="secondary"
                    onPress={() => router.push({
                        pathname: "/editTransaction",
                        params: { id: transaction.id }
                    })}
                    customStyle= { { marginRight: 10 } }
                />

                <ButtonSave
                    label={t("common.delete")}
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
