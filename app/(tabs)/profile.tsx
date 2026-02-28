import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { t } from "../../src/i18n";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { LanguageSwitch } from "../../src/components/LanguageSwitch";
import { ThemeSwitch } from "../../src/components/ThemeSwitch";
import { AuthPromptModal } from "../../src/components/auth/AuthPromptModal";
import { BottomBar } from "../../src/components/BottomBar";

export default function ProfileScreen() {
  const router = useRouter();
  useLanguage(); // Subscribe to language changes
  const { theme } = useThemeMode();
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const styles = useMemo(() => makeProfileStyles(theme), [theme]);

  // TODO: Replace with actual auth state
  const isAuthenticated = false;

  if (isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.container}>
          <Text>Authenticated Profile - Coming soon</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.container}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="person-outline" size={64} color={theme.primary} />
            </View>
            <Text style={[styles.guestText, { color: theme.subtext }]}>
              {t("auth.guest")}
            </Text>
          </View>

          {/* Settings Section */}
          <View style={styles.settingsSection}>
            {/* Theme Setting */}
            <View
              style={[
                styles.settingItem,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={20} color={theme.primary} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {theme.mode === "light" ? t("profile.light_mode") : t("profile.dark_mode")}
                </Text>
              </View>
              <ThemeSwitch />
            </View>

            {/* Language Setting */}
            <View
              style={[
                styles.settingItem,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name="language-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {t("profile.language")}
                </Text>
              </View>
              <LanguageSwitch />
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            style={[styles.signInBtn, { backgroundColor: theme.primary }]}
            onPress={() => setAuthModalVisible(true)}
          >
            <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
            <Text style={styles.signInBtnText}>{t("common.sign_in")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <AuthPromptModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      <BottomBar
        active="profile"
        onHome={() => router.push("/")}
        onStats={() => {}}
        onAdd={() => {}}
        onWallet={() => {}}
        onProfile={() => {}}
      />
    </>
  );
}

function makeProfileStyles(theme: any) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: 18,
      paddingVertical: 24,
      paddingBottom: 100,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 16,
      marginTop: 20,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      marginBottom: 12,
    },
    guestText: {
      fontSize: 14,
      fontWeight: "600",
    },
    settingsSection: {
      gap: 12,
      marginVertical: 24,
      flex: 1,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: "600",
    },
    signInBtn: {
      height: 48,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 16,
    },
    signInBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
