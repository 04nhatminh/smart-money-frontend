import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { CATEGORY_DISPLAY_MAP, CATEGORY_ICONS } from "../../constants/categories";
import transactionApi from "../../api/transaction.api";
import { TransactionResponse } from "../../types/transaction.types";
import { transactionStyles as styles } from "../../styles/transactionStyles";
import { ButtonSave } from "../ButtonSave";

interface TransactionDetailModalProps {
  visible: boolean;
  transactionId?: string | null;
  onClose: () => void;
  onEdit?: (transaction: TransactionResponse) => void;
  onDeleted?: (transactionId: string) => void;
}

export function TransactionDetailModal({
  visible,
  transactionId,
  onClose,
  onEdit,
  onDeleted,
}: TransactionDetailModalProps) {
  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTransaction = async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      const res = await transactionApi.getById(transactionId);

      const data = res?.data ?? res?.data ?? null;
      setTransaction(data);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", t("transaction.fetchTransactionFailed") || "Failed to load transaction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && transactionId) {
      fetchTransaction();
    }

    if (!visible) {
      setTransaction(null);
      setLoading(false);
      setIsDeleting(false);
    }
  }, [visible, transactionId]);

  const handleDelete = async () => {
    if (!transaction?.id) return;

    Alert.alert(
      t("common.confirm") || "Confirm",
      t("transaction.confirmDelete") || "Are you sure you want to delete this transaction?",
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await transactionApi.delete(transaction.id);

              Alert.alert(
                t("common.success") || "Success",
                t("transaction.deleteSuccess") || "Transaction deleted successfully"
              );

              onDeleted?.(transaction.id);
              onClose();
            } catch (error) {
              console.log(error);
              Alert.alert(
                "Error",
                t("transaction.deleteFailed") || "Failed to delete transaction"
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isExpense = transaction?.type === "EXPENSE";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700" }}>
            {t("transaction.transactionDetail") || "Transaction Detail"}
          </Text>

          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {t("common.close")}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
            <ActivityIndicator size="large" color="#3629B7" />
            <Text style={{ marginTop: 12 }}>{t("common.loading")}</Text>
          </View>
        ) : !transaction ? (
          <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
            <Text>{t("transaction.noTransactionFound") || "Transaction not found"}</Text>
          </View>
        ) : (
          <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.amountSection}>
              <Ionicons
                name="wallet-outline"
                size={36}
                color="#3629B7"
              />

              <Text
                style={[
                  styles.amount,
                  isExpense ? styles.expense : styles.income,
                ]}
              >
                {isExpense ? "-" : "+"}
                {transaction.amount.toLocaleString()} đ
              </Text>

              <View style={styles.category}>
                <Ionicons
                  name={CATEGORY_ICONS[transaction.category] || "pricetag-outline"}
                  size={20}
                  style={{ marginRight: 5 }}
                />
                <Text>
                  {t(`transaction.${CATEGORY_DISPLAY_MAP[transaction.category]}`)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Row
                label={t("transaction.date") || "Date"}
                value={transaction.date}
              />
              <Row
                label={t("transaction.type") || "Type"}
                value={t(`transaction.${transaction.type.toLowerCase()}`)}
              />
              <Row
                label={t("transaction.description") || "Description"}
                value={transaction.description || t("transaction.noDescription")}
              />
            </View>

            <View style={styles.actions}>
              <ButtonSave
                label={t("common.edit")}
                variant="secondary"
                onPress={() => onEdit?.(transaction)}
                customStyle={{ marginRight: 10 }}
              />

              <ButtonSave
                label={isDeleting ? (t("common.deleting") || "Deleting...") : t("common.delete")}
                variant="danger"
                onPress={handleDelete}
                customStyle={{ marginLeft: 10 }}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const Row = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);