import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ActionButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    loadingText?: string;
    color?: string;
    borderColor?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    onPress,
    variant = 'primary',
    icon,
    loading = false,
    disabled = false,
    loadingText = 'Loading...',
    color,
    borderColor,
}) => {
    const isPrimary = variant === 'primary';

    if (isPrimary) {
        return (
            <Pressable
                style={({ pressed }) => [
                    styles.primaryWrapper,
                    pressed && styles.primaryPressed,
                    (loading || disabled) && styles.disabledBtn,
                ]}
                onPress={onPress}
                disabled={loading || disabled}
            >
                <LinearGradient
                    colors={['#3629B7', '#5655B9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtn}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.buttonText}>{loadingText}</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonContent}>
                            {icon && <Ionicons name={icon as any} size={20} color="#FFFFFF" />}
                            <Text style={styles.buttonText}>{label}</Text>
                        </View>
                    )}
                </LinearGradient>
            </Pressable>
        );
    }

    // Secondary variant
    return (
        <Pressable
            style={({ pressed }) => [
                styles.secondaryBtn,
                {
                    borderColor: borderColor || '#E0E0E0',
                    borderWidth: 1,
                },
                pressed && styles.secondaryPressed,
                (loading || disabled) && styles.disabledBtn,
            ]}
            onPress={onPress}
            disabled={loading || disabled}
        >
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Ionicons name="sync-outline" size={18} color={color || '#000000'} />
                    <Text style={[styles.buttonText, { color: color || '#000000' }]}>
                        {loadingText}
                    </Text>
                </View>
            ) : (
                <View style={styles.buttonContent}>
                    {icon && <Ionicons name={icon as any} size={20} color={color || '#000000'} />}
                    <Text 
                        style={[styles.buttonText, { color: color || '#000000' }]}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    primaryWrapper: {
        flex: 1,
        height: 48,
        borderRadius: 50,
        overflow: 'hidden',
        shadowColor: '#3629B7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryBtn: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryPressed: {
        transform: [{ scale: 0.98 }],
    },
    secondaryBtn: {
        flex: 1,
        height: 48,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    secondaryPressed: {
        opacity: 0.8,
    },
    disabledBtn: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
});
