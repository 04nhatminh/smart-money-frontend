import AsyncStorage from "@react-native-async-storage/async-storage";
import { setLanguage, type Lang } from "./index";

const KEY = "lang";

export async function loadLanguageFromStorage(): Promise<Lang | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);

    if (v === "en" || v === "vi") {
      setLanguage(v as Lang);
      return v as Lang; // ✅ trả về luôn
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function saveLanguageToStorage(lang: Lang) {
  try {
    await AsyncStorage.setItem(KEY, lang);
    setLanguage(lang);
  } catch (e) {
    // ignore
  }
}
