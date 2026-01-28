import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { t } from "../../src/i18n";
import { useLanguage } from "../../src/i18n/LanguageProvider";

import { ThemeSwitch } from "../../src/components/ThemeSwitch";
import { LanguageSwitch } from "../../src/components/LanguageSwitch";

import { useThemeMode } from "../../src/theme/ThemeProvider";
import { makeAuthStyles } from "../../src/styles/authStyles";
import { AuthCardLayout } from "../../src/components/auth/AuthCardLayout";

export default function SignupScreen() {
  const router = useRouter();

  // subscribe để screen re-render khi đổi ngôn ngữ
  useLanguage();

  const { theme } = useThemeMode();
  const styles = useMemo(() => makeAuthStyles(theme), [theme]);

  // UI-only state (chuẩn bị nối BE sau)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthCardLayout
      bottomControls={
        <>
          <ThemeSwitch />
          <LanguageSwitch />
        </>
      }
    >
      <Text style={styles.title}>{t("common.sign_up")}</Text>
      <Text style={styles.subtitle}>{t("auth.welcome")}</Text>

      {/* Full name */}
      <View style={styles.field}>
        <Text style={styles.label}>{t("common.full_name")}</Text>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={18} color="#6B7280" />
          <TextInput
            placeholder="Nhat Minh"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
      </View>

      {/* Email */}
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

      {/* Password */}
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

      {/* Submit */}
      <Pressable style={styles.primaryBtn} onPress={() => {}}>
        <Text style={styles.primaryBtnText}>
          {t("auth.sign_up_button")}
        </Text>
      </Pressable>

      {/* Switch to login */}
      <Pressable
        style={styles.bottomLinkWrap}
        onPress={() => router.replace("/(auth)/login")}
      >
        <Text style={styles.bottomText}>
          {t("auth.already_have_account")}{" "}
          <Text style={styles.bottomLink}>{t("common.sign_in")}</Text>
        </Text>
      </Pressable>
    </AuthCardLayout>
  );
}
