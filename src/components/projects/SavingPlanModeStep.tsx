import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  SavingPlanAIResponse,
  SavingPlanMode,
} from "../../types/project.types";
import { savingPlanStyles as styles } from "../../styles/savingPlanStyles";

type Props = {
  mode: SavingPlanMode | null;
  aiResponse: SavingPlanAIResponse | null;
  onBack: () => void;
  onSelectMode: (mode: SavingPlanMode) => void;
  onContinue: () => void;
};

export default function SavingPlanModeStep({
  mode,
  aiResponse,
  onBack,
  onSelectMode,
  onContinue,
}: Props) {
  const showAISection = !!mode && !!aiResponse;

  return (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.headerTitle}>Saving Plan</Text>
      </View>

      <View style={styles.assistantCard}>
        <View style={styles.assistantHeader}>
          <Text style={styles.assistantTitle}>AI Assistant</Text>
        </View>

        <Text style={styles.assistantQuestion}>
          How would you like to save for your saving goal?
        </Text>

        <View style={styles.modeButtonRow}>
          <Pressable
            style={[
              styles.modeButton,
              mode === "RELAXED" && styles.modeButtonActive,
            ]}
            onPress={() => onSelectMode("RELAXED")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "RELAXED" && styles.modeButtonTextActive,
              ]}
            >
              Relaxed
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              mode === "URGENT" && styles.modeButtonActive,
            ]}
            onPress={() => onSelectMode("URGENT")}
          >
            <Text
              style={[
                styles.modeButtonText,
                mode === "URGENT" && styles.modeButtonTextActive,
              ]}
            >
              Urgent
            </Text>
          </Pressable>
        </View>
      </View>

      {showAISection && (
        <>
          <Text style={styles.sectionTitle}>AI Suggestion:</Text>

          <View style={styles.suggestionBox}>
            <Text
              style={[
                styles.aiStatusText,
                aiResponse.agreed ? styles.aiAgreeText : styles.aiAdjustText,
              ]}
            >
              {aiResponse.agreed ? "AI agrees with your plan." : "AI suggests an adjusted plan."}
            </Text>

            <Text style={styles.suggestionText}>{aiResponse.message}</Text>

            <Text style={styles.suggestionText}>
              Suggested monthly saving:{" "}
              {aiResponse.suggestion.monthlySavingAmount.toLocaleString("de-DE")} VND/month
            </Text>

            <Text style={styles.suggestionText}>
              Estimated time: {aiResponse.suggestion.estimatedMonths} months
            </Text>
          </View>

          <Text style={styles.questionText}>
            Do you accept this plan?
          </Text>

          <Pressable style={styles.primaryButton} onPress={onContinue}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </>
      )}

      <View style={styles.stepActionRow}>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    </>
  );
}