import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ProjectAPI } from "../../api/project.api";
import { t } from "../../i18n";

type Props = {
  visible: boolean;
  projectId: string;
  onClose: () => void;
};

export default function InviteMemberModal({ visible, projectId, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<{
    token: string;
    deepLinkUrl: string;
  } | null>(null);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert(t("common.error"), "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setInviteResult(null);

    try {
      const res = await ProjectAPI.inviteMember(projectId, {
        email: email.trim().toLowerCase(),
        admin: isAdmin,
      });

      if (res.success && res.data) {
        setInviteResult({
          token: res.data.token,
          deepLinkUrl: res.data.deepLinkUrl,
        });
        Alert.alert("Success", "Invitation generated successfully!");
      } else {
        Alert.alert(t("common.error"), res.message || "Failed to invite member.");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert(t("common.error"), err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.deepLinkUrl) {
      Clipboard.setString(inviteResult.deepLinkUrl);
      Alert.alert("Copied", "Deep Link URL copied to clipboard!");
    }
  };

  const handleClose = () => {
    setEmail("");
    setIsAdmin(false);
    setInviteResult(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Invite Project Member</Text>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          {!inviteResult ? (
            <View style={styles.content}>
              <Text style={styles.description}>
                Invite a user to collaborate on this project. Enter their email address to dispatch push notifications, emails, and generate a deep link.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. member@gmail.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setIsAdmin(!isAdmin)}
              >
                <Ionicons
                  name={isAdmin ? "checkbox" : "square-outline"}
                  size={24}
                  color={isAdmin ? "#3F2CCB" : "#64748B"}
                />
                <Text style={styles.checkboxLabel}>Make user a Project Admin</Text>
              </Pressable>

              <Pressable
                style={[styles.actionBtn, loading && styles.btnDisabled]}
                onPress={handleInvite}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Send Invitation</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-circle" size={50} color="#10B981" />
              </View>
              <Text style={styles.resultTitle}>Invite Dispatched!</Text>
              <Text style={styles.resultDesc}>
                The invitation has been successfully sent to the user. You can also share this link with them manually:
              </Text>

              <View style={styles.linkContainer}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {inviteResult.deepLinkUrl}
                </Text>
                <Pressable style={styles.copyBtn} onPress={handleCopyLink}>
                  <Ionicons name="copy-outline" size={20} color="#3F2CCB" />
                </Pressable>
              </View>

              <Pressable style={styles.actionBtn} onPress={handleClose}>
                <Text style={styles.actionBtnText}>Done</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#0F172A",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },
  actionBtn: {
    backgroundColor: "#3F2CCB",
    height: 50,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: {
    backgroundColor: "#94A3B8",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  successIconBox: {
    alignItems: "center",
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  resultDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF0FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 24,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: "#3F2CCB",
    fontWeight: "600",
  },
  copyBtn: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
});
