import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RememberMeCheckboxProps {
    isChecked: boolean;
    onToggle: (isChecked: boolean) => void;
    label: string;
}

export const RememberMeCheckbox: React.FC<RememberMeCheckboxProps> = ({
    isChecked,
    onToggle,
    label,
}) => {
    return (
        <Pressable
            style={styles.container}
            onPress={() => onToggle(!isChecked)}
        >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                )}
            </View>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#A8A3D7',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxChecked: {
        backgroundColor: '#3629B7',
        borderColor: '#3629B7',
    },
    label: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
});
