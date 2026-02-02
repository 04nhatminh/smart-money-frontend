import React, {useState} from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    const handleForgotPassword = () => {
        if (forgotDisabled) return;
        if (!onForgotPassword) return;

        setForgotDisabled(true);

        try {
            onForgotPassword();
        } finally {
            // mở lại khi cần (hoặc giữ disable tới khi xong flow)
            setForgotDisabled(false);
        }
    };
    return (
        <>
            <View style={styles.field}>
                <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={18} color="#6B7280" />
                    <TextInput
                        placeholder={t("common.email")}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
            </View>

            <View style={styles.field}>
                <View style={styles.inputRow}>
                    <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                    <TextInput
                        placeholder={t("common.password")}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
            </View>

            {error && (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            )}

            <View style={styles.rememberForgotRow}>
                <Pressable
                    style={styles.rememberMe}
                    onPress={() => setRememberMe(!rememberMe)}
                >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={styles.rememberText}>{t("auth.remember_me")}</Text>
                </Pressable>

                <Pressable style={styles.forgotPasswordBtn} onPress={handleForgotPassword}   
                           disabled={forgotDisabled}>
                    <Text style={styles.forgotPasswordText}>
                        {t("auth.forgot_password")}
                    </Text>
                </Pressable>
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.signinBtn,
                    pressed && styles.signinBtnPressed,
                    loading && styles.disabledBtn
                ]}
                onPress={onSignIn}
                disabled={loading}
            >
                <Text style={styles.signinBtnText}>
                    {loading ? t("auth.sign_in_loading") : t("common.sign_in")}
                </Text>
            </Pressable>
        </>
    );
};

const styles = StyleSheet.create({
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 8,
    },
    inputRow: {
        height: 50,
        borderRadius: 10,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    input: {
        flex: 1,
        color: "#111827",
        fontSize: 16,
    },
    errorText: {
        color: "#ef4444",
        marginTop: 8,
        fontSize: 12,
        marginBottom: 8,
    },
    rememberForgotRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 24,
        paddingHorizontal: 5
    },
    rememberMe: {
        flexDirection: "row",
        alignItems: "center",
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: "#999",
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    checkboxChecked: {
        borderColor: "#3b82f6",
    },
    checkboxInner: {
        width: 10,
        height: 10,
        backgroundColor: "#3b82f6",
        borderRadius: 2,
    },
    rememberText: {
        fontSize: 14,
        color: "#444",
    },
    forgotPasswordBtn: {
        cursor: "pointer"
    },
    forgotPasswordText: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "600",
    },
    signinBtn: {
        marginTop: 8,
        height: 50,
        borderRadius: 50,
        backgroundColor: "#4E71FF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4E71FF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    signinBtnPressed: {
        backgroundColor: "#3a56d4",
        transform: [{ scale: 0.98 }],
    },
    disabledBtn: {
        opacity: 0.7,
    },
    signinBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
    },
});