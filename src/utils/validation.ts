import { t } from "../i18n";

export function validateLogin(email: string, password: string) {
  if (!email) return t("errors.requiredEmail");
  if (!email.includes("@")) return t("errors.invalidEmail");
  if (!password) return t("errors.requiredPassword");
  return null;
}