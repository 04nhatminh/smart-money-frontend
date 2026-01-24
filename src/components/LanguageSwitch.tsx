import { Pressable, Text, StyleSheet } from "react-native";
import { useLanguage } from "../i18n/LanguageProvider";

export function LanguageSwitch() {
  const { lang, toggleLang } = useLanguage();

  return (
    <Pressable onPress={toggleLang} style={styles.btn}>
      <Text style={styles.text}>{lang.toUpperCase()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  text: { fontWeight: "700" },
});
