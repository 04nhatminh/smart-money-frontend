import React, { useState, useEffect } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
  ScrollView,
  TextInput,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from '@expo/vector-icons/AntDesign';
import { useThemeMode } from "../../../theme/ThemeProvider";
import { ActionButton } from "../../ActionButton";
import { t } from "../../../i18n";
import { SubmitButton } from "../../SubmitButton";
import { Receipt } from "../../../types/transaction.types";

type Props = {
  imageUri: string;
  receipt?: Receipt | null; // 👈 thêm
  onCancel: () => void;
  onRetakePhoto: () => void;
  onConfirm: (receipt: Receipt) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export function ReceiptPreview({
  imageUri,
  receipt: receiptProp,
  onCancel,
  onRetakePhoto,
  onConfirm,
  isSubmitting = false,
  errorMessage,
}: Props) {
  const { theme, mode } = useThemeMode();
  // Theme "green" co token card mau xanh dam (danh cho accent) nen surface dung trang.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (receiptProp) {
      setReceipt(receiptProp);
    }
  }, [receiptProp]);

  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    if (!receipt) return;

    console.log("📝 Confirm:", receipt);
    onConfirm(receipt); // ✅ FIX
  };

  const updateReceipt = (field: keyof Receipt, value: any) => {
    setReceipt(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        [field]:
          field === "amount"
            ? Number(value) || 0
            : value,
      };
    });
  };

  if (!receipt) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: theme.text }}>
            {t("transaction.ai_processing")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t("camera.scan_receipt")}</Text>
        <Pressable 
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          <Ionicons 
            name={isEditing ? "checkmark-done" : "create"} 
            size={20} 
            color={theme.primary}
          />
          <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
            {isEditing ? "Done" : "Edit"}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload Receipt Section */}

      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.receiptImage}
          resizeMode="contain"
        />
      ) : (
        <Pressable 
          onPress={onRetakePhoto}
          style={[styles.uploadSection, { backgroundColor: surface }]}
        >
          <AntDesign name="scan" size={24} color="black" />
          <Text style={[styles.uploadTitle, { color: theme.text }]}>
            {t("camera.upload_again")}
          </Text>
          <Text style={[styles.uploadDesc, { color: theme.subtext }]}>
            {t("camera.upload_image_or_capture")}
          </Text>
        </Pressable>
      )}
      
        {/* Receipt Details */}
        <View style={[styles.detailsSection, { backgroundColor: surface }]}>
          {/* Type */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              {t("camera.type")}
            </Text>
            {isEditing ? (
              <View style={styles.typeSelector}>
                {(['EXPENSE', 'INCOME'] as const).map(type => (
                  <Pressable
                    key={type}
                    onPress={() => updateReceipt('type', type)}
                    style={[
                      styles.typeOption,
                      receipt.type === type && {
                        backgroundColor: type === "EXPENSE" ? "#ef4444" : "#10b981",
                      }
                    ]}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      receipt.type === type && styles.typeOptionTextActive
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      receipt.type === "EXPENSE"
                        ? "#ef4444"
                        : "#10b981",
                    backgroundColor:
                      receipt.type === "EXPENSE"
                        ? "#ef444415"
                        : "#10b98115",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  },
                ]}
              >
                {receipt.type}
              </Text>
            )}
          </View>

          {/* Transaction Name */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              {t("camera.transaction_name")}
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={receipt.transactionName}
                onChangeText={(text) => updateReceipt('transactionName', text)}
                placeholder="Transaction name"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {receipt.transactionName}
              </Text>
            )}
          </View>

          {/* Amount */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              {t("camera.amount")}
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={String(receipt.amount)}
                onChangeText={(text) => updateReceipt('amount', text)}
                placeholder="0.000"
                placeholderTextColor={theme.subtext}
                keyboardType="decimal-pad"
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {receipt.amount.toFixed(3)} VND
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              {t("camera.category")}
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={receipt.category}
                onChangeText={(text) => updateReceipt('category', text)}
                placeholder="Category"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {receipt.category}
              </Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              {t("camera.date")}
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={receipt.date}
                onChangeText={(text) => updateReceipt('date', text)}
                placeholder="dd/MM/yyyy"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {receipt.date}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              {t("camera.description")}
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={receipt.description}
                onChangeText={(text) => updateReceipt('description', text)}
                placeholder="Description"
                placeholderTextColor={theme.subtext}
                multiline={true}
                numberOfLines={2}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {receipt.description}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {!!errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <SubmitButton
          label={t("camera.confirm")}
          onPress={handleConfirm}
          loading={isSubmitting}
          loadingText="Creating..."
        />

        <ActionButton 
          label={t("camera.cancel")}
          onPress={onCancel}
          variant="secondary"
          color={theme.text}
          borderColor={theme.border}
          disabled={isSubmitting}
        />
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
    justifyContent: "space-between",
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  receiptImage: {
    width: "100%",
    height: 200,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(54, 41, 183, 0.1)",
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  editInput: {
    flex: 1,
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  typeOptionTextActive: {
    color: "#FFFFFF",
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    paddingTop: 20,
    gap: 12,
    flexDirection: "column",
    width: "100%",
    minHeight: 150,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    textAlign: "center",
  },
});
