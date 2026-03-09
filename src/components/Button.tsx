import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    loadingText?: string;
    variant?: 'primary' | 'secondary';
}

export const ButtonSave: React.FC<ButtonProps> = ({
    label,
    onPress,
    loading = false,
    disabled = false,
    loadingText = 'Loading...',
    variant = 'primary',
}) => {

    const isPrimary = variant === 'primary';

    return (
        <Pressable
            style={({ pressed }) => [
                styles.btnWrapper,
                pressed && styles.btnPressed,
                (loading || disabled) && styles.disabledBtn,
            ]}
            onPress={onPress}
            disabled={loading || disabled}
        >
            {isPrimary ? (
            <LinearGradient
                colors={['#3629B7', '#5655B9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.btn}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.btnText}>{loadingText}</Text>
                    </View>
                ) : (
                    <Text style={styles.btnText}>{label}</Text>
                )}
            </LinearGradient>
            ) : ( 
                <View style={styles.secondaryBtn}>
                    <Text style={styles.secondaryText}>{label}</Text>
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    btnWrapper: {
        flex: 1,
        borderRadius: 25,
        overflow: 'hidden',
    },
    btn: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPressed: {
        transform: [{ scale: 0.98 }],
    },
    disabledBtn: {
        opacity: 0.6,
    },
    btnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    secondaryBtn: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9E9EF',
        borderRadius: 25,
    },

    secondaryText: {
        color: '#1F2937',
        fontWeight: '600',
        fontSize: 15,
    },
});
