import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { GroupAPI } from "../../src/api/group.api";
import { useAuth } from "../../src/context/AuthContext";
import {
  GroupProjectDetailResponse,
  GroupProjectMemberDetail,
} from "../../src/types/group.types";
import { formatCurrencyVND } from "../../src/utils/project";
import PriorityPickerModal from "../../src/components/groups/PriorityPickerModal";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "#D1FAE5", text: "#065F46" },
  COMPLETED: { bg: "#DBEAFE", text: "#1E40AF" },
  DISSOLVED: { bg: "#F3F4F6", text: "#6B7280" },
};

const SUB_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "#D1FAE5", text: "#065F46" },
  FROZEN: { bg: "#FEF9C3", text: "#92400E" },
  COMPLETED: { bg: "#DBEAFE", text: "#1E40AF" },
  ABANDONED: { bg: "#FEE2E2", text: "#991B1B" },
};

function ProgressBar({ percent }: { percent: number }) {
  const safe = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${safe}%` }]} />
    </View>
  );
}

function MemberRow({
  member,
  isCurrentUser,
  onPress,
}: {
  member: GroupProjectMemberDetail;
  isCurrentUser: boolean;
  onPress: () => void;
}) {
  const statusStyle = SUB_STATUS_COLORS[member.projectStatus] ?? SUB_STATUS_COLORS.ACTIVE;
  const isAbandoned = member.projectStatus === "ABANDONED";
  return (
    <Pressable style={[styles.memberRow, isCurrentUser && styles.memberRowHighlight, isAbandoned && styles.memberRowAbandoned]} onPress={onPress}>
      <View style={styles.memberAvatar}>
        <Ionicons name="person" size={16} color="#3629B7" />
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberTopRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.username ?? member.userId}{isCurrentUser ? " (You)" : ""}
          </Text>
          <View style={[styles.subStatusChip, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.subStatusText, { color: statusStyle.text }]}>{member.projectStatus}</Text>
          </View>
        </View>
        <ProgressBar percent={member.progressPercent} />
        <View style={styles.memberAmountRow}>
          <Text style={styles.memberPercentText}>{Math.round(member.progressPercent)}%</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function GroupProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<GroupProjectDetailResponse | null>(null);
  const [groupAdminId, setGroupAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      const res = await GroupAPI.getGroupProjectDetail(id);
      if (res.success && res.data) {
        setProject(res.data);
        const groupRes = await GroupAPI.getGroupDetail(res.data.groupId);
        if (groupRes.success && groupRes.data) setGroupAdminId(groupRes.data.adminId);
      }
    } catch {
      Alert.alert("Error", "Could not load group project.");
    }
  }, [id]);

  useEffect(() => {
    fetchProject().finally(() => setLoading(false));
  }, [fetchProject]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProject();
    setRefreshing(false);
  };

  const handleDissolve = () => {
    if (!project) return;
    Alert.alert(
      "Dissolve Group Project",
      "This will permanently dissolve the group project and all sub-projects. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dissolve",
          style: "destructive",
          onPress: async () => {
            setDissolving(true);
            try {
              const res = await GroupAPI.dissolveGroupProject(project.groupProjectId);
              if (res.success) {
                Alert.alert("Dissolved", "The group project has been dissolved.", [
                  { text: "OK", onPress: () => router.back() },
                ]);
              } else {
                Alert.alert("Error", res.message || "Could not dissolve project.");
              }
            } finally {
              setDissolving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#3629B7" />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Project not found.</Text>
      </SafeAreaView>
    );
  }

  const currentUserId = user?.id ?? "";
  const statusStyle = STATUS_COLORS[project.status] ?? STATUS_COLORS.DISSOLVED;
  const alreadyJoined = project.members.some((m) => m.userId === currentUserId);
  const deadlineDate = new Date(project.deadline);
  const now = new Date();
  const monthsLeft = Math.max(
    0,
    (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth())
  );

  const isAdmin = groupAdminId !== null && currentUserId === groupAdminId;
  const showDissolve = project.status === "ACTIVE" && isAdmin;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
        <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusChipText, { color: statusStyle.text }]}>{project.status}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Aggregate Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Aggregate Progress</Text>
          <ProgressBar percent={project.progressPercent} />
          <View style={styles.aggregateRow}>
            <Text style={styles.aggregateAmount}>
              {formatCurrencyVND(project.aggregateMoneySaved)} / {formatCurrencyVND(project.targetAmount)} VND
            </Text>
            <Text style={styles.aggregatePercent}>{Math.round(project.progressPercent)}%</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{monthsLeft} month{monthsLeft !== 1 ? "s" : ""} left</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{formatCurrencyVND(project.totalCapacity)} VND/month total</Text>
            </View>
          </View>
        </View>

        {/* Join button */}
        {!alreadyJoined && project.status === "ACTIVE" && (
          <Pressable style={styles.joinBtn} onPress={() => setShowPriority(true)}>
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.joinBtnText}>Join Project</Text>
          </Pressable>
        )}

        {/* Members */}
        <Text style={styles.sectionTitle}>Members</Text>
        {project.members.length === 0 ? (
          <Text style={styles.emptyText}>No members have joined yet.</Text>
        ) : (
          project.members.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              isCurrentUser={m.userId === currentUserId}
              onPress={() => {
                if (m.userId === currentUserId && m.personalProjectId) {
                  router.push(`/(tabs)/project/${m.personalProjectId}` as any);
                }
              }}
            />
          ))
        )}

        {/* Dissolve */}
        {showDissolve && (
          <Pressable
            style={({ pressed }) => [styles.dissolveBtn, pressed && { opacity: 0.85 }, dissolving && styles.btnDisabled]}
            onPress={handleDissolve}
            disabled={dissolving}
          >
            {dissolving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.dissolveBtnText}>Dissolve Group Project</Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>

      <PriorityPickerModal
        visible={showPriority}
        groupProject={project}
        currentUserId={currentUserId}
        onClose={() => setShowPriority(false)}
        onJoined={() => { setShowPriority(false); fetchProject(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F8" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F6F8" },
  errorText: { fontSize: 15, color: "#6B7280" },
  header: {
    backgroundColor: "#3629B7",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusChipText: { fontSize: 11, fontWeight: "700" },
  scrollContent: { padding: 20, paddingBottom: 60, gap: 14 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#64748B", marginBottom: 12 },
  progressBg: { height: 10, backgroundColor: "#E5E7EB", borderRadius: 999, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#3629B7", borderRadius: 999 },
  aggregateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  aggregateAmount: { fontSize: 13, color: "#0F172A", fontWeight: "600" },
  aggregatePercent: { fontSize: 18, fontWeight: "900", color: "#3629B7" },
  metaRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#64748B" },
  joinBtn: {
    backgroundColor: "#3629B7", borderRadius: 16, height: 50,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    shadowColor: "#3629B7", shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  joinBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptyText: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingVertical: 12 },
  memberRow: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  memberRowHighlight: { borderWidth: 1.5, borderColor: "#3629B7" },
  memberRowAbandoned: { opacity: 0.4 },
  memberAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#EEF0FF", justifyContent: "center", alignItems: "center",
    marginTop: 2,
  },
  memberInfo: { flex: 1 },
  memberTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  memberName: { flex: 1, fontSize: 13, fontWeight: "600", color: "#0F172A" },
  subStatusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginLeft: 8 },
  subStatusText: { fontSize: 10, fontWeight: "700" },
  memberAmountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  memberAmountText: { fontSize: 11, color: "#64748B" },
  memberPercentText: { fontSize: 11, fontWeight: "700", color: "#3629B7" },
  dissolveBtn: {
    backgroundColor: "#EF4444", borderRadius: 14, height: 48,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  dissolveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
