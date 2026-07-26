import React, { useEffect, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../../theme/ThemeProvider";
import { ActionButton } from "../../ActionButton";
import { t } from "../../../i18n";
import { SubmitButton } from "../../SubmitButton";
import { TransactionRequest } from "../../../types/transaction.types";

type Props = {
  audioUri: string;
  transaction: TransactionRequest | null;
  onCancel: () => void;
  onRetakeAudio: () => void;
  onConfirm: (transaction: TransactionRequest) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

// Mock voice input data
const MOCK_VOICE_TRANSACTION: TransactionRequest = {
  type: "EXPENSE",
  amount: 40000,
  category: "Food",
  date: "28/02/2026 20:10",
  description: "Eat Pho",
};

export function VoiceInput({
  audioUri,
  transaction: transactionProp,
  onCancel,
  onRetakeAudio,
  onConfirm,
  isSubmitting = false,
  errorMessage,
}: Props) {
  const { theme, mode } = useThemeMode();
  // Theme "green" co token card mau xanh dam (danh cho accent) nen surface dung trang.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;
  const [transaction, setTransaction] = useState<TransactionRequest>(MOCK_VOICE_TRANSACTION);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (transactionProp) {
      setTransaction(transactionProp);
    }
  }, [transactionProp]);

  const handleConfirm = () => {
    console.log("🎤 VoiceInput.handleConfirm called");
    console.log("📊 Transaction data:", transaction);
    onConfirm(transaction);
  };

  const updateTransaction = (field: keyof TransactionRequest, value: any) => {
    setTransaction(prev => ({
      ...prev,
      [field]: field === 'amount' ? parseFloat(value) || 0 : value,
    }));
  }

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            AI is processing your recording...
          </Text>
          <Text style={[styles.loadingSubtext, { color: theme.subtext }]}>
            Please wait a moment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Voice Input</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Microphone Section */}
        
          <Pressable 
            style={[styles.micCard, { backgroundColor: surface }]}
            onPress={onRetakeAudio}
          >
            <Ionicons name="mic-circle-outline" size={64} color={theme.primary}
            />
            <Text style={[styles.micTitle, { color: theme.text }]}>
              Tap the microphone and speak
            </Text>
          </Pressable>
          
        {/* Transaction Details */}
        <View style={[styles.detailsCard, { backgroundColor: surface }]}>
          {/* Type */}
          <View style={styles.detailsHeader}>
            <View />
            <Pressable
              onPress={() => setIsEditing((prev) => !prev)}
              style={styles.editButton}
            >
              <Ionicons
                name={isEditing ? "checkmark-done" : "create-outline"}
                size={22}
                color={theme.text}
              />
            </Pressable>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.subtext }]}>
              Type:
            </Text>
            {isEditing ? (
              <View style={styles.typeSelector}>
                {(['EXPENSE', 'INCOME'] as const).map(type => (
                  <Pressable
                    key={type}
                    onPress={() => updateTransaction('type', type)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: 
                          transaction.type === type ? 
                             type === "EXPENSE" ? "#FCA5A5" : "#86EFAC" :  theme.inputBg 
                      },
                    ]}
                  >
                    <Text style={[
                      styles.typeChipText,
                      {
                          color:
                            transaction.type === type
                              ? type === "EXPENSE"
                                ? "#991B1B"
                                : "#166534"
                              : theme.subtext,
                        },
                    ]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      transaction.type === "EXPENSE"
                        ? "#FCA5A5"
                        : "#86EFAC",
                  }
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        transaction.type === "EXPENSE"
                          ? "#FF383C"
                          : "#166534",
                  },
                  ]}
                >
                  {transaction.type}
                </Text>
              </View>
            )}
          </View>

          {/* Amount */}
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.subtext }]}>
              Amount:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={String(transaction.amount)}
                onChangeText={(text) => updateTransaction('amount', text)}
                placeholder="0"
                placeholderTextColor={theme.subtext}
                keyboardType="decimal-pad"
              />
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>
                {(transaction.amount || 0).toFixed(0)} VND
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.subtext }]}>
              Category:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={transaction.category}
                onChangeText={(text) => updateTransaction('category', text)}
                placeholder="Category"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>
                {transaction.category}
              </Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.subtext }]}>
              Date:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={transaction.date}
                onChangeText={(text) => updateTransaction('date', text)}
                placeholder="dd/MM/yyyy HH:mm"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>
                {transaction.date}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.label, { color: theme.subtext }]}>
              Description:
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  { color: theme.text, borderColor: theme.border }
                ]}
                value={transaction.description}
                onChangeText={(text) => updateTransaction('description', text)}
                placeholder="Description"
                placeholderTextColor={theme.subtext}
                multiline={true}
                numberOfLines={2}
              />
            ) : (
              <Text style={[
                  styles.value,
                  styles.descriptionValue,
                  { color: theme.text }]}>
                {transaction.description}
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
          label="Confirm"
          onPress={handleConfirm}
          loading={isSubmitting}
          loadingText="Creating..."
        />

        <Pressable
          onPress={onCancel}
          style={{
            height: 48,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.inputBg,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: "600" }}>Retake</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    marginTop: 8,
  },
  header: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  micCard: {
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  micTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 14,
    textAlign: "center",
  },
  detailsCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  editButton: {
    padding: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  lastRow: {
    paddingBottom: 4,
  },
  label: {
    width: 110,
    fontSize: 13,
    fontWeight: "500",
  },
  value: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  descriptionValue: {
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actions: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    textAlign: "center",
  },
});