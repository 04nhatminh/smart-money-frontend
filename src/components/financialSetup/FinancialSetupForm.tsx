import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ButtonSave } from "../ButtonSave";
import { InputField } from "../InputField";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";
import {
  FinancialSetup,
  FINANCIAL_SETUP_OPTIONS,
  type FocusMode,
  type InterventionLevel,
  type SavingPace,
  UpdateFinancialSetupPayload,
} from "../../types/financialSetup";
import {
  formatNumberWithDots,
  parseCurrencyToNumber,
} from "../../utils/project";

type Option<T extends string> = {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props = {
  mode: "onboarding" | "edit";
  initialValue?: Partial<FinancialSetup> | null;
  loading?: boolean;
  error?: string | null;
  successMessage?: string | null;
  onSubmit: (payload: UpdateFinancialSetupPayload) => void | Promise<void>;
  onCancel?: () => void;
};


function OptionGroup<T extends string>({
  title,
  value,
  options,
  onChange,
  getLabel,
}: {
  title: string;
  value: T | null;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  /** Resolves a localized label; falls back to the option's static label. */
  getLabel?: (value: T) => string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>

      <View style={styles.optionGrid}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.optionTile,
                selected && styles.optionTileSelected,
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  selected && styles.optionIconSelected,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={selected ? "#FFFFFF" : "#4B3FD6"}
                />
              </View>

              <Text
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[
                  styles.optionLabel,
                  selected && styles.optionLabelSelected,
                ]}
              >
                {getLabel ? getLabel(option.value) : option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function FinancialSetupForm({
  mode,
  initialValue,
  loading = false,
  error,
  successMessage,
  onSubmit,
  onCancel,
}: Props) {
  useLanguage(); // re-render on EN/VI switch
  const [income, setIncome] = useState("");
  const [savingPace, setSavingPace] =
    useState<SavingPace | null>(FINANCIAL_SETUP_OPTIONS.savingPace[1].value);
  const [interventionLevel, setInterventionLevel] =
    useState<InterventionLevel | null>(FINANCIAL_SETUP_OPTIONS.interventionLevel[1].value);
  const [focusMode, setFocusMode] =
    useState<FocusMode | null>(FINANCIAL_SETUP_OPTIONS.focusMode[2].value);
  const [incomeError, setIncomeError] = useState("");

  useEffect(() => {
    const initialIncome = Number(initialValue?.income ?? 0);

    setIncome(
      initialIncome > 0 ? formatNumberWithDots(initialIncome) : ""
    );

    setSavingPace(initialValue?.savingPace ?? "BALANCED");
    setInterventionLevel(initialValue?.interventionLevel ?? "GENTLE");
    setFocusMode(initialValue?.focusMode ?? "TRACK_ONLY");
    setIncomeError("");
  }, [
    initialValue?.income,
    initialValue?.savingPace,
    initialValue?.interventionLevel,
    initialValue?.focusMode,
  ]);

  const ctaLabel =
    mode === "edit"
      ? t("financialSetup.cta_edit")
      : t("financialSetup.cta_onboarding");

  const canSubmit = useMemo(() => {
    const parsedIncome = parseCurrencyToNumber(income);

    return (
      parsedIncome > 0 &&
      !!savingPace &&
      !!interventionLevel &&
      !!focusMode
    );
  }, [income, savingPace, interventionLevel, focusMode]);

  const handleIncomeChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (!digitsOnly) {
      setIncome("");
      setIncomeError("");
      return;
    }

    const parsedIncome = Number(digitsOnly);

    setIncome(formatNumberWithDots(parsedIncome));

    if (parsedIncome > 0) {
      setIncomeError("");
    }
  };

  const handleSubmit = () => {
    const parsedIncome = parseCurrencyToNumber(income);

    if (parsedIncome <= 0) {
      setIncomeError(t("financialSetup.income_error"));
      return;
    }

    if (!savingPace || !interventionLevel || !focusMode) {
      return;
    }

    void onSubmit({
      income: parsedIncome,
      savingPace,
      interventionLevel,
      focusMode,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>{t("financialSetup.title")}</Text>

          <Text style={styles.subtitle}>
            {t("financialSetup.subtitle")}
          </Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>
            {t("financialSetup.income_label")}
          </Text>

          <InputField
            iconName="cash-outline"
            placeholder={t("financialSetup.income_placeholder")}
            value={income}
            onChangeText={handleIncomeChange}
            keyboardType="numeric"
            rightText="VND"
            error={incomeError}
          />

          <Text style={styles.supportText}>
            {t("financialSetup.income_support")}
          </Text>
        </View>

        <OptionGroup<SavingPace>
          title={t("financialSetup.pace_title")}
          value={savingPace}
          options={FINANCIAL_SETUP_OPTIONS.savingPace}
          onChange={setSavingPace}
          getLabel={(v) => t(`financialSetup.savingPace.${v}`)}
        />

        <OptionGroup<InterventionLevel>
          title={t("financialSetup.support_title")}
          value={interventionLevel}
          options={FINANCIAL_SETUP_OPTIONS.interventionLevel}
          onChange={setInterventionLevel}
          getLabel={(v) => t(`financialSetup.interventionLevel.${v}`)}
        />

        <OptionGroup<FocusMode>
          title={t("financialSetup.focus_title")}
          value={focusMode}
          options={FINANCIAL_SETUP_OPTIONS.focusMode}
          onChange={setFocusMode}
          getLabel={(v) => t(`financialSetup.focusMode.${v}`)}
        />

        {!!error && (
          <View style={styles.messageError}>
            <Ionicons
              name="alert-circle-outline"
              size={16}
              color="#B91C1C"
            />
            <Text style={styles.messageErrorText}>{error}</Text>
          </View>
        )}

        {!!successMessage && (
          <View style={styles.messageSuccess}>
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#047857"
            />
            <Text style={styles.messageSuccessText}>
              {successMessage}
            </Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          {mode === "edit" && onCancel && (
            <View style={styles.halfButton}>
              <ButtonSave
                label={t("financialSetup.cancel")}
                variant="secondary"
                onPress={onCancel}
                disabled={loading}
              />
            </View>
          )}

          <View
            style={mode === "edit" ? styles.halfButton : styles.fullButton}
          >
            <ButtonSave
              label={ctaLabel}
              onPress={handleSubmit}
              loading={loading}
              loadingText={t("financialSetup.saving")}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },

  content: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  header: {
    marginBottom: 14,
  },

  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4B3FD6",
    marginBottom: 7,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 3,
  },

  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 16,
  },

  group: { 
    marginBottom: 16, 
  }, 
  
  groupTitle: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: "#111827", 
    marginBottom: 9, 
  },

  supportText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },

  optionGrid: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    width: "88%", 
    alignSelf: "center", 
  }, 
  
  optionTile: { 
    width: "30.5%", 
    minWidth: 0, 
    minHeight: 76, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 1.2, 
    borderColor: "#E5E7EB", 
    borderRadius: 13, 
    backgroundColor: "#FFFFFF", 
    paddingHorizontal: 4, 
    paddingVertical: 9, 
  }, 
  
  optionTileSelected: { 
    borderColor: "#4B3FD6", 
    backgroundColor: "#F5F3FF", 
  }, 
  
  optionIcon: { 
    width: 30, 
    height: 30, 
    borderRadius: 10, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#EEF2FF", 
    marginBottom: 6, 
  }, 
  
  optionIconSelected: { 
    backgroundColor: "#4B3FD6", 
  }, 
  
  optionLabel: { 
    width: "100%", 
    fontSize: 13, 
    fontWeight: "800", 
    color: "#374151", 
    textAlign: "center", 
    lineHeight: 14, 
  }, 
  
  optionLabelSelected: { 
    color: "#3324C9", 
  },

  messageError: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FEE2E2",
    marginBottom: 12,
  },

  messageErrorText: {
    flex: 1,
    marginLeft: 7,
    color: "#B91C1C",
    fontSize: 12,
    lineHeight: 16,
  },

  messageSuccess: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#D1FAE5",
    marginBottom: 12,
  },

  messageSuccessText: {
    flex: 1,
    marginLeft: 7,
    color: "#047857",
    fontSize: 12,
    lineHeight: 16,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },

  halfButton: {
    width: "48.5%",
  },

  fullButton: {
    width: "100%",
  },
});
