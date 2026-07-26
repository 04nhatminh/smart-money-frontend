import React, { useMemo, useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, TextInputProps, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../theme/ThemeProvider';

interface InputFieldProps extends TextInputProps {
    iconName?: any;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    editable?: boolean;
    customStyle?: any;
    error?: string;
    rightText?: string;
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
    customStyle = {},
    error,
    rightText,
    multiline = false,
    numberOfLines = 1,
    ...rest
}) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [hidePassword, setHidePassword] = useState(secureTextEntry);
    const externalOnFocus = rest.onFocus;
    const externalOnBlur = rest.onBlur;

    const { theme, mode } = useThemeMode();

    // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
    const accent = mode === 'dark' ? theme.link : theme.primary;
    // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
    const surface = mode === 'green' ? '#FFFFFF' : theme.card;

    const styles = useMemo(() => StyleSheet.create({
        field: {
            marginBottom: 12,
        },
        inputRow: {
            height: 46,
            borderRadius: 20,
            backgroundColor: surface,
            borderWidth: 1.5,
            borderColor: theme.border,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        inputRowMultiline: {
            minHeight: 80,
            height: 100,
            alignItems: 'flex-start',
            paddingTop: 14,
        },
        inputRowFocused: {
            borderColor: accent,
        },
        inputRowError: {
            borderColor: '#EF4444',
        },
        inputRowDisabled: {
            backgroundColor: theme.inputBg,
            opacity: 0.6,
        },
        input: {
            flex: 1,
            color: theme.text,
            fontSize: 14,
            paddingVertical: 8,
        },
        inputMultiline: {
            minHeight: 70,
            paddingTop: 0,
        },
        iconTop: {
            marginTop: 2,
        },
        inputFull: {
            marginHorizontal: 0,
        },
        eyeButton: {
            paddingLeft: 4,
        },
        rightText: {
            fontSize: 14,
            fontWeight: '500',
            color: theme.subtext,
        },
        errorText: {
            fontSize: 12,
            color: '#EF4444',
            marginTop: 6,
            marginLeft: 4,
        }
    }), [theme, mode]);

    const isPassword = secureTextEntry;
    const showRightText = rightText && !isPassword;

    return (
        <View style={[styles.field, customStyle]}>
            <Pressable
                onPressIn={() => {
                    if (editable) {
                        setIsFocused(true);
                        inputRef.current?.focus();
                    }
                }}
                style={[
                    styles.inputRow,
                    multiline && styles.inputRowMultiline,
                    isFocused && styles.inputRowFocused,
                    !!error && styles.inputRowError,
                ]}
            >
                {/* Left Icon */}
                {!!iconName && (
                    <Ionicons
                        name={iconName}
                        size={18}
                        color={isFocused ? accent : theme.subtext}
                        style={multiline ? styles.iconTop : undefined}
                    />
                )}

                {/* Input */}
                <TextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subtext}
                    style={[
                        styles.input,
                        multiline && styles.inputMultiline,
                        customStyle,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={(event) => {
                        if (editable) {
                            setIsFocused(true);
                        }
                        externalOnFocus?.(event);
                    }}
                    onBlur={(event) => {
                        setIsFocused(false);
                        externalOnBlur?.(event);
                    }}
                    keyboardType={keyboardType}
                    secureTextEntry={isPassword ? hidePassword : false}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    {...rest}
                    editable={editable}
                />

                {showRightText && <Text style={styles.rightText}>{rightText}</Text>}

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
                            color={isFocused ? accent : theme.subtext}
                        />
                    </Pressable>
                )}
            </Pressable>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};
