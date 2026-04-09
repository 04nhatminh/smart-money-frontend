import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, Image, ImageSourcePropType } from "react-native";
import { t } from "../i18n";

interface Props {
  visible: boolean;
  onDone: () => void;
  title: string;
  description: string;
  buttonText?: string;
  imageSource?: ImageSourcePropType;
}

export default function SuccessModal({
  visible,
  onDone,
  title,
  description,
  buttonText,
  imageSource,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={imageSource || require("../../assets/successful.jpg")}
            style={styles.image}
          />

          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.desc}>
            {description}
          </Text>

          <Pressable style={styles.doneBtn} onPress={onDone}>
            <Text style={styles.doneText}>
              {buttonText || t("common.done")}
            </Text>
          </Pressable>
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
    color: "#3629B7",
    margin: 8,
  },

  desc: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
    color: "#374151",
  },

  doneBtn: {
    marginTop: 16,
    backgroundColor: "#3629B7",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
    minWidth: 120,
    alignItems: "center",
  },

  doneText: {
    color: "#fff",
    fontWeight: "600",
  },
});