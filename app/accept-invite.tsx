import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { GroupAPI } from "../src/api/group.api";
import { useThemeMode } from "../src/theme/ThemeProvider";
import { Theme, ThemeMode } from "../src/theme/tokens";
import { groupStorage } from "../src/storage/groupStorage";
import { useAuth } from "../src/context/AuthContext";
import { t } from "../src/i18n";
import { formatCurrencyVND } from "../src/utils/project";
import { getGroupProjectErrorMessage } from "../src/utils/groupProjectErrors";

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { isSignedIn } = useAuth();
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;

  const styles = useMemo(() => createStyles(theme, mode, accent, surface), [theme, mode]);

  const [processing, setProcessing] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      Alert.alert(
        t("common.name_app"),
        "You must be signed in to accept a group invitation. Please log in first.",
        [
          {
            text: t("common.confirm"),
            onPress: () => router.replace("/(auth)/auth"),
          },
        ]
      );
    }
  }, [isSignedIn]);

  const handleAccept = async () => {
    if (!token) {
      Alert.alert(t("common.error"), "Invalid or missing invitation token.");
      return;
    }
    setProcessing(true);
    try {
      const res = await GroupAPI.acceptInvite(token);
      if (res.success && res.data) {
        const group = res.data;
        await groupStorage.addId(group.groupId);
        const myMember = group.members.find((m) => m.inviteStatus === "JOINED");
        const capacityText = myMember
          ? `\nYour monthly contribution: ${formatCurrencyVND(myMember.capacitySnapshot)} VND`
          : "";
        Alert.alert(
          t("common.name_app"),
          `You've joined the group "${group.name}"!${capacityText}`,
          [
            {
              text: "View Group",
              onPress: () =>
                router.replace({
                  pathname: "/group/[id]",
                  params: { id: group.groupId },
                }),
            },
          ]
        );
      } else {
        const msg =
          getGroupProjectErrorMessage(res.errorCode, "accept-invite") ??
          res.message ??
          "Failed to accept the invitation.";
        Alert.alert(t("common.error"), msg);
      }
    } catch {
      Alert.alert(t("common.error"), t("common.error"));
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    Alert.alert(
      "Decline Invitation",
      "Are you sure you want to decline this group invitation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setDeclining(true);
            try {
              await GroupAPI.declineInvite(token);
            } finally {
              setDeclining(false);
              router.replace("/(tabs)/project");
            }
          },
        },
      ]
    );
  };

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/project")}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Group Invitation</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={60} color={accent} />
          </View>
          <Text style={styles.title}>You're Invited!</Text>
          <Text style={styles.description}>
            You've been invited to join a collaborative savings group. Accept to see your monthly contribution and group details.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.acceptButton,
              pressed && styles.buttonPressed,
              (processing || declining) && styles.buttonDisabled,
            ]}
            onPress={handleAccept}
            disabled={processing || declining}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.acceptButtonText}>Accept & Join Group</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.declineButton,
              pressed && { opacity: 0.7 },
              (processing || declining) && styles.buttonDisabled,
            ]}
            onPress={handleDecline}
            disabled={processing || declining}
          >
            {declining ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <Text style={styles.declineButtonText}>Decline Invitation</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg },
    loadingText: { marginTop: 12, fontSize: 16, color: theme.subtext, fontWeight: "500" },
    // Header nền primary đậm — chữ/icon trên đó giữ trắng cố định.
    header: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
    content: { flex: 1, padding: 20, justifyContent: "center" },
    card: {
      backgroundColor: surface, borderRadius: 24, padding: 24, alignItems: "center",
      shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 15,
      shadowOffset: { width: 0, height: 6 }, elevation: 4,
    },
    iconContainer: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: accent + "20",
      justifyContent: "center", alignItems: "center", marginBottom: 20,
    },
    title: { fontSize: 24, fontWeight: "900", color: theme.text, marginBottom: 10 },
    description: { fontSize: 14, color: theme.subtext, textAlign: "center", lineHeight: 22, marginBottom: 28 },
    acceptButton: {
      width: "100%", height: 52, backgroundColor: theme.primary, borderRadius: 16,
      flexDirection: "row", justifyContent: "center", alignItems: "center",
      shadowColor: theme.primary, shadowOpacity: 0.25, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 3, marginBottom: 12,
    },
    buttonPressed: { opacity: 0.9 },
    buttonDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
    acceptButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    declineButton: {
      width: "100%", height: 50,
      justifyContent: "center", alignItems: "center",
      borderWidth: 1, borderColor: "#EF4444", borderRadius: 16,
    },
    declineButtonText: { color: "#EF4444", fontSize: 15, fontWeight: "600" },
  });
