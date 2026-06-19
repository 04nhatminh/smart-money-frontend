import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProjectListItemResponse } from "../../types/project.types";
import { projectListStyles as styles } from "../../styles/projectListStyles";
import { formatCurrencyVND, getSafeProgress } from "../../utils/project";
import { t } from "../../i18n";

type Props = {
  project: ProjectListItemResponse;
  onPress?: (project: ProjectListItemResponse) => void;
  onMorePress?: (project: ProjectListItemResponse) => void;
};

const getPriorityLabel = (priority: ProjectListItemResponse["priority"]) => {
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

const getTypeLabel = (type: ProjectListItemResponse["type"]) =>
  type === "PERSONAL" ? t("project.type_personal") : t("project.type_group");

const getStatusLabel = (status: ProjectListItemResponse["status"]) => {
  switch (status) {
    case "ACTIVE":
      return t("project.status_active");
    case "COMPLETED":
      return t("project.status_completed");
    case "CANCELLED":
      return t("project.status_cancelled");
    default:
      return status;
  }
};

export default function ProjectCard({
  project,
  onPress,
  onMorePress,
}: Props) {
  const priorityStyleMap = {
    HIGH: {
      card: styles.highPriorityCard,
      chip: styles.highPriorityChip,
      text: styles.highPriorityText,
    },
    MEDIUM: {
      card: styles.mediumPriorityCard,
      chip: styles.mediumPriorityChip,
      text: styles.mediumPriorityText,
    },
    LOW: {
      card: styles.lowPriorityCard,
      chip: styles.lowPriorityChip,
      text: styles.lowPriorityText,
    },
  };

  const priorityStyle = priorityStyleMap[project.priority];
  const progress = getSafeProgress(project.progressPercent);
  const isPersonal = project.type === "PERSONAL";
  const isCompleted = project.status === "COMPLETED";
  const isInactive = isCompleted || project.status === "CANCELLED";

  return (
    <Pressable
      style={[styles.projectCard, priorityStyle.card, isInactive && { opacity: 0.6 }]}
      onPress={() => onPress?.(project)}
    >
      <View style={styles.projectCardHeader}>
        <Text style={styles.projectTitle}>{project.name}</Text>

        <View style={[styles.priorityChip, priorityStyle.chip]}>
          <Text style={[styles.priorityChipText, priorityStyle.text]}>
            {getPriorityLabel(project.priority)}
          </Text>
        </View>

        <Pressable hitSlop={10} onPress={() => onMorePress?.(project)}>
          <Ionicons name="ellipsis-vertical" size={18} color="#B4B4B8" />
        </Pressable>
      </View>

      <View style={styles.projectTagRow}>
        <View
          style={[
            styles.typeChip,
            isPersonal ? styles.personalChip : styles.groupChip,
          ]}
        >
          <Text
            style={[
              styles.typeChipText,
              isPersonal ? styles.personalChipText : styles.groupChipText,
            ]}
          >
            {getTypeLabel(project.type)}
          </Text>
        </View>

        <View style={styles.deadlineChip}>
          <Text style={styles.deadlineChipText}>{getStatusLabel(project.status)}</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>{t("project.saved_label")}</Text>
        <Text style={styles.amountText}>
          {formatCurrencyVND(project.totalContributed)} /{" "}
          {formatCurrencyVND(project.targetAmount)}
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.projectFooterRow}>
        <View style={styles.progressTextRow}>
          <Text style={styles.footerLabel}>{t("project.progress_label")}</Text>
          <Text style={[styles.footerValue, isCompleted && styles.completedText]}>
            {Math.round(project.progressPercent)}%
          </Text>
        </View>

        <Text style={[styles.timeLeftText, isCompleted && styles.completedText]}>
          {project.monthsLeft}{" "}
          {project.monthsLeft > 1
            ? t("project.month_remaining_other")
            : t("project.month_remaining_one")}
        </Text>
      </View>
    </Pressable>
  );
}
