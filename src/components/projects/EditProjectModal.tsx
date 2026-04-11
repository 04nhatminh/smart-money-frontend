import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";

import { ButtonSave } from "../ButtonSave";
import SuccessModal from "../SuccessModal";
import ConfirmExitModal from "../ConfirmExitModal";

import { projectStyles as styles } from "../../styles/projectStyles";
import { useEditProject } from "../../hooks/useEditProject";
import { ProjectDetailResponse } from "../../types/project.types";
import ProjectFormFields from "./ProjectFormFields";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  project: ProjectDetailResponse;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function EditProjectModal({
  visible,
  project,
  onClose,
  onUpdated,
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
    handleEditProject,
    resetForm,
  } = useEditProject({
    project,
    onSuccess: () => setShowSuccessModal(true),
  });

  const handleClose = () => {
    if (isDirty) {
      setShowExitModal(true);
      return;
    }

    resetForm();
    onClose();
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    resetForm();
    onClose();
  };

  const onSubmit = async () => {
    try {
      const success = await handleEditProject();
      if (!success) return;
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Failed to update project";
      Alert.alert("Error", message);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    resetForm();
    onClose();
    onUpdated?.();
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
              <Text style={styles.title}>Edit Project</Text>

              <View style={styles.formCard}>
                <ProjectFormFields
                  name={values.name}
                  targetAmount={values.targetAmount}
                  deadlineMonths={values.deadlineMonths}
                  description={values.description}
                  errors={errors}
                  previewDeadline={previewDeadline}
                  onChangeName={onChangeName}
                  onChangeTargetAmount={onChangeTargetAmount}
                  onChangeDeadlineMonths={onChangeDeadlineMonths}
                  onChangeDescription={onChangeDescription}
                />

                <View style={styles.buttonRow}>
                  <Pressable style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>

                  <ButtonSave
                    label={loading ? "Saving..." : "Save"}
                    onPress={onSubmit}
                    disabled={loading}
                    customStyle={styles.createButton}
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
        title={t("project.updateSuccess")}
        description={t("project.updateSuccessDesc")}
        buttonText={t("common.done")}
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
  );
}