import React, { useState } from "react";
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
import { useThemeMode } from "../../theme/ThemeProvider";
import { ActionButton } from "../ActionButton";
import { t } from "../../i18n";
import { SubmitButton } from "../SubmitButton";

export interface VoiceTransaction {
  type: "Expense" | "Income";
  transactionName: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

type Props = {
  audioUri: string;
  onCancel: () => void;
  onRetakeAudio: () => void;
  onConfirm: (transaction: VoiceTransaction) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

// Mock voice input data
const MOCK_VOICE_TRANSACTION: VoiceTransaction = {
  type: "Expense",
  transactionName: "Breakfast",
  amount: 40000,
  category: "Food",
  date: "28/02/2026",
  description: "Eat Pho",
};

export function VoiceInput({
  audioUri,
  onCancel,
  onRetakeAudio,
  onConfirm,
  isSubmitting = false,
  errorMessage,
}: Props) {
  const { theme } = useThemeMode();
  const [transaction, setTransaction] = useState<VoiceTransaction>(MOCK_VOICE_TRANSACTION);
  const [isEditing, setIsEditing] = useState(false);

  const handleConfirm = () => {
    console.log("🎤 VoiceInput.handleConfirm called");
    console.log("📊 Transaction data:", transaction);
    onConfirm(transaction);
  };

  const updateTransaction = (field: keyof VoiceTransaction, value: any) => {
    setTransaction(prev => ({
      ...prev,
      [field]: field === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Voice Input</Text>
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
        {/* Microphone Section */}
        <View style={[styles.microphoneSection, { backgroundColor: theme.card }]}>
          <Pressable 
            style={styles.retakeButton}
            onPress={onRetakeAudio}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </Pressable>
          
          <Ionicons name="mic" size={64} color={theme.primary} />
          <Text style={[styles.microphonePrompt, { color: theme.text }]}>
            Recording completed
          </Text>
          <Text style={[styles.microphoneSubtext, { color: theme.subtext }]}>
            Confirm details below or retake recording
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={[styles.detailsSection, { backgroundColor: theme.card }]}>
          {/* Type */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Type:
            </Text>
            {isEditing ? (
              <View style={styles.typeSelector}>
                {(['Expense', 'Income'] as const).map(type => (
                  <Pressable
                    key={type}
                    onPress={() => updateTransaction('type', type)}
                    style={[
                      styles.typeOption,
                      transaction.type === type && {
                        backgroundColor: type === "Expense" ? "#ef4444" : "#10b981",
                      }
                    ]}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      transaction.type === type && styles.typeOptionTextActive
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
                      transaction.type === "Expense"
                        ? "#ef4444"
                        : "#10b981",
                    backgroundColor:
                      transaction.type === "Expense"
                        ? "#ef444415"
                        : "#10b98115",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                  },
                ]}
              >
                {transaction.type}
              </Text>
            )}
          </View>

          {/* Transaction Name */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Transaction Name:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={transaction.transactionName}
                onChangeText={(text) => updateTransaction('transactionName', text)}
                placeholder="Transaction name"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {transaction.transactionName}
              </Text>
            )}
          </View>

          {/* Amount */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Amount:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={String(transaction.amount)}
                onChangeText={(text) => updateTransaction('amount', text)}
                placeholder="0.000"
                placeholderTextColor={theme.subtext}
                keyboardType="decimal-pad"
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {transaction.amount.toFixed(0)} VND
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Category:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={transaction.category}
                onChangeText={(text) => updateTransaction('category', text)}
                placeholder="Category"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {transaction.category}
              </Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Date:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={transaction.date}
                onChangeText={(text) => updateTransaction('date', text)}
                placeholder="dd/MM/yyyy"
                placeholderTextColor={theme.subtext}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {transaction.date}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.detailLabel, { color: theme.subtext }]}>
              Description:
            </Text>
            {isEditing ? (
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: theme.border }]}
                value={transaction.description}
                onChangeText={(text) => updateTransaction('description', text)}
                placeholder="Description"
                placeholderTextColor={theme.subtext}
                multiline={true}
                numberOfLines={2}
              />
            ) : (
              <Text style={[styles.detailValue, { color: theme.text }]}>
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

        <ActionButton 
          label="Cancel"
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
  microphoneSection: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 32,
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
  retakeButton: {
    position: "absolute",
    top: 16,
    left: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(54, 41, 183, 0.1)",
  },
  microphonePrompt: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  microphoneSubtext: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
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
