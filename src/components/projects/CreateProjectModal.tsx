import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";

import { ButtonSave } from "../ButtonSave";
import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";

import { projectStyles as styles } from "../../styles/projectStyles";
import { useCreateProject } from "../../hooks/useCreateProject";
import ProjectFormFields from "./ProjectFormFields";
import ProjectTypeTabs from "./ProjectTypeTabs";
import { t } from "../../i18n";

type Props = {
    visible: boolean;
    onClose: () => void;
    onCreated?: () => void;
};

export default function CreateProjectModal({ 
    visible, 
    onClose, 
    onCreated 
}: Props) {
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    const {
        values,
        errors,
        loading,
        previewDeadline,
        isDirty,
        onChangeName,
        onChangeDescription,
        onChangeTargetAmount,
        onChangeDeadlineMonths,
        onChangeType,
        handleCreateProject,
        resetForm,
    } = useCreateProject({
        onSuccess: () => setShowSuccessModal(true),
    });

    const handleClose = () => {
        if (isDirty) {
            setShowExitModal(true);
            return;
        } 

        resetForm();
        onClose();
    }

    const handleConfirmExit = () => {
        setShowExitModal(false);
        resetForm();
        onClose();
    };

    const onSubmit = async () => {
        try {
            const success = await handleCreateProject();
            if (!success) return;
        } catch (error: any) {
            const message = 
                error?.message ||
                error?.response?.data?.message ||
                "Failed to create project. Please try again.";
            Alert.alert("Error", message);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        resetForm();
        onClose();
        onCreated?.();
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={handleClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.title}>Create Project</Text>

                            <ProjectTypeTabs
                                value={values.type}
                                onChange={onChangeType}
                            />

                            <View style={styles.formCard}>
                                <ProjectFormFields
                                    name={values.name}
                                    description={values.description}
                                    targetAmount={values.targetAmount}
                                    deadlineMonths={values.deadlineMonths}
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
                                        onPress={handleClose}
                                    />
                    
                                    <ButtonSave
                                        label={t("common.create")}
                                        variant="primary"
                                        onPress={onSubmit}
                                        disabled={loading}
                                    />
                                </View>
                            </View>
                        </ScrollView>
                    </View>

                </View>
            </Modal>

            <SuccessModal
                visible={showSuccessModal}
                onDone={handleSuccessClose}
                title="Project created successfully"
                description="Your project has been created."
                buttonText="Done"
            />

            <ConfirmExitModal
                visible={showExitModal}
                onCancel={() => setShowExitModal(false)}
                onConfirm={handleConfirmExit}
                title={t("project.confirmExit")}
                description={t("project.confirmExitDesc")}
                cancelText={t("common.cancel")}
                confirmText={t("common.continue")}
            />
        </>
    )
}
