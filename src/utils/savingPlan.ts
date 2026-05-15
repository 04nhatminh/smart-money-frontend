import savingPlanSuggestionJson from "../mock/savingPlanSuggestion.json";
import {
  SavingPlanAIResponse,
  SavingPlanMode,
} from "../types/project.types";

const savingPlanSuggestionMap =
  savingPlanSuggestionJson as Record<SavingPlanMode, SavingPlanAIResponse>;

export function getSavingPlanSuggestion(mode: SavingPlanMode) {
  return savingPlanSuggestionMap[mode];
}