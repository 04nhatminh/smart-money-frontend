import React from "react";
import { Text, View } from "react-native";
import { ButtonSave } from "../ButtonSave";
import { projectStyles as styles } from "../../styles/projectStyles";
import {
  CreateProjectFormErrors,
  CreateProjectFormValues,
  ProjectPriority,
  ProjectType,
} from "../../types/project.types";
import ProjectFormFields from "./ProjectFormFields";
import ProjectTypeTabs from "./ProjectTypeTabs";
import { t } from "../../i18n";

type Props = {
  values: CreateProjectFormValues;
  errors: CreateProjectFormErrors;
  previewDeadline: string;
  loading?: boolean;
  checkingPriorities?: boolean;
  canCreateProject?: boolean;
  availablePriorities?: ProjectPriority[];

  onChangeType: (type: ProjectType) => void;
  onChangeName: (name: string) => void;
  onChangeTargetAmount: (amount: string) => void;
  onChangeDeadlineMonths: (months: string) => void;
  onChangePriority: (value: ProjectPriority) => void;
  onChangeDescription: (description: string) => void;
  onDescriptionFocus?: () => void;
  onDescriptionBlur?: () => void;
  onCancel: () => void;
  onNext: () => void;
};

export default function CreateProjectStep({
  values,
  errors,
  previewDeadline,
  loading = false,
  checkingPriorities = false,
  canCreateProject = false,
  availablePriorities,
  onChangeType,
  onChangeName,
  onChangeTargetAmount,
  onChangeDeadlineMonths,
  onChangePriority,
  onChangeDescription,
  onDescriptionFocus,
  onDescriptionBlur,
  onCancel,
  onNext,
}: Props) {
  return (
    <>
      <Text style={styles.title}>{t("project.create_title")}</Text>

      <ProjectTypeTabs value={values.type} onChange={onChangeType} />

      {!checkingPriorities && !canCreateProject && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {t("project.create_all_priorities_used_warning")}
          </Text>
        </View>
      )}

      <View style={styles.formCard}>
        <ProjectFormFields
          name={values.name}
          description={values.description}
          targetAmount={values.targetAmount}
          deadlineMonths={values.deadlineMonths}
          priority={values.priority}
          errors={errors}
          previewDeadline={previewDeadline}
          availablePriorities={availablePriorities}
          onChangeName={onChangeName}
          onChangeDescription={onChangeDescription}
          onChangeTargetAmount={onChangeTargetAmount}
          onChangeDeadlineMonths={onChangeDeadlineMonths}
          onChangePriority={onChangePriority}
          onDescriptionFocus={onDescriptionFocus}
          onDescriptionBlur={onDescriptionBlur}
        />

        <View style={styles.buttonRow}>
          <ButtonSave
            label={t("common.cancel")}
            variant="secondary"
            onPress={onCancel}
          />

          <ButtonSave
            label={
              checkingPriorities
                ? t("project.checking")
                : loading
                  ? t("project.loading")
                  : t("project.next")
            }
            onPress={onNext}
            disabled={checkingPriorities || loading}
          />
        </View>
      </View>
    </>
  );
}
