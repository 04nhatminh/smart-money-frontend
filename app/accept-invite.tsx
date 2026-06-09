import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { ProjectAPI } from "../src/api/project.api";
import { useAuth } from "../src/context/AuthContext";
import { t } from "../src/i18n";
import { formatCurrencyVND } from "../src/utils/project";

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { isSignedIn } = useAuth();

  const [loading, setLoading] = useState(false);
  const [commitmentAmount, setCommitmentAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      Alert.alert(
        t("common.name_app"),
        "You must be signed in to accept a project invitation. Please log in first.",
        [
          {
            text: t("common.confirm"),
            onPress: () => {
              router.replace("/(auth)/auth");
            },
          },
        ]
      );
    }
  }, [isSignedIn]);

  const handleAcceptInvite = async () => {
    if (!token) {
      Alert.alert(t("common.error"), "Invalid or missing invitation token.");
      return;
    }

    setProcessing(true);
    try {
      const amount = commitmentAmount ? parseFloat(commitmentAmount) : undefined;
      const res = await ProjectAPI.acceptInvitation({
        token,
        commitmentAmount: amount,
      });

      if (res.success && res.data) {
        Alert.alert(
          t("common.name_app"),
          "Successfully joined the project!",
          [
            {
              text: "Go to Project",
              onPress: () => {
                router.replace({
                  pathname: "/(tabs)/project/[id]",
                  params: { id: res.data?.projectId || "" },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(t("common.error"), res.message || "Failed to accept the invitation.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t("common.error"), t("common.error"));
    } finally {
      setProcessing(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F2CCB" />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(tabs)/project")}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Accept Project Invite</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="email-open-outline" size={60} color="#3F2CCB" />
          </View>
          <Text style={styles.title}>You are invited!</Text>
          <Text style={styles.description}>
            You have been invited to join a collaborative saving project. Enter an optional custom monthly commitment amount below to accept.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Commitment Amount (Optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500,000"
                keyboardType="numeric"
                value={commitmentAmount}
                onChangeText={setCommitmentAmount}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.currencyTag}>VND</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.acceptButton,
              pressed && styles.buttonPressed,
              processing && styles.buttonDisabled,
            ]}
            onPress={handleAcceptInvite}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.acceptButtonText}>Accept & Join Project</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.declineButton}
            onPress={() => router.replace("/(tabs)/project")}
          >
            <Text style={styles.declineButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F6F8",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  header: {
    backgroundColor: "#3F2CCB",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EEF0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  currencyTag: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },
  acceptButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#3F2CCB",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3F2CCB",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 12,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  declineButton: {
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  declineButtonText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
});
