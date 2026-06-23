import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { projectListStyles as styles } from "../../styles/projectListStyles";
import { ProjectStatusFilter } from "../../types/project.types";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  value: ProjectStatusFilter;
  onClose: () => void;
  onChange: (value: ProjectStatusFilter) => void;
};

export default function ProjectStatusFilterModal({
  visible,
  value,
  onClose,
  onChange,
}: Props) {
  const options: { label: string; value: ProjectStatusFilter }[] = [
    { label: t("project.status_active"), value: "ACTIVE" },
    { label: t("project.status_completed"), value: "COMPLETED" },
    { label: t("project.status_cancelled"), value: "CANCELLED" },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.filterOverlay} onPress={onClose}>
        <View style={styles.filterModalCard}>
          {options.map((item) => {
            const active = value === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.filterOption,
                  active && styles.filterOptionActive,
                ]}
                onPress={() => {
                  onChange(item.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    active && styles.filterOptionTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}
