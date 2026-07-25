import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  GroupProjectSponsorshipRequestResponse,
} from "../../src/types/group.types";
import { formatCurrencyVND } from "../../src/utils/project";
import { getGroupProjectErrorMessage } from "../../src/utils/groupProjectErrors";
import PriorityPickerModal from "../../src/components/groups/PriorityPickerModal";
import { groupStorage } from "../../src/storage/groupStorage";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { Theme, ThemeMode } from "../../src/theme/tokens";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "#D1FAE5", text: "#065F46" },
  COMPLETED: { bg: "#DBEAFE", text: "#1E40AF" },
  DISSOLVED: { bg: "#F3F4F6", text: "#6B7280" },
  PENDING_SPONSORSHIP: { bg: "#FEF9C3", text: "#D97706" },
  SPONSORSHIP_FAILED: { bg: "#FEE2E2", text: "#DC2626" },
};

const SUB_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "#D1FAE5", text: "#065F46" },
  FROZEN: { bg: "#FEF9C3", text: "#92400E" },
  COMPLETED: { bg: "#DBEAFE", text: "#1E40AF" },
  ABANDONED: { bg: "#FEE2E2", text: "#991B1B" },
  EXPIRED: { bg: "#FEE2E2", text: "#991B1B" },
};

// Styles được truyền từ component cha (factory theo theme) để sub-component module-level dùng chung.
type Styles = ReturnType<typeof createStyles>;

function ProgressBar({ percent, styles }: { percent: number; styles: Styles }) {
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
  styles,
  accent,
}: {
  member: GroupProjectMemberDetail;
  isCurrentUser: boolean;
  onPress: () => void;
  styles: Styles;
  accent: string;
}) {
  const statusStyle = SUB_STATUS_COLORS[member.projectStatus] ?? SUB_STATUS_COLORS.ACTIVE;
  // EXPIRED and ABANDONED members have dropped out — dim them.
  const isDroppedOut = member.projectStatus === "ABANDONED" || member.projectStatus === "EXPIRED";
  const memberNetSaved = member.netSaved ?? member.moneySaved;
  const memberOwed = member.moneyOwed ?? 0;
  return (
    <Pressable style={[styles.memberRow, isCurrentUser && styles.memberRowHighlight, isDroppedOut && styles.memberRowAbandoned]} onPress={onPress}>
      <View style={styles.memberAvatar}>
        <Ionicons name="person" size={16} color={accent} />
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
        <ProgressBar percent={member.progressPercent} styles={styles} />
        <View style={styles.memberAmountRow}>
          <Text style={styles.memberAmountText}>
            {formatCurrencyVND(memberNetSaved)} / {formatCurrencyVND(member.targetAmount)}
          </Text>
          <Text style={styles.memberPercentText}>{Math.round(member.progressPercent)}%</Text>
        </View>
        {memberOwed > 0 && (
          <View style={styles.memberDebtRow}>
            <Ionicons name="alert-circle-outline" size={12} color="#DC2626" />
            <Text style={styles.memberDebtText}>{formatCurrencyVND(memberOwed)} debt</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function GroupProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" ? "#FFFFFF" : theme.card;
  const styles = useMemo(
    () => createStyles(theme, mode, accent, surface),
    [theme, mode, accent, surface]
  );

  const [project, setProject] = useState<GroupProjectDetailResponse | null>(null);
  const [groupAdminId, setGroupAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [myPendingRequest, setMyPendingRequest] = useState<GroupProjectSponsorshipRequestResponse | null>(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      const res = await GroupAPI.getGroupProjectDetail(id);
      if (res.success && res.data) {
        setProject(res.data);
        
        // Fetch details of the group
        const groupRes = await GroupAPI.getGroupDetail(res.data.groupId);
        if (groupRes.success && groupRes.data) setGroupAdminId(groupRes.data.adminId);

        // Fetch pending sponsorship requests if the status is PENDING_SPONSORSHIP
        if (res.data.status === "PENDING_SPONSORSHIP") {
          const sponsorRes = await GroupAPI.getPendingSponsorshipRequests();
          if (sponsorRes.success && sponsorRes.data) {
            const match = sponsorRes.data.find((r) => r.groupProjectId === id);
            setMyPendingRequest(match || null);
          } else {
            setMyPendingRequest(null);
          }
        } else {
          setMyPendingRequest(null);
        }
      } else {
        if (res.errorCode === "PROJECT_NOT_FOUND") {
          await groupStorage.removeGroupProjectByProjectId(id);
          Alert.alert(
            "Project Failed",
            "This group project has failed due to declined or insufficient sponsorship contributions.",
            [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/project") }]
          );
        } else {
          Alert.alert("Error", res.message || "Could not load group project.");
        }
      }
    } catch (err: any) {
      const responseData = err?.response?.data;
      if (responseData?.errorCode === "PROJECT_NOT_FOUND") {
        await groupStorage.removeGroupProjectByProjectId(id);
        Alert.alert(
          "Project Failed",
          "This group project has failed due to declined or insufficient sponsorship contributions.",
          [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/project") }]
        );
      } else {
        Alert.alert("Error", "Could not load group project.");
      }
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

  const handleRespondSponsorship = async (agreed: boolean) => {
    if (!myPendingRequest) return;
    setLoading(true);
    try {
      const res = await GroupAPI.respondToSponsorshipRequest(myPendingRequest.requestId, { agreed });
      if (res.success) {
        Alert.alert(
          "Success",
          agreed ? "You agreed to sponsor your teammate!" : "You declined the sponsorship request."
        );
        await fetchProject();
      } else {
        Alert.alert("Error", res.message || "Failed to respond to request.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleDissolve = () => {
    if (!project) return;
    Alert.alert(
      "Dissolve Group Project",
      "This will permanently dissolve the group project. Active sub-projects will be abandoned; completed ones are kept. This cannot be undone.",
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
                  {
                    text: "OK",
                    onPress: () =>
                      router.canGoBack() ? router.back() : router.replace("/(tabs)/project"),
                  },
                ]);
              } else {
                const msg =
                  getGroupProjectErrorMessage(res.errorCode, "join-project") ??
                  res.message ??
                  "Could not dissolve project.";
                Alert.alert("Error", msg);
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
        <ActivityIndicator size="large" color={theme.primary} />
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

  // Progress is driven off the dynamic requiredTarget (shrinks as members drop out),
  // falling back to the original targetAmount when the backend doesn't send it yet.
  const requiredTarget = project.requiredTarget ?? project.targetAmount;
  const aggregateProgress =
    requiredTarget > 0
      ? (project.aggregateMoneySaved / requiredTarget) * 100
      : project.progressPercent;
  const showOriginalGoal =
    project.requiredTarget != null && project.requiredTarget !== project.targetAmount;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)/project")
          }
        >
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
        {/* Completion celebration */}
        {project.status === "COMPLETED" && (
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIcon}>
              <Ionicons name="trophy" size={32} color="#B45309" />
            </View>
            <Text style={styles.celebrationTitle}>Goal Reached! 🎉</Text>
            <Text style={styles.celebrationText}>
              "{project.name}" hit its {formatCurrencyVND(project.targetAmount)} VND target.
              Congratulations to everyone who contributed!
            </Text>
          </View>
        )}

        {/* Pending Sponsorship Notice */}
        {project.status === "PENDING_SPONSORSHIP" && (
          <View style={[styles.sponsorshipCard, { borderColor: "#F59E0B" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <Ionicons name="alert-circle" size={20} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.sponsorshipTitle}>
                {myPendingRequest ? "Sponsorship Request Pending" : "Awaiting Sponsorship Surveys"}
              </Text>
            </View>

            {myPendingRequest ? (
              <View>
                <Text style={styles.sponsorshipText}>
                  A teammate lacks financial capacity. The system proposes that you sponsor them by contributing an extra{" "}
                  <Text style={{ fontWeight: "700" }}>{formatCurrencyVND(myPendingRequest.askedAmount)} VND/month</Text>.
                  This changes your share from{" "}
                  <Text style={{ fontWeight: "700" }}>{formatCurrencyVND(myPendingRequest.originalShare)}</Text> to{" "}
                  <Text style={{ fontWeight: "700" }}>{formatCurrencyVND(myPendingRequest.proposedShare)} VND/month</Text>.
                </Text>
                <View style={styles.sponsorshipActionRow}>
                  <Pressable
                    style={[styles.sponsorshipBtn, styles.declineSponsorBtn]}
                    onPress={() => handleRespondSponsorship(false)}
                  >
                    <Text style={[styles.sponsorshipBtnText, { color: "#EF4444" }]}>Decline</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sponsorshipBtn, styles.agreeSponsorBtn]}
                    onPress={() => handleRespondSponsorship(true)}
                  >
                    <Text style={[styles.sponsorshipBtnText, { color: "#FFFFFF" }]}>Agree</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text style={styles.sponsorshipText}>
                The project is waiting for teammates to respond to proposed sponsorship shares.
              </Text>
            )}
          </View>
        )}

        {/* Sponsorship Failed Notice */}
        {project.status === "SPONSORSHIP_FAILED" && (
          <View style={[styles.sponsorshipCard, { borderColor: "#EF4444", backgroundColor: "#FEE2E2" }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="close-circle" size={20} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={[styles.sponsorshipTitle, { color: "#991B1B" }]}>Sponsorship Failed</Text>
            </View>
            <Text style={[styles.sponsorshipText, { color: "#7F1D1D", marginTop: 4 }]}>
              This project has failed because members declined or lacked capacity to sponsor the deficit.
            </Text>
          </View>
        )}

        {/* Aggregate Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Aggregate Progress</Text>
          <ProgressBar percent={aggregateProgress} styles={styles} />
          <View style={styles.aggregateRow}>
            <Text style={styles.aggregateAmount}>
              {formatCurrencyVND(project.aggregateMoneySaved)} / {formatCurrencyVND(requiredTarget)} VND
            </Text>
            <Text style={styles.aggregatePercent}>{Math.round(aggregateProgress)}%</Text>
          </View>
          {showOriginalGoal && (
            <Text style={styles.originalGoalText}>
              Original goal: {formatCurrencyVND(project.targetAmount)} VND
            </Text>
          )}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={theme.subtext} />
              <Text style={styles.metaText}>{monthsLeft} month{monthsLeft !== 1 ? "s" : ""} left</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={theme.subtext} />
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
              styles={styles}
              accent={accent}
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

// Factory style theo theme: header brand giữ chữ/icon trắng, badge trạng thái giữ màu ngữ nghĩa.
const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg },
  errorText: { fontSize: 15, color: theme.subtext },
  header: {
    backgroundColor: theme.primary,
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
    backgroundColor: surface, borderRadius: 18, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  celebrationCard: {
    backgroundColor: "#FEF9C3", borderRadius: 18, padding: 20, alignItems: "center",
    borderWidth: 1, borderColor: "#FDE68A",
  },
  celebrationIcon: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: "#FEF3C7",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  celebrationTitle: { fontSize: 18, fontWeight: "900", color: "#92400E", marginBottom: 6 },
  celebrationText: { fontSize: 13, color: "#78350F", textAlign: "center", lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: theme.subtext, marginBottom: 12 },
  progressBg: { height: 10, backgroundColor: theme.border, borderRadius: 999, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: accent, borderRadius: 999 },
  aggregateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  aggregateAmount: { fontSize: 13, color: theme.text, fontWeight: "600" },
  aggregatePercent: { fontSize: 18, fontWeight: "900", color: accent },
  originalGoalText: { fontSize: 11, color: theme.subtext, marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: theme.subtext },
  joinBtn: {
    backgroundColor: theme.primary, borderRadius: 16, height: 50,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    shadowColor: "#3629B7", shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  joinBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.text },
  emptyText: { fontSize: 13, color: theme.subtext, textAlign: "center", paddingVertical: 12 },
  memberRow: {
    backgroundColor: surface, borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  memberRowHighlight: { borderWidth: 1.5, borderColor: accent },
  memberRowAbandoned: { opacity: 0.4 },
  memberAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: accent + "20", justifyContent: "center", alignItems: "center",
    marginTop: 2,
  },
  memberInfo: { flex: 1 },
  memberTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  memberName: { flex: 1, fontSize: 13, fontWeight: "600", color: theme.text },
  subStatusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginLeft: 8 },
  subStatusText: { fontSize: 10, fontWeight: "700" },
  memberAmountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  memberAmountText: { fontSize: 11, color: theme.subtext },
  memberPercentText: { fontSize: 11, fontWeight: "700", color: accent },
  memberDebtRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  memberDebtText: { fontSize: 11, fontWeight: "700", color: "#DC2626" },
  dissolveBtn: {
    backgroundColor: "#EF4444", borderRadius: 14, height: 48,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  dissolveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  sponsorshipCard: { backgroundColor: "#FFFBEB", borderWidth: 1.5, borderColor: "#FEF3C7", borderRadius: 18, padding: 18, gap: 8 },
  sponsorshipTitle: { fontSize: 15, fontWeight: "800", color: "#92400E" },
  sponsorshipText: { fontSize: 13, color: "#78350F", lineHeight: 20 },
  sponsorshipActionRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 10 },
  sponsorshipBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1 },
  declineSponsorBtn: { borderColor: "#EF4444", backgroundColor: "transparent" },
  agreeSponsorBtn: { borderColor: "#D97706", backgroundColor: "#D97706" },
  sponsorshipBtnText: { fontSize: 13, fontWeight: "700" },
});
