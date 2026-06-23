import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  ProjectAdvisorResponse,
  SavingPlanMode,
} from "../../types/project.types";
import { savingPlanStyles as styles } from "../../styles/savingPlanStyles";
import { i18n, t } from "../../i18n";

type Props = {
  mode: SavingPlanMode | null;
  advisorLoading?: boolean;
  advisorData?: ProjectAdvisorResponse | null;
  advisorError?: string | null;
  confirmLoading?: boolean;

  onBack: () => void;
  onSelectMode: (mode: SavingPlanMode) => void;
  onEditProject?: () => void;
  onConfirmAdvisorPlan: () => void;
  onKeepOriginalPlan: () => void;
};

export default function SavingPlanModeStep({
  mode,
  advisorLoading,
  advisorData,
  advisorError,
  confirmLoading,
  onBack,
  onSelectMode,
  onEditProject,
  onConfirmAdvisorPlan,
  onKeepOriginalPlan,
}: Props) {
  const showAISection = !!mode;
  const numberFormatter = new Intl.NumberFormat(
    i18n.locale === "vi" ? "vi-VN" : "en-US"
  );

  return (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.headerTitle}>{t("project.saving_plan_title")}</Text>
      </View>

      <View style={styles.assistantCard}>
        <View style={styles.assistantHeader}>
          <Text style={styles.assistantTitle}>{t("project.ai_assistant")}</Text>
        </View>

        <Text style={styles.assistantQuestion}>
          {t("project.how_would_you_like_to_save")}
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
              {t("project.relaxed")}
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
              {t("project.urgent")}
            </Text>
          </Pressable>
        </View>
      </View>

      {showAISection && (
        <>
          <Text style={styles.sectionTitle}>{t("project.ai_suggestion")}</Text>

          <View
            style={[
              styles.suggestionBox,
              advisorError && styles.suggestionErrorBox,
            ]}
          >
            {advisorLoading ? (
              <Text style={styles.suggestionText}>
                {t("project.ai_generating_saving_plan")}
              </Text>
            ) : advisorError ? (
              <>
                <Text style={styles.suggestionErrorTitle}>
                  {t("project.this_plan_may_not_be_suitable")}
                </Text>

                <Text style={styles.suggestionErrorText}>{advisorError}</Text>

                <Pressable style={styles.inlineEditButton} onPress={onEditProject}>
                  <Text style={styles.inlineEditButtonText}>
                    {t("project.edit")}
                  </Text>
                </Pressable>
              </>
            ) : advisorData ? (
              <>
                <Text style={styles.suggestionText}>
                  {t("project.monthly_saving_label")}{" "}
                  {numberFormatter.format(advisorData.monthlySaving)} VND
                </Text>

                <Text style={styles.suggestionText}>
                  {t("project.estimated_months")} {advisorData.numberOfMonths}
                </Text>
              </>
            ) : (
              <Text style={styles.suggestionText}>
                {t("project.select_mode_to_receive_ai_suggestion")}
              </Text>
            )}
          </View>

          {advisorData && !advisorError && (
            <>
              <Text style={styles.questionText}>
                {t("project.use_this_ai_suggested_plan")}
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
                  {confirmLoading ? t("project.generating") : t("project.confirm_ai_plan")}
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
                  {t("project.keep_original_plan")}
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}

      <View style={styles.stepActionRow}>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>{t("project.back")}</Text>
        </Pressable>
      </View>
    </>
  );
}
