import { Pressable, View, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../theme/ThemeProvider";
import { useEffect, useRef } from "react";

// Legacy: toggle 2 chế độ light/dark từ trước khi có 3 theme. Hiện không được
// import ở đâu — bộ chọn theme chính thức nằm trong SettingsModal của profile.
export function ThemeSwitch() {
  const { mode, setMode, theme } = useThemeMode();
  const isLight = mode === "light";
  const toggleMode = () => setMode(isLight ? "dark" : "light");
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isLight ? 2 : 34,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mode, translateX]);

  return (
    <Pressable
      onPress={toggleMode}
      style={[
        styles.toggleContainer,
        {
          backgroundColor: isLight ? "#E0E0E0" : theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Left Icon (Sun) */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="sunny"
          size={16}
          color={isLight ? theme.primary : "#999"}
        />
      </View>

      {/* Animated Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: "#FFFFFF",
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Right Icon (Moon) */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="moon"
          size={16}
          color={!isLight ? theme.primary : "#999"}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggleContainer: {
    width: 70,
    height: 32,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    borderWidth: 1,
    position: "relative",
  },
  iconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  thumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    left: 2,
  },
});