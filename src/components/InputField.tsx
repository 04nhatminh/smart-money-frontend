import React, { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, TextInputProps, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
                        color={isFocused ? '#CBCBCBa' : '#E5E5EA'}
                        style={multiline ? styles.iconTop : undefined}
                    />
                )}

                {/* Input */}
                <TextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    placeholderTextColor="#E5E5EA"
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
                            color={isFocused ? '#CBCBCB' : '#E5E5EA'}
                        />
                    </Pressable>
                )}
            </Pressable>

            {!!error && <Text style={styles.errorText}>{error}</Text>}
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
    inputRowMultiline: {
        minHeight: 80,
        height: 100,
        alignItems: 'flex-start',
        paddingTop: 14,
    },
    inputRowFocused: {
        borderColor: '#CBCBCB',
    },
    inputRowError: {
        borderColor: '#EF4444',
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
        color: '#CACACA',
    },
    errorText: {
        fontSize: 12,
        color: '#EF4444',
        marginTop: 6,
        marginLeft: 4,
    }
});