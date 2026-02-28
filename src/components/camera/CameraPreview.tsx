import React from "react";
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../theme/ThemeProvider";

type Props = {
  uri: string;
  onRetake: () => void;
  onConfirm: (uri: string) => void;
};

export function CameraPreview({ uri, onRetake, onConfirm }: Props) {
  const { theme } = useThemeMode();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Preview</Text>
      </View>

      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image source={{ uri }} style={styles.image} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={onRetake}
          style={[styles.btn, { borderColor: theme.border, borderWidth: 1 }]}
        >
          <Ionicons name="refresh" size={20} color={theme.primary} />
          <Text style={[styles.btnText, { color: theme.text }]}>Chụp lại</Text>
        </Pressable>

        <Pressable
          onPress={() => onConfirm(uri)}
          style={[styles.btn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Xác nhận</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
