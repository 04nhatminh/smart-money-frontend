import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';

import { InputField } from "../../src/components/InputField";
import { ButtonSave } from "../../src/components/ButtonSave";
import { transactionStyles as styles } from "../../src/styles/transactionStyles";
import { CategoryPicker } from "../../src/components/transactions/CategoryPicker";
import { TransactionAPI } from "../../src/api/transaction.api";
import { CATEGORY_ENUM_MAP, CATEGORY_DISPLAY_MAP } from "../../src/constants/categories";
import { formatDateTime, formatTime, formatDateToDDMMYYYY } from "../../src/utils/dateFormatter";
import SuccessModal from "../../src/components/transactions/SuccessModal";
import ConfirmExitModal from "../../src/components/transactions/ConfirmExitModal";

export default function EditTransaction() {
    
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(false);

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

    // --- Fetch transaction details by ID and populate state ---
    
    const fetchTransaction = async () => {
        try {
            const res = await TransactionAPI.getById(id as string);

            const transaction = res.data.data;
            console.log("Fetched transaction:", transaction);

            setType(transaction.type);
            setAmount(transaction.amount.toString());
           
            setDescription(transaction.description || "");
            setDate(new Date(transaction.date));

            const displayName = CATEGORY_DISPLAY_MAP[transaction.category];
            setCategory(displayName);

            const [d, m, yAndTime] = transaction.date.split("/");
            const [y, time] = yAndTime.split(" ");

            console.log(d, m, y, time);
            setDate(new Date(`${y}-${m}-${d}T${time}`));
            
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchTransaction();
    }, [id]);

    const handleUpdate = async () => {
        try {

            let valid = true;

            if (!amount) {
                setAmountError("Amount is required");
                valid = false;
            } else if (isNaN(Number(amount))) {
                setAmountError("Amount must be a number");
                valid = false;
            }

            if (!category) {
                setCategoryError("Please select a category");
                valid = false;
            }

            if (!valid) return;

            await TransactionAPI.update(id as string, {
            amount: Number(amount),
            category: CATEGORY_ENUM_MAP[category] || category,
            type,
            description,
            date: formatDateTime(date),
            });

            setShowSuccessModal(true);

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
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
                    <Text style={styles.typeText}>Expense</Text>
                </Pressable>

                <Pressable
                    style={[
                        styles.typeBtn,
                        type === "INCOME" && styles.incomeActive
                    ]}
                    onPress={() => setType("INCOME")}
                >
                    <Text style={styles.typeText}>Income</Text>
                </Pressable>

            </View>

            <View style={styles.form}>

                <Text 
                    style={styles.name}
                >
                    Amount
                </Text>

                <InputField
                    iconName="cash-outline"
                    placeholder="Amount"
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
                    Category
                </Text>

                <CategoryPicker
                    type={type}
                    value={category}
                    onChange={(text) => {
                        setCategory(text);
                        setHasChanges(true);
                        setCategoryError("");
                    }}
                />

                <Text 
                    style={styles.name}
                >
                    Date
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
                    Description
                </Text>

                <InputField
                    iconName="document-text-outline"
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                />

                <View style={styles.buttonRow}>
                    
                    <ButtonSave
                        label="Cancel"
                        variant="secondary"
                        onPress={handleCancel}
                    />

                    <ButtonSave
                        label="Save"
                        variant="primary"
                        onPress={handleUpdate}
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
