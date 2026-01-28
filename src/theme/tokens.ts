export type ThemeMode = "light" | "dark";

export type Theme = {
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
    bg: "#EAF4F7",
    card: "#FFFFFF",
    text: "#111827",
    subtext: "#6B7280",
    inputBg: "#F3F4F6",
    border: "#E5E7EB",
    primary: "#1651a3",
    link: "#2563EB",
    fabBg: "#111827",
    fabIcon: "#FFFFFF",
  },
  dark: {
    bg: "#0B1220",
    card: "#0F1A2B",
    text: "#E5E7EB",
    subtext: "#9CA3AF",
    inputBg: "#111827",
    border: "#1F2937",
    primary: "#3B82F6",
    link: "#60A5FA",
    fabBg: "#FFFFFF",
    fabIcon: "#111827",
  },
};
