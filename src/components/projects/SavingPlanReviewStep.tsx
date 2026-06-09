import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  SavingPlanMode,
  ProjectAdvisorResponse,
} from "../../types/project.types";
import { BudgetAllocationResult } from "../../types/project.types";
import { savingPlanStyles as styles } from "../../styles/savingPlanStyles";

type Props = {
  mode: SavingPlanMode | null;
  advisorData: ProjectAdvisorResponse | null;
  budgetResult?: BudgetAllocationResult | null;
  loading?: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function SavingPlanReviewStep({
  mode,
  advisorData,
  budgetResult = null,
  loading = false,
  onBack,
  onConfirm,
  onCancel,
}: Props) {
  const categories = budgetResult?.categories ?? [];

  return (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.headerTitle}>Saving Plan</Text>
      </View>

      <Text style={styles.reviewTitle}>AI Suggested Spending Plan:</Text>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewIntro}>
          To reach your goal, AI suggests limiting these categories:
        </Text>

        {budgetResult && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Total Budget</Text>
            <Text style={styles.reviewValue}>
              {budgetResult.totalBudget.toLocaleString("vi-VN")}{" "}
              {budgetResult.currency}
            </Text>
          </View>
        )}

        {categories.map((item) => (
          <View key={item.category} style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{item.category}</Text>
            <Text style={styles.reviewValue}>
              {item.amount.toLocaleString("vi-VN")}{" "}
              {budgetResult?.currency || "VND"}/month
            </Text>
          </View>
        ))}

        {!budgetResult && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>No suggestion available</Text>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={onConfirm}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Confirming..." : "Confirm"}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>Edit</Text>
      </Pressable>

      <Pressable style={styles.dangerButton} onPress={onCancel}>
        <Text style={styles.dangerButtonText}>Cancel</Text>
      </Pressable>
    </>
  );
}