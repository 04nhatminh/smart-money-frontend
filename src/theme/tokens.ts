export type ThemeMode = "light" | "dark";

export type Theme = {
  mode: string;
  bg: string;
  card: string;
  text: string;
  subtext: string;
  inputBg: string;
  border: string;
  primary: string;
  link: string;
  fabBg: string;
  fabIcon: string;
};

export const themes: Record<ThemeMode, Theme> = {
  light: {
    bg: "#FFFFFF",
    card: "#FFFFFF",
    text: "#111827",
    subtext: "#6B7280",
    inputBg: "#F3F4F6",
    border: "#E5E7EB",
    primary: "#3629B7",
    link: "#5655B9",  
    fabBg: "#111827",
    fabIcon: "#FFFFFF",
    mode: "light"
  },
  dark: {
    bg: "#0B1220",
    card: "#0F1A2B",
    text: "#E5E7EB",
    subtext: "#9CA3AF",
    inputBg: "#111827",
    border: "#1F2937",
    primary: "#3629B7",
    link: "#5655B9",
    fabBg: "#FFFFFF",
    fabIcon: "#111827",
    mode: "dark"
  },
};
