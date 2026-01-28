import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons, FontAwesome, AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { login } from "../../src/auth/authService";
import { t } from "../../src/i18n";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { ThemeSwitch } from "../../src/components/ThemeSwitch";
import { LanguageSwitch } from "../../src/components/LanguageSwitch";

import { useThemeMode } from "../../src/theme/ThemeProvider";
import { makeAuthStyles } from "../../src/styles/authStyles";
import { AuthCardLayout } from "../../src/components/auth/AuthCardLayout";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useLanguage();
  const { theme } = useThemeMode();
  const styles = useMemo(() => makeAuthStyles(theme), [theme]);

  return (
    <AuthCardLayout
      bottomControls={
        <>
          <ThemeSwitch />
          <LanguageSwitch />
        </>
      }
    >
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

      {error ? (
        <Text style={{ color: "red", marginTop: 8, fontSize: 12 }}>{error}</Text>
      ) : null}

      <Pressable
        style={styles.primaryBtn}
        disabled={loading}
        onPress={async () => {
          setError(null);
          setLoading(true);
          const res = await login(email, password);
          setLoading(false);

          if (res.ok) router.replace("/(tabs)/home");
          else setError(res.message);
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
        <Pressable style={styles.socialBtn} onPress={() => {}}>
          <AntDesign name="google" size={18} color="#DB4437" />
          <Text style={styles.socialText}>{t("common.continue_with_google")}</Text>
        </Pressable>

        <Pressable style={styles.socialBtn} onPress={() => {}}>
          <FontAwesome name="facebook" size={18} color="#1877F2" />
          <Text style={styles.socialText}>{t("common.continue_with_facebook")}</Text>
        </Pressable>
      </View>

      <View style={styles.footerRow}>
        <Pressable onPress={() => {}}>
          <Text style={styles.linkLeft}>{t("auth.forgot_password")}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.linkRight}>{t("auth.create_account")}</Text>
        </Pressable>
      </View>
    </AuthCardLayout>
  );
}
