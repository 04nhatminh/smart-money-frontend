import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import { useThemeMode } from "../../theme/ThemeProvider";
import { useRouter } from "expo-router";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AuthPromptModal({ visible, onClose }: Props) {
  const { theme } = useThemeMode();
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push("/(auth)/login");
  };

  const handleSignUp = () => {
    onClose();
    router.push("/(auth)/signup");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} style={styles.blur}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.buttonContainer}>
              <Pressable
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
                onPress={handleLogin}
              >
                <Text style={styles.buttonText}>{t("common.sign_in")}</Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.button,
                  styles.outlineButton,
                  { borderColor: theme.border },
                ]}
                onPress={handleSignUp}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  {t("common.sign_up")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    width: "80%",
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 24,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#FFFFFF",
  },
  closeText: {
    fontSize: 13,
    fontWeight: "600",
  },
});