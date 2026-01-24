import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import { Ionicons, FontAwesome, AntDesign } from "@expo/vector-icons";

import { useRouter } from "expo-router";
import { login } from "../../src/auth/authService";
import { t } from "../../src/i18n";
import { LanguageSwitch } from "../../src/components/LanguageSwitch";
import { useLanguage } from "../../src/i18n/LanguageProvider";

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { lang } = useLanguage();
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.bg}>
                <View style={styles.card}>
                    <Text style={styles.title}>{t("common.sign_in")}</Text>
                    <Text style={styles.subtitle}>{t("auth.welcome_back")}</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>{t("common.email")}</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="mail-outline" size={18} color="#6B7280" />
                            <TextInput
                                placeholder="your@email.com"
                                placeholderTextColor="#9CA3AF"
                                style={styles.input}
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>{t("common.password")}</Text>
                        <View style={styles.inputRow}>
                            <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
                            <TextInput
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                style={styles.input}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </View>

                    {error && (
                        <Text style={{ color: "red", marginTop: 8, fontSize: 12 }}>
                            {error}
                        </Text>
                    )}

                    <Pressable
                        style={styles.primaryBtn}
                        disabled={loading}
                        onPress={async () => {
                            setError(null);
                            setLoading(true);

                            const res = await login(email, password);

                            setLoading(false);

                            if (res.ok) {
                                router.replace("/(tabs)/home");
                            } else {
                                setError(res.message);
                            }
                        }}
                    >
                        <Text style={styles.primaryBtnText}>
                            {loading ? t("auth.sign_in_loading") : t("common.sign_in")}
                        </Text>
                    </Pressable>

                    <View style={styles.dividerRow}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>{t("common.or")}</Text>
                        <View style={styles.divider} />
                    </View>

                    <View style={{ gap: 10 }}>
                        {/* Google */}
                        <Pressable style={styles.socialBtn} onPress={() => {}}>
                            <AntDesign name="google" size={18} color="#DB4437" />
                            <Text style={styles.socialText}>{t("common.continue_with_google")}</Text>
                        </Pressable>

                        {/* Facebook */}
                        <Pressable style={styles.socialBtn} onPress={() => {}}>
                            <FontAwesome name="facebook" size={18} color="#1877F2" />
                            <Text style={styles.socialText}>{t("common.continue_with_facebook")}</Text>
                        </Pressable>
                    </View>

                    <View style={styles.footerRow}>
                        <Pressable onPress={() => { }}>
                            <Text style={styles.linkLeft}>{t("auth.forgot_password")}</Text>
                        </Pressable>

                        <Pressable onPress={() => router.push("/(auth)/signup")}>
                            <Text style={styles.linkRight}>{t("auth.create_account")}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
            <View style={{ alignItems: "flex-end", marginBottom: 12, marginRight: 18 }}>
                <LanguageSwitch />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#EAF4F7" },
    bg: {
        flex: 1,
        backgroundColor: "#EAF4F7",
        padding: 18,
        justifyContent: "center",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
    },
    title: { fontSize: 18, fontWeight: "700", color: "#111827" },
    subtitle: { marginTop: 4, fontSize: 12.5, color: "#6B7280" },

    field: { marginTop: 14 },
    label: { fontSize: 12, fontWeight: "600", color: "#111827", marginBottom: 8 },
    inputRow: {
        height: 44,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    input: { flex: 1, color: "#111827", fontSize: 14 },

    primaryBtn: {
        marginTop: 16,
        height: 44,
        borderRadius: 10,
        backgroundColor: "#1651a3",
        alignItems: "center",
        justifyContent: "center",
    },
    primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

    footerRow: {
        marginTop: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    linkLeft: { color: "#2563EB", fontSize: 12.5, fontWeight: "600" },
    linkRight: { color: "#1651a3", fontSize: 12.5, fontWeight: "700" },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 14,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    dividerText: {
        marginHorizontal: 8,
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    socialBtn: {
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    socialText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
});
