import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProjectListItemResponse } from "../../types/project.types";
import { projectListStyles as styles } from "../../styles/projectListStyles";
import {
  formatCurrencyVND,
  getSafeProgress
} from "../../utils/project";

type Props = {
  project: ProjectListItemResponse;
  onPress?: (project: ProjectListItemResponse) => void;
  onMorePress?: (project: ProjectListItemResponse) => void;
};

export default function ProjectCard({
  project,
  onPress,
  onMorePress,
}: Props) {
  const progress = getSafeProgress(project.progressPercent);
  const isPersonal = project.type === "PERSONAL";
  const isCompleted = project.status === "COMPLETED";
  const isOverdue = project.status === "OVERDUE";

  return (
    <Pressable
      style={styles.projectCard}
      onPress={() => onPress?.(project)}
    >
      <View style={styles.projectCardHeader}>
        <Text style={styles.projectTitle}>{project.name}</Text>

        <Pressable
          hitSlop={10}
          onPress={() => onMorePress?.(project)}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color="#B4B4B8"
          />
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
            {isPersonal ? "Personal" : "Group"}
          </Text>
        </View>

        <View style={styles.deadlineChip}>
          <Text style={styles.deadlineChipText}>
            {project.deadlineLabel}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Saved</Text>
        <Text style={styles.amountText}>
          {formatCurrencyVND(project.totalContributed)} /{" "}
          {formatCurrencyVND(project.targetAmount)}
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress}%` },
          ]}
        />
      </View>

      <View style={styles.projectFooterRow}>
        <View style={styles.progressTextRow}>
          <Text style={styles.footerLabel}>Progress:</Text>
          <Text
            style={[
              styles.footerValue,
              isCompleted && styles.completedText,
            ]}
          >
            {Math.round(project.progressPercent)}%
          </Text>
        </View>

        <Text
          style={[
            styles.timeLeftText,
            isCompleted && styles.completedText,
            isOverdue && styles.overdueText,
          ]}
        >
          {project.statusLabel}
        </Text>
      </View>
    </Pressable>
  );
}