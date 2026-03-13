import React, { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    iconName?: any;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    editable?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
    placeholder,
    value,
    onChangeText,
    iconName,
    keyboardType = 'default',
    secureTextEntry = false,
    autoCapitalize = 'none',
    editable = true,
}) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [hidePassword, setHidePassword] = useState(secureTextEntry);

    const isPassword = secureTextEntry;

    return (
        <View style={styles.field}>
            <Pressable
                onPressIn={() => {
                    if (editable) {
                        setIsFocused(true);
                        inputRef.current?.focus();
                    }
                }}
                style={[
                    styles.inputRow,
                    isFocused && styles.inputRowFocused,
                    !editable && styles.inputRowDisabled,
                ]}
            >
                {/* Left Icon */}
                {iconName && (
                    <Ionicons
                        name={iconName}
                        size={18}
                        color={isFocused ? '#3629B7' : '#A8A3D7'}
                    />
                )}

                {/* Input */}
                <TextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    placeholderTextColor="#A8A3D7"
                    style={[styles.input, !iconName && styles.inputFull]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => editable && setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    keyboardType={keyboardType}
                    secureTextEntry={isPassword ? hidePassword : false}
                    autoCapitalize={autoCapitalize}
                    editable={editable}
                />

                {/* Eye icon nếu là password */}
                {isPassword && (
                    <Pressable
                        onPress={() => setHidePassword(!hidePassword)}
                        hitSlop={10}
                        style={styles.eyeButton}
                    >
                        <Ionicons
                            name={hidePassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={isFocused ? '#3629B7' : '#A8A3D7'}
                        />
                    </Pressable>
                )}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    field: {
        marginBottom: 12,
    },
    inputRow: {
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F2F1F9',
        borderWidth: 1,
        borderColor: 'transparent',
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputRowFocused: {
        borderColor: '#3629B7',
        backgroundColor: '#FFFFFF',
        shadowColor: '#3629B7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inputRowDisabled: {
        backgroundColor: '#F2F1F9',
        opacity: 0.6,
    },
    input: {
        flex: 1,
        color: '#1F2937',
        fontSize: 14,
        paddingVertical: 8,
    },
    inputFull: {
        marginHorizontal: 0,
    },
    eyeButton: {
        paddingLeft: 4,
    },
});