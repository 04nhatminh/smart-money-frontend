import React, { createContext, useContext, useMemo, useState } from "react";
import { themes, type ThemeMode } from "./tokens";

type ThemeCtx = {
  mode: ThemeMode;
  theme: (typeof themes)["light"];
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  const setMode = (m: ThemeMode) => setModeState(m);
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
