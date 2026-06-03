import React from "react";
import { Text, View} from "react-native";
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
    onCancel,
    onNext,
}: Props) {
   
    return (
        <>
            <Text style={styles.title}>Create Project</Text>

            <ProjectTypeTabs
                value={values.type}
                onChange={onChangeType}
            />

            {!checkingPriorities && !canCreateProject && (
                <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                    You already have active projects for all priorities.
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
                />

                <View style={styles.buttonRow}>
                    <ButtonSave
                        label={t("common.cancel")}
                        variant="secondary"
                        onPress={onCancel}
                    />
    
                    <ButtonSave
                         label={checkingPriorities ? "Checking..." : "Create"}
                        onPress={onNext}
                        disabled={!canCreateProject || checkingPriorities || loading}
                    />
                </View>
            </View>
        </>
    )
}