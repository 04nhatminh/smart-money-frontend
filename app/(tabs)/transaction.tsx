import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import { BottomBar } from "../../src/components/BottomBar";
import { CameraModal } from "../../src/components/camera/CameraModal";
import { Receipt } from "../../src/components/camera/ReceiptPreview";
import { useTabNavigation } from "../../src/hooks/useTabNavigation";
import transactionApi, { CreateTransactionRequest } from "../../src/api/transaction.api";

const parseReceiptDate = (input: string): string => {
    // Input format: "28/02/2026"
    // Expected backend format: "dd/MM/yyyy HH:mm"
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
    
    if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        // Format as "dd/MM/yyyy HH:mm" with 00:00 as default time
        return `${day}/${month}/${year} 00:00`;
    }
    
    // Fallback: return today's date
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const mapReceiptToPayload = (receipt: Receipt): CreateTransactionRequest => {
    console.log("🔄 mapReceiptToPayload called with:", receipt);
    const transactionType = receipt.type === "Income" ? "INCOME" as const : "EXPENSE" as const;
    const payload: CreateTransactionRequest = {
        amount: receipt.amount,
        type: transactionType,
        category: receipt.category.toUpperCase(),
        description: receipt.description?.trim() || receipt.transactionName,
        date: parseReceiptDate(receipt.date),
    };
    console.log("✅ Payload mapped:", payload);
    return payload;
};

export default function TransactionListScreen() {
    const [cameraVisible, setCameraVisible] = useState(false);
    const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
    const navigation = useTabNavigation(() => setCameraVisible(true));

    const handleCreateTransaction = async (receipt: Receipt) => {
        console.log("🚀 handleCreateTransaction called");
        setIsCreatingTransaction(true);

        try {
            const payload = mapReceiptToPayload(receipt);
            console.log("📤 Creating transaction with payload:", JSON.stringify(payload, null, 2));
            
            const result = await transactionApi.createTransaction(payload);
            console.log("📥 API Response:", result);

            if (!result.success) {
                const errorMsg = result.message || "Tao giao dich that bai";
                console.error("❌ Transaction creation failed:", errorMsg);
                throw new Error(errorMsg);
            }

            console.log("✅ Transaction created successfully:", result.data);
            Alert.alert("Success", "Transaction created successfully");
        } catch (error: any) {
            const message = error?.message || "Failed to create transaction";
            console.error("❌ Error in handleCreateTransaction:", error);
            Alert.alert("Error", message);
            throw error;
        } finally {
            setIsCreatingTransaction(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>transaction list</Text>
                {isCreatingTransaction && (
                    <Text style={styles.loadingText}>Creating transaction...</Text>
                )}
            </View>

            <BottomBar
                active="transaction"
                handlers={navigation}
            />

            <CameraModal
                visible={cameraVisible}
                onClose={() => setCameraVisible(false)}
                onCaptureBill={handleCreateTransaction}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 16,
        color: "#000",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#666",
    },
});
