import React from "react";
import { Pressable, Text, View } from "react-native";
import { SavingPlanMode, BudgetAllocationResult, CreateProjectFormValues } from "../../types/project.types";
import { savingPlanStyles as styles } from "../../styles/savingPlanStyles";
import { ButtonSave } from "../ButtonSave";

type Props = {
  values: CreateProjectFormValues;
  budgetResult?: BudgetAllocationResult | null;
  loading?: boolean;
  budgetLoading?: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onCreateBudget: () => void;
};

export default function SavingPlanReviewStep({
  values,
  budgetResult = null,
  loading = false,
  onBack,
  onConfirm,
  onCancel,
  onCreateBudget,
}: Props) {
  const categories = budgetResult?.categories ?? [];

  return (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.headerTitle}>Saving Plan</Text>
      </View>

      <ButtonSave
        label={loading ? "Generating..." : "Create Budget Allocation"}
        onPress={onCreateBudget}
        disabled={loading}
      />


    {budgetResult && (
    <>
    <Text style={styles.reviewTitle}>AI Suggested Spending Plan:</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewIntro}>
          To reach your goal, AI suggests limiting these categories:
        </Text>

        
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Total Budget</Text>
              <Text style={styles.reviewValue}>
                {budgetResult.totalBudget.toLocaleString("vi-VN")} {" "}
                {budgetResult.currency}
              </Text>
            </View>

            {budgetResult.categories.map((item) => (
              <View key={item.category} style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{item.category}</Text>
                <Text style={styles.reviewValue}>
                  {item.amount.toLocaleString("de-DE")} {budgetResult.currency}
                </Text>
              </View>
            ))}

       
      </View>
      </>
      )}

       {!budgetResult && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>No suggestion available</Text>
          </View>
        )}

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