import React, {useState, useRef} from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from "../../i18n";

interface SignInFormProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    rememberMe: boolean;
    setRememberMe: (rememberMe: boolean) => void;
    error: string | null;
    loading: boolean;
    onSignIn: () => void;
    onForgotPassword?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    error,
    loading,
    onSignIn,
    onForgotPassword
}) => {
    const [forgotDisabled, setForgotDisabled] = useState(false);
    const emailRef = useRef<TextInput>(null);
    const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);
    const handleForgotPassword = () => {
        if (forgotDisabled) return;
        if (!onForgotPassword) return;

        setForgotDisabled(true);

        try {
            onForgotPassword();
        } finally {
            setForgotDisabled(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Email Field */}
            <View style={styles.field}>
                <Pressable
                    onPressIn={() => {
                        setActiveField('email');
                        emailRef.current?.focus();
                    }}
                    style={[
                        styles.inputRow,
                        activeField === 'email' && styles.inputRowFocused,
                    ]}
                >
                    <Ionicons
                        name="mail-outline"
                        size={18}
                        color={activeField === 'email' ? '#3629B7' : '#A8A3D7'}
                    />
                    <TextInput
                        placeholder={t('common.email')}
                        placeholderTextColor="#A8A3D7"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setActiveField('email')}
                        onBlur={() => setActiveField(null)}
                        keyboardType="email-address"
                    />
                </Pressable>   
            </View>



            {/* Password Field */}
            <View style={styles.field}>
                <Pressable
                    onPressIn={() => {
                        setActiveField('password');
                        emailRef.current?.focus();
                    }}                style={[
                    styles.inputRow,
                    activeField === 'password' && styles.inputRowFocused,
                ]}
                >
                <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={activeField === 'password' ? '#3629B7' : '#A8A3D7'}
                />
                <TextInput
                    placeholder={t('common.password')}
                    style={styles.input}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setActiveField('password')}
                    onBlur={() => setActiveField(null)}
                />
                </Pressable>
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.rememberForgotRow}>
                <Pressable
                    style={styles.rememberMe}
                    onPress={() => setRememberMe(!rememberMe)}
                >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                </Pressable>

                <Pressable 
                    style={styles.forgotPasswordBtn} 
                    onPress={handleForgotPassword}   
                    disabled={forgotDisabled}
                >
                    <Text style={[
                        styles.forgotPasswordText,
                        forgotDisabled && styles.forgotPasswordDisabled
                    ]}>
                        Forgot Password?
                    </Text>
                </Pressable>
            </View>

            {/* Sign In Button */}
            <Pressable
                style={({ pressed }) => [
                    styles.signinBtnWrapper,
                    pressed && styles.signinBtnPressed,
                    loading && styles.disabledBtn
                ]}
                onPress={onSignIn}
                disabled={loading}
            >
                <LinearGradient
                    colors={['#3629B7', '#5655B9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.signinBtn}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.signinBtnText}>Signing in...</Text>
                        </View>
                    ) : (
                        <Text style={styles.signinBtnText}>Sign In</Text>
                    )}
                </LinearGradient>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        gap: 6,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        flex: 1,
    },
    rememberForgotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    rememberMe: {
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
    rememberText: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    forgotPasswordBtn: {
        paddingVertical: 4,
    },
    forgotPasswordText: {
        color: '#3629B7',
        fontSize: 13,
        fontWeight: '600',
        textDecorationLine: 'underline',
        textDecorationColor: '#3629B7',
    },
    forgotPasswordDisabled: {
        opacity: 0.5,
        textDecorationLine: 'none',
    },
    signinBtnWrapper: {
        borderRadius: 25,
        overflow: 'hidden',
        shadowColor: '#3629B7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    signinBtn: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signinBtnPressed: {
        transform: [{ scale: 0.98 }],
    },
    disabledBtn: {
        opacity: 0.6,
    },
    signinBtnText: {
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
});