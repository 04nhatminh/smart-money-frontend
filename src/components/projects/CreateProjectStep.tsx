import React from "react";
import { Pressable, Text, View} from "react-native";
import { ButtonSave } from "../ButtonSave";
import { projectStyles as styles } from "../../styles/projectStyles";
import { CreateProjectFormErrors, ProjectType } from "../../types/project.types";
import ProjectFormFields from "./ProjectFormFields";
import ProjectTypeTabs from "./ProjectTypeTabs";
import { t } from "../../i18n";

type Props = {
    type: ProjectType;
    name: string;
    targetAmount: string;
    deadlineMonths: string;
    description: string;
    errors: CreateProjectFormErrors;
    previewDeadline: string;
    loading?: boolean;
    onChangeType: (type: ProjectType) => void;
    onChangeName: (name: string) => void;
    onChangeTargetAmount: (amount: string) => void;
    onChangeDeadlineMonths: (months: string) => void;
    onChangeDescription: (description: string) => void;
    onCancel: () => void;
    onNext: () => void;
};

export default function CreateProjectStep({ 
    type,
    name,
    targetAmount,
    deadlineMonths,
    description,
    errors,
    previewDeadline,
    loading,
    onChangeType,
    onChangeName,
    onChangeTargetAmount,
    onChangeDeadlineMonths,
    onChangeDescription,
    onCancel,
    onNext,

}: Props) {
   
    return (
        <>
            <Text style={styles.title}>Create Project</Text>

            <ProjectTypeTabs
                value={type}
                onChange={onChangeType}
            />

                           
            <View style={styles.formCard}>
                <ProjectFormFields
                    name={name}
                    description={description}
                    targetAmount={targetAmount}
                    deadlineMonths={deadlineMonths}
                    errors={errors}
                    previewDeadline={previewDeadline}
                    onChangeName={onChangeName}
                    onChangeDescription={onChangeDescription}
                    onChangeTargetAmount={onChangeTargetAmount}
                    onChangeDeadlineMonths={onChangeDeadlineMonths}
                />

                <View style={styles.buttonRow}>
                    <ButtonSave
                        label={t("common.cancel")}
                        variant="secondary"
                        onPress={onCancel}
                    />
    
                    <ButtonSave
                        label={loading ? t("common.loading") : t("common.create")}
                        variant="primary"
                        onPress={onNext}
                        disabled={loading}
                    />
                </View>
            </View>
        </>
    )
}
