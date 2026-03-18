import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import { t } from "../../src/i18n";

import { InputField } from "../../src/components/InputField";
import { ButtonSave } from "../../src/components/ButtonSave";
import { transactionStyles as styles } from "../../src/styles/transactionStyles";
import { CategoryPicker } from "../../src/components/transactions/CategoryPicker";
import TransactionAPI from "../../src/api/transaction.api";
import { CATEGORY_ENUM_MAP } from "../../src/constants/categories";
import { formatDateTime, formatTime, formatDateToDDMMYYYY } from "../../src/utils/dateFormatter";
import SuccessModal from "../../src/components/transactions/SuccessModal";
import ConfirmExitModal from "../../src/components/transactions/ConfirmExitModal";

export default function AddTransaction() {

    const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [description, setDescription] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [amountError, setAmountError] = useState("");
    const [categoryError, setCategoryError] = useState("");

    const handleSave = async () => {
        try {

            let valid = true;

            if (!amount) {
                setAmountError(t("transaction.amountRequired"));
                valid = false;
            } else if (isNaN(Number(amount))) {
                setAmountError(t("transaction.amountNumber"));
                valid = false;
            }
            else if (Number(amount) <= 0) {
                setAmountError(t("transaction.amountNumberPositive"));
                valid = false;
            }

            if (!category) {
                setCategoryError(t("transaction.categoryRequired"));
                valid = false;
            }

            if (!valid) return;

            await TransactionAPI.create({
            amount: Number(amount),
            category: CATEGORY_ENUM_MAP[category] || category,
            type,
            description,
            date: formatDateTime(date),
            });

            setShowSuccessModal(true);

        } catch (error) {
            console.log(error);
        }
    };
    
    const handleCancel = () => {
        if (hasChanges) {
            setShowExitModal(true);
        } else {
            router.back();
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Type Selector */}
            <View style={styles.typeRow}>
                <Pressable
                    style={[
                        styles.typeBtn,
                        type === "EXPENSE" && styles.expenseActive
                    ]}
                    onPress={() => setType("EXPENSE")}
                >
                    <Text style={styles.typeText}>{t("transaction.expense")}</Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.typeBtn,
                        type === "INCOME" && styles.incomeActive
                    ]}
                    onPress={() => setType("INCOME")}
                >
                    <Text style={styles.typeText}>{t("transaction.income")}</Text>
                </Pressable>

            </View>

            <View style={styles.form}>

                <Text 
                    style={styles.name}
                >
                    {t("transaction.amount")}
                </Text>

                <InputField
                    iconName="cash-outline"
                    placeholder={t("transaction.amount")}
                    value={amount}
                    onChangeText={(text) => {
                        setAmount(text);
                        setHasChanges(true);
                        setAmountError("");
                    }}
                    keyboardType="numeric"
                />
                {amountError ? <Text style={styles.errorText}>{amountError}</Text> : null}

                <Text 
                    style={styles.name}
                >
                    {t("transaction.category")}
                </Text>

                <CategoryPicker
                    type={type}
                    value={category}
                    onChange={(value) => {
                        setCategory(value);
                        setHasChanges(true);
                        setCategoryError("");
                    }}
                />
                {categoryError ? (
                    <Text style={styles.errorText}>{categoryError}</Text>
                    ) : null}

                <Text 
                    style={styles.name}
                >
                    {t("transaction.date")}
                </Text>

                <View style={styles.row}>

                    <Pressable
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text>{formatDateToDDMMYYYY(date)}</Text>
                    </Pressable>

                    <Pressable
                        style={styles.timeInput}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <Text>{formatTime(date)}</Text>
                    </Pressable>

                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {

                        if (event.type === "dismissed") {
                            setShowDatePicker(false);
                            return;
                        }

                        if (selectedDate) {
                            setDate(selectedDate);
                        }

                        setShowDatePicker(false);
                        }}
                    />
                    )}

                {showTimePicker && (
                    <DateTimePicker
                        value={date}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedTime) => {

                        if (event.type === "dismissed") {
                            setShowTimePicker(false);
                            return;
                        }

                        if (selectedTime) {

                            const newDate = new Date(date);

                            newDate.setHours(selectedTime.getHours());
                            newDate.setMinutes(selectedTime.getMinutes());

                            setDate(newDate);
                        }

                        setShowTimePicker(false);
                        }}
                    />
                )}

                <Text 
                    style={styles.name}
                >
                    {t("transaction.description")}
                </Text>

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
                        onPress={handleCancel}
                    />

                    <ButtonSave
                        label={t("common.save")}
                        variant="primary"
                        onPress={handleSave}
                    />
                </View>
            </View>
            <SuccessModal
                visible={showSuccessModal}
                onDone={() => {
                    setShowSuccessModal(false);
                    router.back();
                }}
                />

                <ConfirmExitModal
                    visible={showExitModal}
                    onCancel={() => setShowExitModal(false)}
                    onConfirm={() => router.back()}
                />
        </ScrollView>
        
    );
}
