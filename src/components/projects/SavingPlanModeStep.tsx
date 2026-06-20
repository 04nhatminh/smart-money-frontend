import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  ProjectAdvisorResponse,
  SavingPlanMode,
} from "../../types/project.types";
import { savingPlanStyles as styles } from "../../styles/savingPlanStyles";

type Props = {
  mode: SavingPlanMode | null;
  onBack: () => void;
  onSelectMode: (mode: SavingPlanMode) => void;
  onEditProject?: () => void;
  advisorLoading?: boolean;
  advisorData?: ProjectAdvisorResponse | null;
  advisorError?: string | null;
  onConfirmAdvisorPlan: () => void;
  onKeepOriginalPlan: () => void;
  confirmLoading?: boolean;
};

export default function SavingPlanModeStep({
  mode,
  onBack,
  onSelectMode,
  onEditProject,
  advisorLoading,
  advisorData,
  advisorError,
  onConfirmAdvisorPlan,
  onKeepOriginalPlan,
  confirmLoading,
}: Props) {
  const showAISection = !!mode;

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

          <View
            style={[
              styles.suggestionBox,
              advisorError && styles.suggestionErrorBox,
            ]}
          >
            {advisorLoading ? (
              <Text style={styles.suggestionText}>
                AI is generating your saving plan...
              </Text>
            ) : advisorError ? (
              <>
                <Text style={styles.suggestionErrorTitle}>
                  This plan may not be suitable
                </Text>

                <Text style={styles.suggestionErrorText}>
                  {advisorError}
                </Text>

                <Pressable
                  style={styles.inlineEditButton}
                  onPress={onEditProject}
                >
                  <Text style={styles.inlineEditButtonText}>
                    Edit Project
                  </Text>
                </Pressable>
              </>
            ) : advisorData ? (
              <>
                <Text style={styles.suggestionText}>
                  Monthly Saving:{" "}
                  {advisorData.monthlySaving.toLocaleString("de-DE")} VND
                </Text>

                <Text style={styles.suggestionText}>
                  Estimated Months: {advisorData.numberOfMonths}
                </Text>
              </>
            ) : (
              <Text style={styles.suggestionText}>
                Select a mode to receive AI suggestion.
              </Text>
            )}
          </View>

          {advisorData && !advisorError && (
            <>
              <Text style={styles.questionText}>
                Do you want to use this AI suggested plan?
              </Text>

              <Pressable
                style={[
                  styles.primaryButton,
                  confirmLoading && styles.disabledButton,
                ]}
                disabled={confirmLoading}
                onPress={onConfirmAdvisorPlan}
              >
                <Text style={styles.primaryButtonText}>
                  {confirmLoading ? "Creating..." : "Confirm AI Plan"}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.secondaryButton,
                  confirmLoading && styles.disabledButton,
                ]}
                disabled={confirmLoading}
                onPress={onKeepOriginalPlan}
              >
                <Text style={styles.secondaryButtonText}>
                  Keep Original Plan
                </Text>
              </Pressable>
            </>
          )}
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