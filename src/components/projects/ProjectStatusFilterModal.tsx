import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { projectListStyles as styles } from "../../styles/projectListStyles";
import { ProjectStatusFilter } from "../../types/project.types";

type Props = {
    visible: boolean;
    value: ProjectStatusFilter;
    onClose: () => void;
    onChange: (value: ProjectStatusFilter) => void;
}

const OPTIONS: { label: string; value: ProjectStatusFilter }[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "Ongoing", value: "ONGOING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Overdue", value: "OVERDUE" },
];

export default function ProjectStatusFilterModal(
    { visible, value, onClose, onChange }: Props) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable style={styles.filterOverlay} onPress={onClose}>
                <View style={styles.filterModalCard}>
                    {OPTIONS.map((item) => {
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
                                <Text style={[
                                    styles.filterOptionText,
                                    active && styles.filterOptionTextActive
                                ]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Pressable>
        </Modal>
    )
}