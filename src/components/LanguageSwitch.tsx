import { Pressable, Text, StyleSheet } from "react-native";
import { useLanguage } from "../i18n/LanguageProvider";
import { useThemeMode } from "../theme/ThemeProvider";

export function LanguageSwitch() {
  const { lang, toggleLang } = useLanguage();
  const { theme } = useThemeMode();

  return (
    <Pressable
      onPress={toggleLang}
      style={[
        styles.btn,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: theme.text },
        ]}
      >
        {lang.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  text: { fontWeight: "700", color: "#fff" },
});
