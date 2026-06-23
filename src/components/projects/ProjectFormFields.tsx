import React from "react";
import { Pressable, Text, View } from "react-native";
import { InputField } from "../InputField";
import { projectStyles as styles } from "../../styles/projectStyles";
import { t } from "../../i18n";
import { CreateProjectFormErrors } from "../../types/project.types";
import { ProjectPriority, PROJECT_PRIORITIES } from "../../types/project.types";

type Props = {
  name: string;
  description: string;
  targetAmount: string;
  priority: ProjectPriority;
  deadlineMonths: string;
  errors: CreateProjectFormErrors;
  previewDeadline: string;
  availablePriorities?: ProjectPriority[];
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeTargetAmount: (value: string) => void;
  onChangeDeadlineMonths: (value: string) => void;
  onChangePriority: (value: ProjectPriority) => void;
};

const getPriorityLabel = (priority: ProjectPriority) => {
  switch (priority) {
    case "HIGH":
      return t("project.priority_high");
    case "MEDIUM":
      return t("project.priority_medium");
    case "LOW":
      return t("project.priority_low");
    default:
      return priority;
  }
};

export default function ProjectFormFields({
  name,
  targetAmount,
  deadlineMonths,
  priority,
  description,
  errors,
  previewDeadline,
  onChangeName,
  onChangeTargetAmount,
  onChangeDeadlineMonths,
  onChangeDescription,
  onChangePriority,
  availablePriorities,
}: Props) {
  return (
    <>
      <Text style={styles.name}>{t("project.name")}</Text>
      <InputField
        iconName="folder-outline"
        placeholder={t("project.placeholder_name")}
        value={name}
        onChangeText={onChangeName}
        autoCapitalize="sentences"
        error={errors.name}
      />

      <Text style={styles.name}>{t("project.target_amount_label")}</Text>
      <InputField
        iconName="wallet-outline"
        placeholder={t("project.placeholder_target")}
        value={targetAmount}
        onChangeText={onChangeTargetAmount}
        keyboardType="numeric"
        rightText="VND"
        error={errors.targetAmount}
      />

      <Text style={styles.name}>{t("project.deadline_label")}</Text>
      <InputField
        placeholder={t("project.placeholder_deadline")}
        value={deadlineMonths}
        onChangeText={onChangeDeadlineMonths}
        rightText={t("project.months")}
        error={errors.deadlineMonths}
      />

      {!!previewDeadline && (
        <Text style={styles.helperText}>
          {t("project.deadline_date")}
          {previewDeadline}
        </Text>
      )}

      <Text style={styles.name}>{t("project.priority")}</Text>

      <View style={styles.priorityContainer}>
        {PROJECT_PRIORITIES.map((item) => {
          const active = priority === item;
          const used = !availablePriorities?.includes(item);
          const disabled = used && !active;

          return (
            <Pressable
              key={item}
              disabled={disabled}
              style={[
                styles.priorityCard,
                active && styles.priorityCardActive,
                used && !active && styles.priorityCardDisabled,
              ]}
              onPress={() => onChangePriority(item)}
            >
              <View style={styles.priorityHeader}>
                <Text
                  style={[
                    styles.priorityTitle,
                    active && styles.priorityTitleActive,
                    used && !active && styles.priorityTitleDisabled,
                  ]}
                >
                  {getPriorityLabel(item)}
                </Text>

                {used && !active && (
                  <View style={styles.usedBadge}>
                    <Text style={styles.usedBadgeText}>{t("project.used")}</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.priorityDescription,
                  used && !active && styles.priorityDescriptionDisabled,
                ]}
              >
                {item === "HIGH" && t("project.high_priority_desc")}
                {item === "MEDIUM" && t("project.medium_priority_desc")}
                {item === "LOW" && t("project.low_priority_desc")}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.name}>{t("project.description")}</Text>
      <InputField
        iconName="document-text-outline"
        placeholder={t("project.description")}
        value={description}
        onChangeText={onChangeDescription}
        multiline
        numberOfLines={4}
        autoCapitalize="sentences"
        error={errors.description}
      />
    </>
  );
}
