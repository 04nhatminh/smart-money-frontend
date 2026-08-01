import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { Theme, themes, type ThemeMode } from "./tokens";
import { themeStorage } from "../storage/themeStorage";

type ThemeCtx = {
  mode: ThemeMode;
  theme: Theme;
  setMode: (m: ThemeMode) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await themeStorage.getTheme();
      if (savedTheme) {
        setModeState(savedTheme);
      }
    };

    loadTheme();
  }, []);

  const setMode = async (mode: ThemeMode) => {
    setModeState(mode);
    await themeStorage.setTheme(mode);
  };

  const value = useMemo(
    () => ({
      mode,
      theme: themes[mode],
      setMode,
    }),
    [mode]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useThemeMode must be used within ThemeProvider");
  }

  return ctx;
}