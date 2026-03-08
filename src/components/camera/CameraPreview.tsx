import React from "react";
import {
  View,
  Image,
  StyleSheet,
  SafeAreaView,
  Text,
} from "react-native";
import { useThemeMode } from "../../theme/ThemeProvider";
import { ActionButton } from "../ActionButton";

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
        <ActionButton
          label="Chụp lại"
          onPress={onRetake}
          variant="secondary"
          icon="refresh"
          color={theme.primary}
          borderColor={theme.border}
        />

        <ActionButton
          label="Xác nhận"
          onPress={() => onConfirm(uri)}
          variant="primary"
          icon="checkmark"
        />
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
    paddingTop: 20,
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
