import React, { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps {
    iconName: any;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    customStyle?: any;
}

export const InputField: React.FC<InputFieldProps> = ({
    iconName,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    secureTextEntry = false,
    autoCapitalize = 'none',
    customStyle = {},
}) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [hidePassword, setHidePassword] = useState(secureTextEntry);

    const isPassword = secureTextEntry;

    return (
        <View style={[styles.field, customStyle]}>
            <Pressable
                onPressIn={() => {
                    setIsFocused(true);
                    inputRef.current?.focus();
                }}
                style={[
                    styles.inputRow,
                    isFocused && styles.inputRowFocused,
                ]}
            >
                {/* Left Icon */}
                <Ionicons
                    name={iconName}
                    size={18}
                    color={isFocused ? '#CBCBCBa' : '#E5E5EA'}
                />

                {/* Input */}
                <TextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    placeholderTextColor="#E5E5EA"
                    style={[styles.input, customStyle]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    keyboardType={keyboardType}
                    secureTextEntry={isPassword ? hidePassword : false}
                    autoCapitalize={autoCapitalize}
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
                            color={isFocused ? '#CBCBCB' : '#E5E5EA'}
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
        height: 46,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputRowFocused: {
        borderColor: '#CBCBCB',
    },
    input: {
        flex: 1,
        color: '#1F2937',
        fontSize: 14,
        paddingVertical: 8,
    },
    eyeButton: {
        paddingLeft: 4,
    },
});