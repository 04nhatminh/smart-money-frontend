import React from "react";
import { Modal, View, Text, StyleSheet, Image, ImageSourcePropType} from "react-native";
import { ButtonSave } from "./ButtonSave";
import { t } from "../i18n";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  imageSource?: ImageSourcePropType;
  confirmVariant?: "primary" | "secondary" | "danger";
}

export default function ConfirmExitModal({
  visible,
  onCancel,
  onConfirm,
  title,
  description,
  cancelText,
  confirmText,
  imageSource,
  confirmVariant = "danger",
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={imageSource || require("../../assets/confirm-exit.jpg")}
            style={styles.image}
          />

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.desc}>
            {description}
          </Text>

          <View style={styles.buttons}>
            <ButtonSave
              label={cancelText || t("common.cancel")}
              variant="secondary"
              onPress={onCancel}
            />

            <ButtonSave
              label={confirmText || t("common.continue")}
              variant={confirmVariant}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "80%",
    minHeight: 340,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
  },

  image: {
    width: 164,
    height: 120,
    margin: 20,
    resizeMode: "contain",
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#FF4D6D",
    margin: 8,
  },

  desc: {
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
    color: "#374151",
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
});