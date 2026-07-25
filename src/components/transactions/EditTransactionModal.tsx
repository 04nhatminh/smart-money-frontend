import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { t } from "../../i18n";

import { InputField } from "../InputField";
import { ButtonSave } from "../ButtonSave";
import { useTransactionStyles } from "../../styles/transactionStyles";
import { CategoryPicker } from "./CategoryPicker";
import transactionApi from "../../api/transaction.api";
import {
  CATEGORY_ENUM_MAP,
  CATEGORY_DISPLAY_MAP,
} from "../../constants/categories";
import {
  formatDateTime,
  formatTime,
  formatDateToDDMMYYYY,
  parseDDMMYYYYHHMM,
} from "../../utils/dateFormatter";
import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";
import { Ionicons } from "@expo/vector-icons";

interface EditTransactionModalProps {
  visible: boolean;
  transactionId?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

interface FormErrors {
  amount?: string;
  category?: string;
}

export function EditTransactionModal({
  visible,
  transactionId,
  onClose,
  onSaved,
}: EditTransactionModalProps) {
  const { styles, theme } = useTransactionStyles();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const resetForm = () => {
    setType("EXPENSE");
    setAmount("");
    setCategory("");
    setDate(new Date());
    setDescription("");
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowSuccessModal(false);
    setShowExitModal(false);
    setHasChanges(false);
    setErrors({});
    setLoading(false);
    setSaving(false);
  };

  const fetchTransaction = async () => {
    if (!transactionId) return;

    try {
      setLoading(true);

      const res = await transactionApi.getById(transactionId);
      const transaction = res?.data ?? res?.data;

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      setType(transaction.type);
      setAmount(String(transaction.amount));
      setDescription(transaction.description || "");

      const displayName =
        CATEGORY_DISPLAY_MAP[transaction.category] || transaction.category;
      setCategory(displayName);

      const parsedDate = parseDDMMYYYYHHMM(transaction.date);
      setDate(parsedDate);

      setHasChanges(false);
      setErrors({});
    } catch (error) {
      console.log("fetchTransaction error:", error);
      Alert.alert(
        "Error",
        t("transaction.fetchTransactionFailed") || "Failed to load transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && transactionId) {
      fetchTransaction();
    }

    if (!visible) {
      resetForm();
    }
  }, [visible, transactionId]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!amount.trim()) {
      nextErrors.amount = t("transaction.amountRequired");
    } else if (isNaN(Number(amount))) {
      nextErrors.amount = t("transaction.amountNumber");
    } else if (Number(amount) <= 0) {
      nextErrors.amount = t("transaction.amountNumberPositive");
    }

    if (!category.trim()) {
      nextErrors.category = t("transaction.categoryRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRequestClose = () => {
    if (hasChanges) {
      setShowExitModal(true);
      return;
    }
    onClose();
  };

  const handleConfirmClose = () => {
    setShowExitModal(false);
    onClose();
  };

  const handleUpdate = async () => {
    if (!transactionId) return;
    if (!validateForm()) return;

    try {
      setSaving(true);

      await transactionApi.update(transactionId, {
        amount: Number(amount),
        category: CATEGORY_ENUM_MAP[category] || category,
        type,
        description: description.trim(),
        date: formatDateTime(date),
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.log("handleUpdate error:", error);
      Alert.alert(
        "Error",
        t("transaction.updateFailed") || "Failed to update transaction"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
      setHasChanges(true);
    }

    setShowDatePicker(false);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }

    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      setDate(newDate);
      setHasChanges(true);
    }

    setShowTimePicker(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleRequestClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                paddingHorizontal: 16,
                padding: 30,
                paddingBottom: 8,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 25, fontWeight: "700", marginBottom: 4, color: theme.text }}>
                {t("transaction.editTitle")}
              </Text>

              <Pressable onPress={handleRequestClose}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {loading ? (
              <View
                style={{
                  paddingTop: 40,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ marginTop: 12, color: theme.text }}>{t("common.loading")}</Text>
              </View>
            ) : (
              <>
                <View style={styles.typeRow}>
                  <Pressable
                    style={[
                      styles.typeBtn,
                      type === "EXPENSE" && styles.expenseActive,
                    ]}
                    onPress={() => {
                      setType("EXPENSE");
                      setHasChanges(true);
                    }}
                  >
                    <Text style={[styles.typeText, type === "EXPENSE" && styles.typeTextActive]}>
                      {t("transaction.expense")}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.typeBtn,
                      type === "INCOME" && styles.incomeActive,
                    ]}
                    onPress={() => {
                      setType("INCOME");
                      setHasChanges(true);
                    }}
                  >
                    <Text style={[styles.typeText, type === "INCOME" && styles.typeTextActive]}>
                      {t("transaction.income")}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.form}>
                  <Text style={styles.name}>{t("transaction.amount")}</Text>

                  <InputField
                    iconName="cash-outline"
                    placeholder={t("transaction.amount")}
                    value={amount}
                    onChangeText={(text) => {
                      setAmount(text);
                      setHasChanges(true);
                      setErrors((prev) => ({ ...prev, amount: undefined }));
                    }}
                    keyboardType="numeric"
                  />
                  {errors.amount ? (
                    <Text style={styles.errorText}>{errors.amount}</Text>
                  ) : null}

                  <Text style={styles.name}>{t("transaction.category")}</Text>

                  <CategoryPicker
                    type={type}
                    value={category}
                    onChange={(text) => {
                      setCategory(text);
                      setHasChanges(true);
                      setErrors((prev) => ({ ...prev, category: undefined }));
                    }}
                  />
                  {errors.category ? (
                    <Text style={styles.errorText}>{errors.category}</Text>
                  ) : null}

                  <Text style={styles.name}>{t("transaction.date")}</Text>

                  <View style={styles.row}>
                    <Pressable
                      style={styles.dateInput}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dateText}>{formatDateToDDMMYYYY(date)}</Text>
                    </Pressable>

                    <Pressable
                      style={styles.timeInput}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.dateText}>{formatTime(date)}</Text>
                    </Pressable>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      is24Hour
                      display="default"
                      onChange={handleDateChange}
                    />
                  )}

                  {showTimePicker && (
                    <DateTimePicker
                      value={date}
                      mode="time"
                      is24Hour
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}

                  <Text style={styles.name}>{t("transaction.description")}</Text>

                  <InputField
                    iconName="document-text-outline"
                    placeholder={t("transaction.description")}
                    value={description}
                    onChangeText={(text) => {
                      setDescription(text);
                      setHasChanges(true);
                    }}
                  />

                  <View style={styles.buttonRow}>
                    <ButtonSave
                      label={t("common.cancel")}
                      variant="secondary"
                      onPress={handleRequestClose}
                    />

                    <ButtonSave
                      label={saving ? (t("common.saving") || "Saving...") : t("common.save")}
                      variant="primary"
                      onPress={handleUpdate}
                      disabled={saving}
                    />
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        onDone={() => {
          setShowSuccessModal(false);
          onSaved?.();
          onClose();
        }}
        title={t("transaction.updateSuccess")}
        description={t("transaction.updateSuccessDesc")}
        buttonText={t("common.done")}
      />

      <ConfirmExitModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={handleConfirmClose}
        title={t("transaction.confirmExit")}
        description={t("transaction.confirmExitDesc")}
        cancelText={t("common.cancel")}
        confirmText={t("common.continue")}
      />
    </>
  );
}