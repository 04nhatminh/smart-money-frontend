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
import { GroupDetailResponse } from "../../types/group.types";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (group: GroupDetailResponse) => void;
};

export default function CreateGroupModal({ visible, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  const reset = () => {
    setName("");
    setDescription("");
    setNameError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError("Group name is required");
      return;
    }
    setNameError("");
    setLoading(true);
    try {
      const res = await GroupAPI.createGroup({ name: name.trim(), description: description.trim() || undefined });
      if (res.success && res.data) {
        reset();
        onCreated(res.data);
      } else {
        Alert.alert("Error", res.message || "Failed to create group.");
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
            <Text style={styles.title}>New Group</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            placeholder="e.g. Family Savings"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={(v) => { setName(v); if (nameError) setNameError(""); }}
            maxLength={120}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <Text style={[styles.label, { marginTop: 16 }]}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is this group saving for?"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <Pressable
            style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }, loading && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createBtnText}>Create Group</Text>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  input: {
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#0F172A",
  },
  inputError: { borderColor: "#EF4444" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 4 },
  createBtn: {
    marginTop: 28, height: 52, backgroundColor: "#3629B7", borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
  createBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
