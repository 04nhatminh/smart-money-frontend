import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FinancialSetupForm from "./FinancialSetupForm";
import {
  FinancialSetup,
  UpdateFinancialSetupPayload,
} from "../../types/financialSetup";
import { FinancialSetupApi } from "../../api/financialSetup.api";
import { useAuth } from "../../context/AuthContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function FinancialSetupSettingsModal({
  visible,
  onClose,
}: Props) {
  const { updateCachedUser } = useAuth();

  const [setup, setSetup] = useState<FinancialSetup | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const loadSetup = async () => {
      try {
        setLoadingSetup(true);
        setError(null);
        setSuccessMessage(null);

        const response = await FinancialSetupApi.getFinancialSetup();

        if (response.success && response.data) {
          setSetup(response.data as FinancialSetup);
        } else {
          setSetup(null);
          setError(response.message || "Can not load financial setup at this time. Please try again.");
        }
      } catch (err: any) {
        setSetup(null);
        setError(
          err?.message || "Can not load financial setup at this time. Please try again."
        );
      } finally {
        setLoadingSetup(false);
      }
    };

    loadSetup();
  }, [visible]);

  const handleSubmit = async (payload: UpdateFinancialSetupPayload) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await FinancialSetupApi.updateFinancialSetup(payload);

      if (!response.success || !response.data) {
        setError(
          response.message ||
            "Can not save financial setup at this time. Please try again."
        );
        return;
      }

      const latestSetup = response.data as FinancialSetup;

      setSetup(latestSetup);

      await updateCachedUser({
        financialSetupCompleted: true,
      });

      setSuccessMessage("Your financial setup has been updated.");
    } catch (err: any) {
      setError(
        err?.message || "Can not save financial setup at this time. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.container}>
            {loadingSetup ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#4B3FD6" />
                <Text style={styles.loadingText}>Loading setup...</Text>
              </View>
            ) : (
              <FinancialSetupForm
                mode="edit"
                initialValue={setup}
                loading={saving}
                error={error}
                successMessage={successMessage}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            )}
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
    justifyContent: "flex-end",
  },

  container: {
    height: "90%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#4B3FD6",
    fontSize: 14,
    fontWeight: "600",
  },
});