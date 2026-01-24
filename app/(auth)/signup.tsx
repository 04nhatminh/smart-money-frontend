import React from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { t } from "../../src/i18n";
import { LanguageSwitch } from "../../src/components/LanguageSwitch";
import { useLanguage } from "../../src/i18n/LanguageProvider";

export default function SignupScreen() {
  const router = useRouter();
  const { lang } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bg}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("common.sign_up")}</Text>
          <Text style={styles.subtitle}>{t("auth.welcome")}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t("common.full_name")}</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="Nhat Minh"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t("common.email")}</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color="#6B7280" />
              <TextInput
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="none"
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
              />
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={() => {}}>
            <Text style={styles.primaryBtnText}>{t("auth.sign_up_button")}</Text>
          </Pressable>

          <Pressable style={styles.bottomLinkWrap} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.bottomText}>
              {t("auth.already_have_account")} <Text style={styles.bottomLink}>{t("common.sign_in")}</Text>
            </Text>
          </Pressable>
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

  bottomLinkWrap: { marginTop: 14, alignItems: "center" },
  bottomText: { fontSize: 12.5, color: "#2563EB", fontWeight: "600" },
  bottomLink: { fontWeight: "800" },
});
