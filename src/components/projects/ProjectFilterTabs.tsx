import React from "react";
import { Pressable, Text, View } from "react-native";
import { ProjectFilterType } from "../../types/project.types";
import { projectListStyles as styles } from "../../styles/projectListStyles";

type Props = {
    value: ProjectFilterType;
    onChange: (value: ProjectFilterType) => void;
}

export default function ProjectFilterTabs({ value, onChange }: Props) {
    return (
        <View style={styles.filterTabs}>
            <Pressable
                style={[
                    styles.filterTabButton,
                    value === "ALL" && styles.filterTabButtonActive
                ]}
                onPress={() => onChange("ALL")}
            >
                <Text 
                    style={[
                        styles.filterTabText,
                        value === "ALL" && styles.filterTabTextActive
                    ]}
                >
                    All Projects
                </Text>
            </Pressable>

            <Pressable
                style={[
                    styles.filterTabButton,
                    value === "PERSONAL" && styles.filterTabButtonActive
                ]}
                onPress={() => onChange("PERSONAL")}
            >
                <Text
                    style={[
                        styles.filterTabText,
                        value === "PERSONAL" && styles.filterTabTextActive
                    ]}
                >
                    Personal
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
                Group
                </Text>
            </Pressable>
        </View>
    )
}
