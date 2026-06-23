import React from "react";
import { Pressable, Text, View } from "react-native";
import { projectStyles as styles } from "../../styles/projectStyles";
import { ProjectType } from "../../types/project.types";
import { t } from "../../i18n";

type Props = {
  value: ProjectType;
  onChange: (value: ProjectType) => void;
};

export default function ProjectTypeTabs({ value, onChange }: Props) {
  return (
    <View style={styles.typeRow}>
      <Pressable
        style={[
          styles.typeBtn,
          value === "PERSONAL" && styles.typeBtnActive,
        ]}
        onPress={() => onChange("PERSONAL")}
      >
        <Text
          style={[
            styles.typeButtonText,
            value === "PERSONAL" && styles.typeButtonTextActive,
          ]}
        >
          {t("project.type_personal")}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.typeBtn,
          value === "GROUP" && styles.typeBtnActive,
        ]}
        onPress={() => onChange("GROUP")}
      >
        <Text
          style={[
            styles.typeButtonText,
            value === "GROUP" && styles.typeButtonTextActive,
          ]}
        >
          {t("project.type_group")}
        </Text>
      </Pressable>
    </View>
  );
}
