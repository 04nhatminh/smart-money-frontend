import React from "react";
import { Pressable, Text, View } from "react-native";
import { ProjectFilterType } from "../../types/project.types";
import { useProjectListStyles } from "../../styles/projectListStyles";
import { t } from "../../i18n";

type Props = {
  value: ProjectFilterType;
  onChange: (value: ProjectFilterType) => void;
};

export default function ProjectFilterTabs({ value, onChange }: Props) {
  const { styles } = useProjectListStyles();

  return (
    <View style={styles.filterTabs}>
      <Pressable
        style={[
          styles.filterTabButton,
          value === "ALL" && styles.filterTabButtonActive,
        ]}
        onPress={() => onChange("ALL")}
      >
        <Text
          style={[
            styles.filterTabText,
            value === "ALL" && styles.filterTabTextActive,
          ]}
        >
          {t("project.all_projects")}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.filterTabButton,
          value === "PERSONAL" && styles.filterTabButtonActive,
        ]}
        onPress={() => onChange("PERSONAL")}
      >
        <Text
          style={[
            styles.filterTabText,
            value === "PERSONAL" && styles.filterTabTextActive,
          ]}
        >
          {t("project.type_personal")}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.filterTabButton,
          value === "GROUP" && styles.filterTabButtonActive,
        ]}
        onPress={() => onChange("GROUP")}
      >
        <Text
          style={[
            styles.filterTabText,
            value === "GROUP" && styles.filterTabTextActive,
          ]}
        >
          {t("project.type_group")}
        </Text>
      </Pressable>
    </View>
  );
}
