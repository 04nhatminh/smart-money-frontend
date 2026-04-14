import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ThemeMode } from "../theme/tokens";

const KEY = "theme_mode";

export const themeStorage = {
  async setTheme(mode: ThemeMode) {
    try {
      await AsyncStorage.setItem(KEY, mode);
    } catch (e) {
      console.error("Error saving theme:", e);
    }
  },

  async getTheme(): Promise<ThemeMode | null> {
    try {
      const value = await AsyncStorage.getItem(KEY);
      if (value === "light" || value === "dark") {
        return value as ThemeMode;
      }
      return null;
    } catch (e) {
      console.error("Error loading theme:", e);
      return null;
    }
  },
};
