import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import en from "./locales/en";
import vi from "./locales/vi";

export const i18n = new I18n({ en, vi });

const rawLang = Localization.getLocales?.()?.[0]?.languageCode ?? "en";
i18n.locale = rawLang === "vi" ? "vi" : "en";
i18n.enableFallback = true;

export type Lang = "en" | "vi";

export function t(key: string, options?: Record<string, any>) {
  return i18n.t(key, options);
}

export function setLanguage(lang: Lang) {
  i18n.locale = lang;
}
