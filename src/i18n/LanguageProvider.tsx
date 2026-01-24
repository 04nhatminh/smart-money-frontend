import React, { createContext, useContext, useMemo, useState } from "react";
import { i18n, type Lang } from "./index";

type LangCtx = { lang: Lang; toggleLang: () => void; setLang: (l: Lang) => void };
const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const initial: Lang = i18n.locale === "vi" ? "vi" : "en";
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = (l: Lang) => {
    i18n.locale = l;
    setLangState(l);
  };

  const toggleLang = () => setLang(lang === "en" ? "vi" : "en");
  const value = useMemo(() => ({ lang, toggleLang, setLang }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
