import { Pressable, Text, StyleSheet } from "react-native";
import { useThemeMode } from "../theme/ThemeProvider";

export function ThemeSwitch() {
  const { mode, toggleMode, theme } = useThemeMode();

  return (
    <Pressable
      onPress={toggleMode}
      style={[styles.btn, { borderColor: theme.border, backgroundColor: theme.card }]}
    >
      <Text style={[styles.text, { color: theme.text }]}>
        {mode === "light" ? "☀️" : "🌙"} {mode.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: "700" },
});