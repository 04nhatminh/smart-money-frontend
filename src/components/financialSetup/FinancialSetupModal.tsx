import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import FinancialSetupForm from "./FinancialSetupForm";
import {
  FinancialSetup,
  UpdateFinancialSetupPayload,
} from "../../types/financialSetup";
import { FinancialSetupApi } from "../../api/financialSetup.api";
import { useAuth } from "../../context/AuthContext";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  mode?: "onboarding" | "edit";
  initialValue?: Partial<FinancialSetup> | null;
  onClose?: () => void;
  onSuccess?: (setup: FinancialSetup) => void;
};

export default function FinancialSetupModal({
  visible,
  mode = "onboarding",
  initialValue,
  onClose,
  onSuccess,
}: Props) {
  const { updateCachedUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (payload: UpdateFinancialSetupPayload) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await FinancialSetupApi.updateFinancialSetup(payload);

      if (!response.success || !response.data) {
        setError(response.message || t("financialSetup.save_error"));
        return;
      }

      await updateCachedUser({
        financialSetupCompleted: true,
      });

      setSuccessMessage(t("financialSetup.save_success"));
      onSuccess?.(response.data as FinancialSetup);

      if (mode === "onboarding") {
        onClose?.();
      }
    } catch (err: any) {
      setError(err?.message || t("financialSetup.save_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={mode === "edit" ? onClose : undefined}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.overlay,
            mode === "onboarding"
              ? styles.onboardingOverlay
              : styles.editOverlay,
          ]}
        >
          <SafeAreaView
            style={[
              styles.container,
              mode === "onboarding"
                ? styles.onboardingContainer
                : styles.editContainer,
            ]}
          >
            <FinancialSetupForm
              mode={mode}
              initialValue={initialValue}
              loading={loading}
              error={error}
              successMessage={successMessage}
              onSubmit={handleSubmit}
              onCancel={mode === "edit" ? onClose : undefined}
            />
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  onboardingOverlay: {
    justifyContent: "flex-start",
  },

  editOverlay: {
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: "#FFFFFF",
  },

  onboardingContainer: {
    flex: 1,
    marginTop: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  editContainer: {
    height: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
});