import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorMessageProps {
    message: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
    if (!message) return null;

    return (
        <View style={styles.container}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.text}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        gap: 6,
    },
        color: '#EF4444',
        fontSize: 12,
        flex: 1,
    },
});
