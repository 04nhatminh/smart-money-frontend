import {
  FocusMode,
  InterventionLevel,
  SavingPace,
} from "../types/financialSetup";

import { Ionicons } from "@expo/vector-icons";

export type FinancialSetupOption<T extends string> = {
  value: T;
  labelKey: string;
  descriptionKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const FINANCIAL_SETUP_OPTIONS = {
  savingPace: [
    {
      value: "RELAXED",
      labelKey: "financialSetup.savingPace.RELAXED",
      descriptionKey:
        "financialSetup.savingPaceDescription.RELAXED",
      icon: "leaf-outline",
    },
    {
      value: "BALANCED",
      labelKey: "financialSetup.savingPace.BALANCED",
      descriptionKey:
        "financialSetup.savingPaceDescription.BALANCED",
      icon: "scale-outline",
    },
    {
      value: "AGGRESSIVE",
      labelKey: "financialSetup.savingPace.AGGRESSIVE",
      descriptionKey:
        "financialSetup.savingPaceDescription.AGGRESSIVE",
      icon: "flash-outline",
    },
  ] satisfies readonly FinancialSetupOption<SavingPace>[],

  interventionLevel: [
    {
      value: "NOTIFY",
      labelKey:
        "financialSetup.interventionLevel.NOTIFY",
      descriptionKey:
        "financialSetup.interventionLevelDescription.NOTIFY",
      icon: "notifications-outline",
    },
    {
      value: "GENTLE",
      labelKey:
        "financialSetup.interventionLevel.GENTLE",
      descriptionKey:
        "financialSetup.interventionLevelDescription.GENTLE",
      icon: "chatbubble-outline",
    },
    {
      value: "HARD",
      labelKey:
        "financialSetup.interventionLevel.HARD",
      descriptionKey:
        "financialSetup.interventionLevelDescription.HARD",
      icon: "shield-checkmark-outline",
    },
  ] satisfies readonly FinancialSetupOption<InterventionLevel>[],

  focusMode: [
    {
      value: "SAVE_MORE",
      labelKey:
        "financialSetup.focusMode.SAVE_MORE",
      descriptionKey:
        "financialSetup.focusModeDescription.SAVE_MORE",
      icon: "trending-up-outline",
    },
    {
      value: "REDUCE_SPENDING",
      labelKey:
        "financialSetup.focusMode.REDUCE_SPENDING",
      descriptionKey:
        "financialSetup.focusModeDescription.REDUCE_SPENDING",
      icon: "cut-outline",
    },
    {
      value: "TRACK_ONLY",
      labelKey:
        "financialSetup.focusMode.TRACK_ONLY",
      descriptionKey:
        "financialSetup.focusModeDescription.TRACK_ONLY",
      icon: "analytics-outline",
    },
  ] satisfies readonly FinancialSetupOption<FocusMode>[],
} as const;