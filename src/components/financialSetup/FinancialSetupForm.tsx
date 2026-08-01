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
import { useThemeMode } from "../../theme/ThemeProvider";
import { Theme, ThemeMode } from "../../theme/tokens";
import {
  FinancialSetup,
  type FocusMode,
  type InterventionLevel,
  type SavingPace,
  UpdateFinancialSetupPayload,
  getFinancialSetupLabel,
  type FinancialSetupChoice,

} from "../../types/financialSetup";
import { FINANCIAL_SETUP_OPTIONS } from "../../constants/financialSetup";
import {
  formatNumberWithDots,
  parseCurrencyToNumber,
} from "../../utils/project";

type Option<T extends string> = {
  value: T;
  labelKey: string;
  descriptionKey: string;
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

// ==================== DYNAMIC STYLES ====================
// Styles dùng chung cho FinancialSetupForm + OptionGroup + BooleanChoiceGroup,
// build lại theo theme hiện tại (light / dark / green).
function useFinancialSetupStyles() {
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;

  const styles = useMemo(() => createStyles(theme, mode, accent, surface), [theme, mode]);

  return { styles, theme, mode, accent, surface };
}

const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string) =>
  StyleSheet.create({
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
      backgroundColor: theme.primary,
      marginBottom: 7,
    },

    title: {
      fontSize: 22,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 24,
      marginBottom: 3,
    },

    subtitle: {
      fontSize: 13,
      color: theme.subtext,
      lineHeight: 16,
    },

    group: {
      marginBottom: 16,
    },

    groupTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 5,
    },

    groupDescription: {
      fontSize: 12,
      color: theme.subtext,
      lineHeight: 16,
      marginBottom: 9,
    },

    supportText: {
      fontSize: 12,
      color: theme.subtext,
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
      minHeight: 94,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.2,
      borderColor: theme.border,
      borderRadius: 13,
      backgroundColor: surface,
      paddingHorizontal: 4,
      paddingVertical: 9,
    },

    optionTileSelected: {
      borderColor: accent,
      backgroundColor: accent + "15",
    },

    optionIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.inputBg,
      marginBottom: 6,
    },

    optionIconSelected: {
      backgroundColor: accent,
    },

    optionLabel: {
      width: "100%",
      fontSize: 13,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      lineHeight: 15,
    },

    optionLabelSelected: {
      color: accent,
    },

    optionDescription: {
      width: "100%",
      fontSize: 10.5,
      fontWeight: "500",
      color: theme.subtext,
      textAlign: "center",
      lineHeight: 13,
      marginTop: 3,
    },

    optionDescriptionSelected: {
      color: accent,
    },

    choiceList: {
      gap: 10,
    },

    choiceRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.2,
      borderColor: theme.border,
      borderRadius: 13,
      backgroundColor: surface,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    choiceRowSelected: {
      borderColor: accent,
      backgroundColor: accent + "15",
    },

    choiceTextWrap: {
      flex: 1,
      marginLeft: 12,
      marginRight: 10,
    },

    choiceLabel: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 18,
    },

    choiceDescription: {
      fontSize: 11.5,
      fontWeight: "500",
      color: theme.subtext,
      lineHeight: 15,
      marginTop: 3,
    },

    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },

    radioSelected: {
      borderColor: accent,
    },

    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: accent,
    },

    choiceError: {
      fontSize: 12,
      color: "#B91C1C",
      marginTop: 8,
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

function OptionGroup<T extends string>({
  title,
  description,
  value,
  options,
  onChange,
}: {
  title: string;
  description?: string;
  value: T | null;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
}) {
  const { styles, accent } = useFinancialSetupStyles();
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>

      {!!description && (
        <Text style={styles.groupDescription}>{description}</Text>
      )}

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
                  color={selected ? "#FFFFFF" : accent}
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
                {t(option.labelKey)}
              </Text>

              {!!option.descriptionKey && (
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[
                    styles.optionDescription,
                    selected && styles.optionDescriptionSelected,
                  ]}
                >
                  {t(option.descriptionKey)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type BooleanOption = {
  value: boolean;
  labelKey: string;
  descriptionKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

// Two-option radio for a required boolean preference. Renders as stacked rows
// (rather than the 3-across tiles) so the longer helper text stays readable.
function BooleanChoiceGroup({
  title,
  description,
  value,
  options,
  onChange,
  error,
}: {
  title: string;
  description?: string;
  value: boolean | null;
  options: readonly BooleanOption[];
  onChange: (value: boolean) => void;
  error?: string;
}) {
  const { styles, accent } = useFinancialSetupStyles();
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>

      {!!description && (
        <Text style={styles.groupDescription}>{description}</Text>
      )}

      <View style={styles.choiceList}>
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[
                styles.choiceRow,
                selected && styles.choiceRowSelected,
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
                  color={selected ? "#FFFFFF" : accent}
                />
              </View>

              <View style={styles.choiceTextWrap}>
                <Text
                  style={[
                    styles.choiceLabel,
                    selected && styles.optionLabelSelected,
                  ]}
                >
                  {t(option.labelKey)}
                </Text>

                <Text style={styles.choiceDescription}>
                  {t(option.descriptionKey)}
                </Text>
              </View>

              <View
                style={[styles.radio, selected && styles.radioSelected]}
              >
                {selected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {!!error && <Text style={styles.choiceError}>{error}</Text>}
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
  const { styles } = useFinancialSetupStyles();
  const [income, setIncome] = useState("");
  const [savingPace, setSavingPace] =
    useState<SavingPace | null>(FINANCIAL_SETUP_OPTIONS.savingPace[1].value);
  const [interventionLevel, setInterventionLevel] =
    useState<InterventionLevel | null>(FINANCIAL_SETUP_OPTIONS.interventionLevel[1].value);
  const [focusMode, setFocusMode] =
    useState<FocusMode | null>(FINANCIAL_SETUP_OPTIONS.focusMode[2].value);
  // Required, no default — the user must actively choose (mirrors the backend gate).
  const [autoInvestSurplus, setAutoInvestSurplus] =
    useState<boolean | null>(null);
  const [incomeError, setIncomeError] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    const initialIncome = Number(initialValue?.income ?? 0);

    setIncome(
      initialIncome > 0 ? formatNumberWithDots(initialIncome) : ""
    );

    setSavingPace(initialValue?.savingPace ?? "BALANCED");
    setInterventionLevel(initialValue?.interventionLevel ?? "GENTLE");
    setFocusMode(initialValue?.focusMode ?? "TRACK_ONLY");
    // No default: only a value the user (or backend) has explicitly set counts.
    setAutoInvestSurplus(
      initialValue?.autoInvestSurplus ?? null
    );
    setIncomeError("");
    setAttemptedSubmit(false);
  }, [
    initialValue?.income,
    initialValue?.savingPace,
    initialValue?.interventionLevel,
    initialValue?.focusMode,
    initialValue?.autoInvestSurplus,
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
      !!focusMode &&
      autoInvestSurplus !== null
    );
  }, [income, savingPace, interventionLevel, focusMode, autoInvestSurplus]);

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
    setAttemptedSubmit(true);

    const parsedIncome = parseCurrencyToNumber(income);

    if (parsedIncome <= 0) {
      setIncomeError(t("financialSetup.income_error"));
      return;
    }

    if (!savingPace || !interventionLevel || !focusMode) {
      return;
    }

    // Required, no default — never submit without an explicit choice.
    if (autoInvestSurplus === null) {
      return;
    }

    void onSubmit({
      income: parsedIncome,
      savingPace,
      interventionLevel,
      focusMode,
      autoInvestSurplus,
    });
  };

  return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
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
          description={t("financialSetup.pace_description")}
          value={savingPace}
          options={FINANCIAL_SETUP_OPTIONS.savingPace}
          onChange={setSavingPace}
        />

        <OptionGroup<InterventionLevel>
          title={t("financialSetup.support_title")}
          description={t("financialSetup.support_description")}
          value={interventionLevel}
          options={FINANCIAL_SETUP_OPTIONS.interventionLevel}
          onChange={setInterventionLevel}
        />

        <OptionGroup<FocusMode>
          title={t("financialSetup.focus_title")}
          description={t("financialSetup.focus_description")}
          value={focusMode}
          options={FINANCIAL_SETUP_OPTIONS.focusMode}
          onChange={setFocusMode}
        />

        <BooleanChoiceGroup
          title={t("financialSetup.auto_invest_title")}
          description={t("financialSetup.auto_invest_description")}
          value={autoInvestSurplus}
          options={[
            {
              value: true,
              labelKey: "financialSetup.auto_invest_yes_label",
              descriptionKey: "financialSetup.auto_invest_yes_desc",
              icon: "trending-up-outline",
            },
            {
              value: false,
              labelKey: "financialSetup.auto_invest_no_label",
              descriptionKey: "financialSetup.auto_invest_no_desc",
              icon: "wallet-outline",
            },
          ]}
          onChange={setAutoInvestSurplus}
          error={
            attemptedSubmit && autoInvestSurplus === null
              ? t("financialSetup.auto_invest_required")
              : undefined
          }
        />

        {!!error && (
          <View style={styles.messageError}>
            <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
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
            <Text style={styles.messageSuccessText}>{successMessage}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          {mode === "edit" && onCancel && (
            <View style={styles.halfButton}>
              <ButtonSave
                label="Cancel"
                variant="secondary"
                onPress={onCancel}
                disabled={loading}
              />
            </View>
          )}

          <View style={mode === "edit" ? styles.halfButton : styles.fullButton}>
            <ButtonSave
              label={ctaLabel}
              onPress={handleSubmit}
              loading={loading}
              loadingText="Saving..."
              disabled={!canSubmit}
            />
          </View>
        </View>
      </ScrollView>
  );
}
