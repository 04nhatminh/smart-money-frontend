import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { i18n, type Lang } from "./index";
import { saveLanguageToStorage, loadLanguageFromStorage } from "./prefs";

type LangCtx = { lang: Lang; toggleLang: () => void; setLang: (l: Lang) => void };
const Ctx = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const initial: Lang = i18n.locale === "vi" ? "vi" : "en";
  const [lang, setLangState] = useState<Lang>(initial);

  // Load language from storage on mount
  useEffect(() => {
    const loadLang = async () => {
      try {
        const storedLang = await loadLanguageFromStorage();

        const finalLang: Lang = storedLang ?? "en";

        console.log("[LanguageProvider] Loaded:", finalLang);
        i18n.locale = finalLang;
        setLangState(finalLang); 

      } catch (error) {
        console.error(error);
      }
    };

    loadLang();
  }, []);

  const setLang = (l: Lang) => {
    console.log("[LanguageProvider] Setting language to:", l);
    i18n.locale = l;
    setLangState(l);
    saveLanguageToStorage(l).catch((e) => console.error("[LanguageProvider] Error saving language:", e));
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
