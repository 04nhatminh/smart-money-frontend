import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import FinancialSetupForm from "./FinancialSetupForm";
import {
  FinancialSetup,
  UpdateFinancialSetupPayload,
} from "../../types/financialSetup";
import { FinancialSetupApi } from "../../api/financialSetup.api";
import { useAuth } from "../../context/AuthContext";
import { t } from "../../i18n";
import { useThemeMode } from "../../theme/ThemeProvider";

type Props = {
  visible: boolean;
  mode?: "onboarding" | "edit";

  /**
   * Có thể truyền dữ liệu từ component cha.
   * Nếu mode="edit" nhưng không có initialValue,
   * modal sẽ tự gọi API để tải dữ liệu.
   */
  initialValue?: Partial<FinancialSetup> | null;

  onClose?: () => void;
  onSuccess?: (setup: FinancialSetup) => void;
};

const LOAD_ERROR_MESSAGE =
  "Can not load financial setup at this time. Please try again.";

const SAVE_ERROR_MESSAGE =
  "Can not save financial setup at this time. Please try again.";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function FinancialSetupModal({
  visible,
  mode = "onboarding",
  initialValue,
  onClose,
  onSuccess,
}: Props) {
  const { updateCachedUser } = useAuth();
  const { theme, mode: themeMode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = themeMode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = themeMode === "green" ? "#FFFFFF" : theme.card;

  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: surface,
    },

    onboardingContainer: {
      flex: 1,
      marginTop: 28,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },

    editContainer: {
      height: "90%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },

    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    loadingText: {
      marginTop: 12,
      color: accent,
      fontSize: 14,
      fontWeight: "600",
    },

    errorIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "#FEE2E2",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },

    errorTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginBottom: 8,
    },

    errorMessage: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.subtext,
      textAlign: "center",
    },

    errorActions: {
      width: "100%",
      marginTop: 20,
    },

    retryButton: {
      minHeight: 46,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },

    closeButton: {
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },

    closeButtonText: {
      color: accent,
      fontSize: 14,
      fontWeight: "700",
    },

    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },

    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: "#D1FAE5",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },

    successTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginBottom: 8,
    },

    successDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.subtext,
      textAlign: "center",
      marginBottom: 24,
    },

    continueButton: {
      width: "100%",
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    continueButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
  }), [theme, themeMode]);

  const [setup, setSetup] = useState<Partial<FinancialSetup> | null>(
    initialValue ?? null
  );

  const [loadingSetup, setLoadingSetup] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [submittedSetup, setSubmittedSetup] = useState<FinancialSetup | null>(null);

  const loadFinancialSetup = useCallback(async () => {
    try {
      setLoadingSetup(true);
      setLoadError(null);
      setSubmitError(null);
      setSuccessMessage(null);

      const response = await FinancialSetupApi.getFinancialSetup();

      if (!response.success || !response.data) {
        setSetup(null);
        setLoadError(response.message || t("financialSetup.load_error"));
        return;
      }

      setSetup(response.data);
    } catch (error: unknown) {
      setSetup(null);
      setLoadError(getErrorMessage(error, t("financialSetup.load_error")));
    } finally {
      setLoadingSetup(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setLoadingSetup(false);
      setSaving(false);
      setLoadError(null);
      setSubmitError(null);
      setSubmittedSetup(null);
      return;
    }

    setSubmitError(null);
    setSuccessMessage(null);

    if (initialValue) {
      setSetup(initialValue);
      setLoadError(null);
      return;
    }

    if (mode === "edit") {
      void loadFinancialSetup();
      return;
    }

    setSetup(null);
    setLoadError(null);
  }, [visible, mode, initialValue, loadFinancialSetup]);

  const handleSubmit = async (payload: UpdateFinancialSetupPayload) => {
    try {
      setSaving(true);
      setSubmitError(null);
      setSuccessMessage(null);

      const response =
        await FinancialSetupApi.updateFinancialSetup(payload);

      if (!response.success || !response.data) {
        setSubmitError(response.message || t("financialSetup.save_error"));
        return;
      }

      const latestSetup = response.data;

      setSetup(latestSetup);
      setSubmittedSetup(latestSetup);

      // Trust the backend's gate: it's only true once autoInvestSurplus (and
      // the rest) are set. Reading it back keeps onboarding routing correct for
      // previously-onboarded users who must re-confirm the new preference.
      await updateCachedUser({
        financialSetupCompleted: latestSetup.financialSetupCompleted,
      });

      onSuccess?.(latestSetup);

      {submittedSetup ? (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons
              name="checkmark-circle"
              size={48}
              color="#047857"
            />
          </View>

          <Text style={styles.successTitle}>
            {mode === "onboarding"
              ? t("financialSetup.success_title_onboarding")
              : t("financialSetup.success_title_edit")}
          </Text>

          <Text style={styles.successDescription}>
            {mode === "onboarding"
              ? t("financialSetup.success_description_onboarding")
              : t("financialSetup.success_description_edit")}
          </Text>

          <Pressable
            style={styles.continueButton}
            onPress={onClose}
          >
            <Text style={styles.continueButtonText}>
              {t("financialSetup.continue")}
            </Text>
          </Pressable>
        </View>
      ) : loadingSetup ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>
            {t("financialSetup.loading")}
          </Text>
        </View>
      ) : loadError || (mode === "edit" && !setup) ? (
        <View style={styles.centerContainer}>
          {/* error UI */}
        </View>
      ) : (
        <FinancialSetupForm
          mode={mode}
          initialValue={setup}
          loading={saving}
          error={submitError}
          successMessage={successMessage}
          onSubmit={handleSubmit}
          onCancel={mode === "edit" ? onClose : undefined}
        />
      )}

      setSuccessMessage(t("financialSetup.save_success"));
      onSuccess?.(response.data as FinancialSetup);

      if (mode === "onboarding") {
        onClose?.();
      }
    } catch (err: any) {
      setSubmitError(err?.message || t("financialSetup.save_error"));
    } finally {
      setSaving(false);
    }
  };

  const canClose = mode === "edit";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={mode === "edit" ? onClose : undefined}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            {loadingSetup ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.primary} />

                <Text style={styles.loadingText}>
                  {t("financialSetup.loading")}
                </Text>
              </View>
            ) : loadError || (mode === "edit" && !setup) ? (
              <View style={styles.centerContainer}>
                <View style={styles.errorIcon}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={28}
                    color="#B91C1C"
                  />
                </View>

                <Text style={styles.errorTitle}>
                  {t("financialSetup.load_error_title")}
                </Text>

                <Text style={styles.errorMessage}>
                  {loadError || t("financialSetup.load_error")}
                </Text>

                <View style={styles.errorActions}>
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => void loadFinancialSetup()}
                  >
                    <Text style={styles.retryButtonText}>
                      {t("financialSetup.retry")}
                    </Text>
                  </Pressable>

                  {onClose && (
                    <Pressable
                      style={styles.closeButton}
                      onPress={onClose}
                    >
                      <Text style={styles.closeButtonText}>
                        {t("financialSetup.close")}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <FinancialSetupForm
                mode={mode}
                initialValue={setup}
                loading={saving}
                error={submitError}
                successMessage={successMessage}
                onSubmit={handleSubmit}
                onCancel={mode === "edit" ? onClose : undefined}
              />
            )}
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
