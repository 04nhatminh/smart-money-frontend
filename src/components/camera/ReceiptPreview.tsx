import React, { useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../theme/ThemeProvider";

export interface Receipt {
  type: "Expense" | "Income";
  transactionName: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

type Props = {
  imageUri: string;
  onCancel: () => void;
  onConfirm: (receipt: Receipt) => void;
};

// Mock receipt data (simulating OCR extraction from image)
const MOCK_RECEIPT: Receipt = {
  type: "Expense",
  transactionName: "Breakfast",
  amount: 40.0,
  category: "Food",
  date: "28/02/2026",
  description: "Eat Pho",
};

export function ReceiptPreview({ imageUri, onCancel, onConfirm }: Props) {
  const { theme } = useThemeMode();
  const [receipt, setReceipt] = useState<Receipt>(MOCK_RECEIPT);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    onConfirm(receipt);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Scan Receipt</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload Receipt Section */}
        <View style={[styles.uploadSection, { backgroundColor: theme.card }]}>
          <Ionicons name="document-outline" size={48} color={theme.primary} />
          <Text style={[styles.uploadTitle, { color: theme.text }]}>
            Upload receipt
          </Text>
          <Text style={[styles.uploadDesc, { color: theme.subtext }]}>
            Upload image or capture receipt
          </Text>
        </View>

        {/* Receipt Details */}
        <View style={[styles.detailsSection, { backgroundColor: theme.card }]}>
          {/* Type */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Type:
            </Text>
            <View style={styles.detailValueRow}>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      receipt.type === "Expense"
                        ? theme.primary
                        : "#10b981",
                    backgroundColor:
                      receipt.type === "Expense"
                        ? `${theme.primary}15`
                        : `#10b98115`,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  },
                ]}
              >
                {receipt.type}
              </Text>
              {!isEditing && (
                <Pressable onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={16} color={theme.primary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Transaction Name */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Transaction Name:
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {receipt.transactionName}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Amount:
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {receipt.amount.toFixed(3)} VND
            </Text>
          </View>

          {/* Category */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Category:
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {receipt.category}
            </Text>
          </View>

          {/* Date */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Date:
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {receipt.date}
            </Text>
          </View>

          {/* Description */}
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Description:
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {receipt.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <Pressable
          onPress={handleConfirm}
          style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.confirmBtnText}>Confirm</Text>
        </Pressable>

        <Pressable onPress={onCancel} style={styles.cancelBtn}>
          <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  uploadSection: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  uploadDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  detailsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(200, 200, 200, 0.2)",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(200, 200, 200, 0.1)",
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
