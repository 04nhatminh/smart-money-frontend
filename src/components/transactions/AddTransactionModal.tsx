import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { t } from "../../i18n";

import { InputField } from "../InputField";
import { ButtonSave } from "../ButtonSave";
import { useTransactionStyles } from "../../styles/transactionStyles";
import { CategoryPicker } from "./CategoryPicker";
import { CATEGORY_ENUM_MAP } from "../../constants/categories";
import {
  formatDateTime,
  formatTime,
  formatDateToDDMMYYYY,
} from "../../utils/dateFormatter";
import { formatNumber } from "../../utils/formatCurrency";
import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";
import { useCreateTransaction } from "../../hooks/useCreateTransaction";

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface FormErrors {
  amount?: string;
  category?: string;
}

export function AddTransactionModal({
  visible,
  onClose,
  onSaved,
}: AddTransactionModalProps) {
  const { createManualTransaction } = useCreateTransaction();
  const { styles, theme } = useTransactionStyles();

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
  const [isSaving, setIsSaving] = useState(false);
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
    setIsSaving(false);
    setErrors({});
  };

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const numericAmount = parseAmount(amount);

    if (!amount.trim()) {
      nextErrors.amount = t("transaction.amountRequired");
    } else if (isNaN(numericAmount)) {
      nextErrors.amount = t("transaction.amountNumber");
    } else if (numericAmount <= 0) {
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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      await createManualTransaction({
        amount: parseAmount(amount),
        category: CATEGORY_ENUM_MAP[category] || category,
        type,
        description: description.trim(),
        date: formatDateTime(date),
      });

      setShowSuccessModal(true);
    } catch (error) {
      console.log("AddTransactionModal handleSave error:", error);
    } finally {
      setIsSaving(false);
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

  const parseAmount = (value: string): number => {
    return Number(value.replace(/[,.]/g, ""));
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
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
          >
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                marginTop: 20,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 8,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 25, fontWeight: "700", color: theme.text }}>
                {t("transaction.addTitle")}
              </Text>

            </View>

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
                  const numericValue = text.replace(/\D/g, "");

                  setAmount(
                    numericValue ? formatNumber(Number(numericValue)) : ""
                  );

                  setHasChanges(true);
                  setErrors((prev) => ({
                    ...prev,
                    amount: undefined,
                  }));
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
                onChange={(value) => {
                  setCategory(value);
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
                  label={t("common.save")}
                  variant="primary"
                  onPress={handleSave}
                  disabled={isSaving}
                />
              </View>

              {isSaving ? (
                <View style={{ marginTop: 12, alignItems: "center" }}>
                  <ActivityIndicator size="small" />
                </View>
              ) : null}
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <SuccessModal
        visible={showSuccessModal}
        onDone={() => {
          setShowSuccessModal(false);
          onSaved?.();
          onClose();
        }}
        title={t("transaction.saveSuccess")}
        description={t("transaction.saveSuccessDesc")}
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