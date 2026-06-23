import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GroupAPI } from "../../api/group.api";

type Props = {
  visible: boolean;
  groupId: string;
  onClose: () => void;
  onInvited: () => void;
};

export default function InviteGroupMemberModal({ visible, groupId, onClose, onInvited }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const reset = () => {
    setEmail("");
    setEmailError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      const res = await GroupAPI.inviteMember(groupId, { email: trimmed });
      if (res.success) {
        Alert.alert("Invite Sent", `Invite sent to ${trimmed}`);
        reset();
        onInvited();
      } else {
        Alert.alert("Error", res.message || "Failed to send invite.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Invite Member</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Enter the email address of the person you'd like to invite to this group.
          </Text>

          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="member@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.85 }, loading && styles.btnDisabled]}
            onPress={handleInvite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.inviteBtnText}>Send Invite</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  input: {
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#0F172A",
  },
  inputError: { borderColor: "#EF4444" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 4 },
  inviteBtn: {
    marginTop: 28, height: 52, backgroundColor: "#3629B7", borderRadius: 16,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
  inviteBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
