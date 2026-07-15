import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { themes, type ThemeMode } from "./tokens";
import { themeStorage } from "../storage/themeStorage";

type ThemeCtx = {
  mode: ThemeMode;
  theme: (typeof themes)["light"];
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await themeStorage.getTheme();
        console.log("[ThemeProvider] Loaded from storage:", savedTheme);
        if (savedTheme) {
          setModeState(savedTheme);
        }
      } catch (error) {
        console.error("[ThemeProvider] Error loading theme:", error);
      }
    };
    loadTheme();
  }, []);

  const setMode = (m: ThemeMode) => {
    console.log("[ThemeProvider] Setting theme to:", m);
    setModeState(m);
    themeStorage.setTheme(m).catch((e) => console.error("[ThemeProvider] Error saving theme:", e));
  };
  const toggleMode = () => setMode(mode === "light" ? "dark" : "light");

  const value = useMemo(() => {
    const theme = themes[mode];
    return { mode, theme, setMode, toggleMode };
  }, [mode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeProvider");
  return ctx;
}
