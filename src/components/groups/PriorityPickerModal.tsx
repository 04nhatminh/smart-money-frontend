import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GroupAPI } from "../../api/group.api";
import { GroupProjectDetailResponse, GroupProjectPriority } from "../../types/group.types";

type Props = {
  visible: boolean;
  groupProject: GroupProjectDetailResponse;
  currentUserId: string;
  onClose: () => void;
  onJoined: () => void;
};

const PRIORITY_CONFIG: { value: GroupProjectPriority; label: string; description: string; color: string; bg: string }[] = [
  { value: "HIGH", label: "High", description: "Contribute the most each month", color: "#DC2626", bg: "#FEE2E2" },
  { value: "MEDIUM", label: "Medium", description: "Balanced monthly contribution", color: "#D97706", bg: "#FEF3C7" },
  { value: "LOW", label: "Low", description: "Smaller monthly contribution", color: "#059669", bg: "#D1FAE5" },
];

export default function PriorityPickerModal({
  visible,
  groupProject,
  currentUserId,
  onClose,
  onJoined,
}: Props) {
  const [selected, setSelected] = useState<GroupProjectPriority | null>(null);
  const [loading, setLoading] = useState(false);

  const takenPriorities = new Set(
    groupProject.members
      .filter((m) => m.userId !== currentUserId)
      .map((m) => {
        // Priority isn't in the member detail — we infer from the personal project target amounts
        // The BE doesn't expose priority directly in the detail response, so all slots are open until
        // the backend enforces uniqueness on join. We mark slots taken if user already joined.
        return null;
      })
      .filter(Boolean)
  );

  // Mark current user as already joined
  const alreadyJoined = groupProject.members.some((m) => m.userId === currentUserId);

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert("Select Priority", "Please select a priority level.");
      return;
    }
    setLoading(true);
    try {
      const res = await GroupAPI.joinGroupProject(groupProject.groupProjectId, { priority: selected });
      if (res.success) {
        setSelected(null);
        onJoined();
      } else {
        Alert.alert("Error", res.message || "Could not join project.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Choose Priority</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Your priority determines your monthly savings contribution. Each level must be unique within the group.
          </Text>

          <View style={styles.tilesRow}>
            {PRIORITY_CONFIG.map((p) => {
              const isTaken = takenPriorities.has(p.value);
              const isSelected = selected === p.value;
              return (
                <Pressable
                  key={p.value}
                  style={[
                    styles.tile,
                    { backgroundColor: isSelected ? p.bg : "#F8FAFC", borderColor: isSelected ? p.color : "#E2E8F0" },
                    isTaken && styles.tileTaken,
                  ]}
                  onPress={() => !isTaken && setSelected(p.value)}
                  disabled={isTaken}
                >
                  {isTaken && (
                    <View style={styles.takenBadge}>
                      <Text style={styles.takenBadgeText}>Taken</Text>
                    </View>
                  )}
                  <Text style={[styles.tileLabel, { color: isTaken ? "#9CA3AF" : p.color }]}>{p.label}</Text>
                  <Text style={[styles.tileDesc, isTaken && { color: "#9CA3AF" }]}>{p.description}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={p.color} style={styles.checkIcon} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && { opacity: 0.85 },
              (!selected || loading || alreadyJoined) && styles.btnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selected || loading || alreadyJoined}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmBtnText}>{alreadyJoined ? "Already Joined" : "Confirm & Join"}</Text>
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
  tilesRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  tile: {
    flex: 1, borderRadius: 16, padding: 14, borderWidth: 2,
    alignItems: "center", minHeight: 100, justifyContent: "center",
  },
  tileTaken: { opacity: 0.5 },
  takenBadge: {
    position: "absolute", top: 6, right: 6,
    backgroundColor: "#E5E7EB", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2,
  },
  takenBadgeText: { fontSize: 9, fontWeight: "700", color: "#6B7280" },
  tileLabel: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  tileDesc: { fontSize: 11, color: "#64748B", textAlign: "center", lineHeight: 15 },
  checkIcon: { position: "absolute", bottom: 8, right: 8 },
  confirmBtn: {
    height: 52, backgroundColor: "#3629B7", borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
