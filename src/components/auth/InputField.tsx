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
}

export const InputField: React.FC<InputFieldProps> = ({
    iconName,
    placeholder,
    value,
    onChangeText,
    keyboardType = 'default',
    secureTextEntry = false,
    autoCapitalize = 'none',
}) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.field}>
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
                <Ionicons
                    name={iconName}
                    size={18}
                    color={isFocused ? '#3629B7' : '#A8A3D7'}
                />
                <TextInput
                    ref={inputRef}
                    placeholder={placeholder}
                    placeholderTextColor="#A8A3D7"
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={autoCapitalize}
                />
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
    input: {
        flex: 1,
        color: '#1F2937',
        fontSize: 14,
        paddingVertical: 8,
    },
});
