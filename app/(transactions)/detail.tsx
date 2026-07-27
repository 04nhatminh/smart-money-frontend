import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { t } from "../../src/i18n";
import { CATEGORY_ICONS_LIST } from "../../src/constants/categories";
import transactionApi from "../../src/api/transaction.api";
import { TransactionResponse } from "../../src/types/transaction.types";
import { transactionStyles as styles } from "../../src/styles/transactionStyles";
import { ButtonSave } from "../../src/components/ButtonSave";
import { EditTransactionModal } from "../../src/components/transactions/EditTransactionModal";
import { formatVND } from "../../src/utils/formatCurrency";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [transaction, setTransaction] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const categoryKey =
  transaction?.category?.toLowerCase?.() || "other";

  const categoryConfig = CATEGORY_ICONS_LIST[categoryKey] || CATEGORY_ICONS_LIST.other;

  const amountColor = transaction?.type === "EXPENSE" ? "#FF2E2E" : "#16A34A";

  const fetchTransaction = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const res = await transactionApi.getById(id);
      const data = res?.data ?? null;
      setTransaction(data);
    } catch (error) {
      console.log(error);
      Alert.alert(
        "Error",
        t("transaction.fetchTransactionFailed") || "Failed to load transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

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
              const res = await transactionApi.delete(transaction.id);

              if (!res.success) {
                const isProjectDeleted =
                  res.errorCode === "PROJECT_DELETED" ||
                  (/project/i.test(res.message ?? "") && /delet/i.test(res.message ?? ""));

                Alert.alert(
                  "Error",
                  isProjectDeleted
                    ? "Project has been deleted, so transactions can not be removed"
                    : res.message || t("transaction.deleteFailed") || "Failed to delete transaction"
                );
                return;
              }

              Alert.alert(
                t("common.success") || "Success",
                t("transaction.deleteSuccess") || "Transaction deleted successfully"
              );

              router.back();
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
    <SafeAreaView style={{ flex: 1 }}>
      
      {loading ? (
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator size="large" color="#3629B7" />
          <Text style={{ marginTop: 12 }}>{t("common.loading")}</Text>
        </View>
      ) : !transaction ? (
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <Text> "Transaction not found"</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: `${categoryConfig.color}22` },
              ]}
            >
              <Ionicons
                name={categoryConfig.icon as any}
                size={18}
                color={categoryConfig.color}
              />
            </View>

            <View style={styles.summaryTextWrap}>
              <Text style={styles.titleDetail} numberOfLines={1}>
                {t(`transaction.${categoryKey}`) || categoryKey}
              </Text>

              <Text style={[styles.amountDetail, { color: amountColor }]} numberOfLines={1}>
                {transaction.type === "EXPENSE" ? "-" : "+"}
                {formatVND(Number(transaction.amount))}
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
              onPress={() => setShowEditModal(true)}
              customStyle={{ marginRight: 10 }}
            />

            <ButtonSave
              label={isDeleting ? (t("common.deleting") || "Deleting...") : t("common.delete")}
              variant="danger"
              onPress={handleDelete}
              customStyle={{ marginLeft: 10 }}
            />
          </View>

          <EditTransactionModal
            visible={showEditModal}
            transactionId={transaction?.id}
            onClose={() => setShowEditModal(false)}
            onSaved={() => {
              setShowEditModal(false);
              fetchTransaction();
            }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
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