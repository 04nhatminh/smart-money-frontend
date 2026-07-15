import { t } from "../i18n";

export function validateLogin(email: string, password: string) {
  if (!email) return t("errors.required_email");
  if (!email.includes("@")) return t("errors.invalid_email");
  if (!password) return t("errors.required_password");
  return null;
}