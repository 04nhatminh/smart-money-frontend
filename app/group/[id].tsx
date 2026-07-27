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
  Switch,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { GroupAPI } from "../../src/api/group.api";
import { useAuth } from "../../src/context/AuthContext";
import { GroupDetailResponse, GroupMemberResponse } from "../../src/types/group.types";
import InviteGroupMemberModal from "../../src/components/groups/InviteGroupMemberModal";
import GroupProjectSuggestionsModal from "../../src/components/groups/GroupProjectSuggestionsModal";
import CreateGroupProjectModal from "../../src/components/groups/CreateGroupProjectModal";
import { groupStorage } from "../../src/storage/groupStorage";
import { parseCurrencyToNumber, formatNumberWithDots } from "../../src/utils/project";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  FORMING: { bg: "#FEF9C3", text: "#92400E" },
  LOCKED: { bg: "#D1FAE5", text: "#065F46" },
  DISSOLVED: { bg: "#F3F4F6", text: "#6B7280" },
};

const INVITE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  INVITED: { bg: "#E0E7FF", text: "#3730A3" },
  JOINED: { bg: "#D1FAE5", text: "#065F46" },
  DECLINED: { bg: "#FEE2E2", text: "#991B1B" },
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestionsPrefill, setSuggestionsPrefill] = useState<{ targetAmount: number; totalMonths: number; totalCapacity: number } | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [locking, setLocking] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [localGroupProjectId, setLocalGroupProjectId] = useState<string | null>(null);

  // New Sponsorship & Management States
  const [autoSponsorEnabled, setAutoSponsorEnabled] = useState(false);
  const [autoSponsorLimitType, setAutoSponsorLimitType] = useState<"MAX" | "CUSTOM">("MAX");
  const [autoSponsorLimit, setAutoSponsorLimit] = useState("");
  const [isSavingSponsorship, setIsSavingSponsorship] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<Record<string, boolean>>({});
  const [unlocking, setUnlocking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!id) return;
    try {
      const [res, storedProjectId] = await Promise.all([
        GroupAPI.getGroupDetail(id),
        groupStorage.getGroupProjectId(id),
      ]);
      if (res.success && res.data) {
        setGroup(res.data);
        if (!res.data.groupProjectId) {
          await groupStorage.removeGroupProject(id);
          setLocalGroupProjectId(null);
        } else {
          setLocalGroupProjectId(res.data.groupProjectId);
        }
      } else {
        if (storedProjectId) setLocalGroupProjectId(storedProjectId);
      }
    } catch {
      Alert.alert("Error", "Could not load group details.");
    }
  }, [id]);

  useEffect(() => {
    fetchGroup().finally(() => setLoading(false));
  }, [fetchGroup]);

  // Sync auto sponsor settings when group details load
  useEffect(() => {
    if (group && user) {
      const me = group.members.find((m) => m.userId === user.id);
      if (me) {
        setAutoSponsorEnabled(me.autoSponsorEnabled || false);
        setAutoSponsorLimitType(me.autoSponsorLimit ? "CUSTOM" : "MAX");
        setAutoSponsorLimit(me.autoSponsorLimit ? formatNumberWithDots(me.autoSponsorLimit) : "");
      }
    }
  }, [group, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroup();
    setRefreshing(false);
  };

  const handleLockGroup = async () => {
    if (!group) return;
    setLocking(true);
    setLockError(null);
    try {
      const res = await GroupAPI.lockGroup(group.groupId);
      if (res.success && res.data) {
        setGroup(res.data);
      } else {
        setLockError(res.message || "Could not lock group.");
      }
    } catch {
      setLockError("Something went wrong.");
    } finally {
      setLocking(false);
    }
  };

  const handleUnlockGroup = async () => {
    if (!group) return;
    setUnlocking(true);
    setLockError(null);
    try {
      const res = await GroupAPI.unlockGroup(group.groupId);
      if (res.success && res.data) {
        setGroup(res.data);
        Alert.alert("Success", "Group unlocked successfully!");
      } else {
        setLockError(res.message || "Could not unlock group.");
      }
    } catch {
      setLockError("Something went wrong.");
    } finally {
      setUnlocking(false);
    }
  };

  const handleDeleteGroup = () => {
    if (!group) return;
    Alert.alert(
      "Delete Group",
      "Are you sure you want to permanently delete this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await GroupAPI.deleteGroup(group.groupId);
              if (res.success) {
                Alert.alert("Deleted", "Group deleted successfully.", [
                  { text: "OK", onPress: () => router.replace("/(tabs)/project") }
                ]);
              } else {
                Alert.alert("Error", res.message || "Could not delete group.");
              }
            } catch {
              Alert.alert("Error", "Something went wrong.");
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleResendInvite = async (email: string) => {
    if (!group || !email) return;
    setResendingEmail(email);
    try {
      const res = await GroupAPI.inviteMember(group.groupId, { email });
      if (res.success) {
        setSentEmails((prev) => ({ ...prev, [email]: true }));
        Alert.alert("Success", `Invitation resent to ${email}!`);
        setTimeout(() => {
          setSentEmails((prev) => ({ ...prev, [email]: false }));
        }, 4000);
      } else {
        Alert.alert("Error", res.message || "Failed to resend invitation.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setResendingEmail(null);
    }
  };

  const handleSaveSponsorshipSettings = async () => {
    if (!group) return;

    // Find current user's capacity
    const me = group.members.find((m) => m.userId === user?.id);
    const capacity = me?.capacitySnapshot ?? 0;

    if (autoSponsorEnabled && autoSponsorLimitType === "CUSTOM" && autoSponsorLimit) {
      const limitVal = parseCurrencyToNumber(autoSponsorLimit);
      if (limitVal > capacity) {
        Alert.alert(
          "Limit Exceeds Capacity",
          `The entered sponsor limit (${formatNumberWithDots(limitVal)} VND) exceeds your maximum capability (${formatNumberWithDots(capacity)} VND). Please select an option:`,
          [
            {
              text: "Switch to Max Capability",
              onPress: async () => {
                setAutoSponsorLimitType("MAX");
                setAutoSponsorLimit("");
                setIsSavingSponsorship(true);
                try {
                  const res = await GroupAPI.updateAutoSponsorship(group.groupId, {
                    enabled: autoSponsorEnabled,
                    limit: undefined,
                  });
                  if (res.success) {
                    Alert.alert("Success", "Auto-sponsor settings updated successfully!");
                    await fetchGroup();
                  } else {
                    Alert.alert("Error", res.message || "Could not save settings.");
                  }
                } catch {
                  Alert.alert("Error", "Something went wrong.");
                } finally {
                  setIsSavingSponsorship(false);
                }
              }
            },
            {
              text: "Input another number",
              style: "cancel"
            }
          ]
        );
        return;
      }
    }

    setIsSavingSponsorship(true);
    try {
      const limitVal = autoSponsorLimitType === "CUSTOM" && autoSponsorLimit
        ? parseCurrencyToNumber(autoSponsorLimit)
        : undefined;

      const res = await GroupAPI.updateAutoSponsorship(group.groupId, {
        enabled: autoSponsorEnabled,
        limit: limitVal,
      });

      if (res.success) {
        Alert.alert("Success", "Auto-sponsor settings updated successfully!");
        await fetchGroup();
      } else {
        Alert.alert("Error", res.message || "Could not save settings.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsSavingSponsorship(false);
    }
  };

  const handleRemoveMember = (member: GroupMemberResponse) => {
    Alert.alert(
      "Remove Member",
      `Remove this member from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!group) return;
            setRemovingUserId(member.userId);
            try {
              await GroupAPI.removeDeclinedMember(group.groupId, member.userId);
              await fetchGroup();
            } catch {
              Alert.alert("Error", "Could not remove member.");
            } finally {
              setRemovingUserId(null);
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

  if (!group) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Group not found.</Text>
      </SafeAreaView>
    );
  }

  const isAdmin = group.adminId === user?.id;
  const statusStyle = STATUS_COLORS[group.status] ?? STATUS_COLORS.DISSOLVED;

  const nonAdminMembers = group.members.filter((m) => m.userId !== group.adminId);
  const pendingCount = nonAdminMembers.filter((m) => m.inviteStatus === "INVITED").length;
  const joinedCount = nonAdminMembers.filter((m) => m.inviteStatus === "JOINED").length;
  const declinedCount = nonAdminMembers.filter((m) => m.inviteStatus === "DECLINED").length;

  const resolvedGroupProjectId = group.groupProjectId ?? localGroupProjectId;
  const hasGroupProject = !!resolvedGroupProjectId;
  const canCreateProject = isAdmin && group.status === "LOCKED" && !hasGroupProject;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)/project")
          }
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Group info card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusChipText, { color: statusStyle.text }]}>{group.status}</Text>
            </View>
          </View>

          {group.description ? (
            <Text style={styles.description}>{group.description}</Text>
          ) : null}

          {/* Member stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{joinedCount}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, pendingCount > 0 && { color: "#D97706" }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            {declinedCount > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: "#DC2626" }]}>{declinedCount}</Text>
                  <Text style={styles.statLabel}>Declined</Text>
                </View>
              </>
            )}
          </View>

          {group.status === "FORMING" && nonAdminMembers.length === 0 && (
            <View style={styles.progressHint}>
              <Ionicons name="person-add-outline" size={14} color="#92400E" />
              <Text style={styles.progressHintText}>Invite members, then lock the group when everyone is ready</Text>
            </View>
          )}
          {group.status === "FORMING" && nonAdminMembers.length > 0 && (
            <View style={styles.progressHint}>
              <Ionicons name="information-circle-outline" size={14} color="#92400E" />
              <Text style={styles.progressHintText}>
                Lock the group when you're done inviting — at least one member must have joined
              </Text>
            </View>
          )}
          {group.status === "LOCKED" && (
            <View style={[styles.progressHint, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="lock-closed-outline" size={14} color="#065F46" />
              <Text style={[styles.progressHintText, { color: "#065F46" }]}>Group locked — ready to create a project</Text>
            </View>
          )}
        </View>

        {/* Admin actions */}
        {isAdmin && (
          <View style={{ gap: 10 }}>
            {group.status === "FORMING" && (
              <>
                <Pressable style={styles.actionBtn} onPress={() => setShowInviteModal(true)}>
                  <Ionicons name="person-add-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnText}>Invite Member</Text>
                </Pressable>

                <Pressable
                  style={[styles.lockBtn, (joinedCount === 0 || locking) && styles.lockBtnDisabled]}
                  onPress={joinedCount > 0 ? handleLockGroup : undefined}
                  disabled={joinedCount === 0 || locking}
                >
                  {locking ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.actionBtnText}>Lock Group</Text>
                    </>
                  )}
                </Pressable>

                {joinedCount === 0 && (
                  <Text style={styles.lockHint}>At least one member must join before you can lock the group</Text>
                )}
              </>
            )}

            {group.status === "LOCKED" && !hasGroupProject && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: "#F59E0B" }, unlocking && styles.actionBtnDisabled]}
                onPress={handleUnlockGroup}
                disabled={unlocking}
              >
                {unlocking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="lock-open-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Unlock Group</Text>
                  </>
                )}
              </Pressable>
            )}

            {!hasGroupProject && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: "#EF4444" }, deleting && styles.actionBtnDisabled]}
                onPress={handleDeleteGroup}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Delete Group</Text>
                  </>
                )}
              </Pressable>
            )}

            {lockError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={14} color="#991B1B" />
                <Text style={styles.errorBannerText}>{lockError}</Text>
              </View>
            )}
          </View>
        )}

        {canCreateProject && (
          <Pressable
            style={styles.actionBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="folder-open-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Create Group Project</Text>
          </Pressable>
        )}

        {/* Group project link */}
        {hasGroupProject && (
          <Pressable
            style={styles.projectCard}
            onPress={() => router.push(`/group-project/${resolvedGroupProjectId}` as any)}
          >
            <View style={styles.projectCardLeft}>
              <View style={styles.projectIconWrap}>
                <Ionicons name="folder-open" size={22} color="#3629B7" />
              </View>
              <View>
                <Text style={styles.projectCardTitle}>Group Project</Text>
                <Text style={styles.projectCardSub}>Tap to view progress &amp; join</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        )}

        {/* Auto-Sponsorship Settings Panel */}
        {group.status !== "DISSOLVED" && (
          <View style={styles.card}>
            <View style={styles.autoSponsorHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.autoSponsorTitle}>
                  Auto-Sponsor Teammates
                </Text>
                <Text style={styles.autoSponsorDesc}>
                  Automatically contribute using your surplus income if a teammate lacks funds.
                </Text>
              </View>
              <Switch
                value={autoSponsorEnabled}
                onValueChange={setAutoSponsorEnabled}
                trackColor={{ false: "#E2E8F0", true: "#3629B7" }}
                thumbColor={autoSponsorEnabled ? "#FFFFFF" : "#F4F4F5"}
              />
            </View>

            {autoSponsorEnabled && (
              <View style={styles.autoSponsorOptions}>
                <Pressable
                  style={styles.radioOption}
                  onPress={() => setAutoSponsorLimitType("MAX")}
                >
                  <Ionicons
                    name={autoSponsorLimitType === "MAX" ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color="#3629B7"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.radioOptionText}>Sponsor maximum (Full surplus)</Text>
                </Pressable>

                <Pressable
                  style={styles.radioOption}
                  onPress={() => setAutoSponsorLimitType("CUSTOM")}
                >
                  <Ionicons
                    name={autoSponsorLimitType === "CUSTOM" ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color="#3629B7"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.radioOptionText}>Specific maximum monthly limit</Text>
                </Pressable>

                {autoSponsorLimitType === "CUSTOM" && (
                  <View style={styles.customLimitContainer}>
                    <Text style={styles.inputLabel}>Maximum limit per month (VND)</Text>
                    <TextInput
                      style={styles.customLimitInput}
                      keyboardType="numeric"
                      value={autoSponsorLimit}
                      onChangeText={(val) => {
                        const numeric = parseCurrencyToNumber(val);
                        setAutoSponsorLimit(numeric > 0 ? formatNumberWithDots(numeric) : "");
                      }}
                      placeholder="e.g. 500.000"
                    />
                  </View>
                )}
              </View>
            )}

            <Pressable
              style={[styles.saveSponsorBtn, isSavingSponsorship && styles.actionBtnDisabled]}
              onPress={handleSaveSponsorshipSettings}
              disabled={isSavingSponsorship}
            >
              {isSavingSponsorship ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveSponsorBtnText}>Save Settings</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Members list */}
        <Text style={styles.sectionTitle}>Members</Text>
        {group.members.map((member) => {
          const iStyle = INVITE_STATUS_COLORS[member.inviteStatus] ?? INVITE_STATUS_COLORS.INVITED;
          const isDeclined = member.inviteStatus === "DECLINED";
          return (
            <View key={member.userId} style={styles.memberRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={18} color="#3629B7" />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberUserId} numberOfLines={1}>
                  {member.username ?? member.userId}{member.userId === user?.id ? " (You)" : ""}
                </Text>
              </View>
              <View style={styles.memberBadges}>
                {member.role === "ADMIN" && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
                {member.role === "MEMBER" && (
                  <View style={[styles.adminBadge, { backgroundColor: "#F1F5F9" }]}>
                    <Text style={[styles.adminBadgeText, { color: "#64748B" }]}>Member</Text>
                  </View>
                )}
                <View style={[styles.inviteChip, { backgroundColor: iStyle.bg }]}>
                  <Text style={[styles.inviteChipText, { color: iStyle.text }]}>{member.inviteStatus}</Text>
                </View>
                {isAdmin && isDeclined && (
                  removingUserId === member.userId ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Pressable onPress={() => handleRemoveMember(member)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginLeft: 6 }} />
                    </Pressable>
                  )
                )}
                {isAdmin && member.inviteStatus === "INVITED" && group.status === "FORMING" && (
                  resendingEmail === member.email ? (
                    <ActivityIndicator size="small" color="#3629B7" style={{ marginLeft: 6 }} />
                  ) : (
                    <Pressable onPress={() => handleResendInvite(member.email || "")} hitSlop={10} style={styles.resendBtn}>
                      <Text style={styles.resendBtnText}>Resend</Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <InviteGroupMemberModal
        visible={showInviteModal}
        groupId={group.groupId}
        onClose={() => setShowInviteModal(false)}
        onInvited={() => { setShowInviteModal(false); fetchGroup(); }}
      />

      <CreateGroupProjectModal
        visible={showCreateModal}
        group={group}
        prefillTargetAmount={suggestionsPrefill?.targetAmount}
        prefillTotalMonths={suggestionsPrefill?.totalMonths}
        totalCapacity={suggestionsPrefill?.totalCapacity}
        onClose={() => {
          setShowCreateModal(false);
          setSuggestionsPrefill(null);
        }}
        onCreated={async (groupProjectId) => {
          await groupStorage.setGroupProject(id!, groupProjectId);
          setLocalGroupProjectId(groupProjectId);
          setShowCreateModal(false);
          setSuggestionsPrefill(null);
          router.push(`/group-project/${groupProjectId}` as any);
        }}
        onNotFeasible={() => {
          setShowCreateModal(false);
          setShowSuggestionsModal(true);
        }}
      />

      <GroupProjectSuggestionsModal
        visible={showSuggestionsModal}
        group={group}
        onClose={() => setShowSuggestionsModal(false)}
        onContinue={(prefillData) => {
          setSuggestionsPrefill(prefillData);
          setShowSuggestionsModal(false);
          setShowCreateModal(true);
        }}
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginHorizontal: 8 },
  scrollContent: { padding: 20, paddingBottom: 60, gap: 16 },
  card: {
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  statsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 10 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  statLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "500", marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "#E2E8F0" },
  statusChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  statusChipText: { fontSize: 12, fontWeight: "700" },
  memberCountText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  description: { fontSize: 13, color: "#64748B", lineHeight: 20, marginBottom: 10 },
  progressHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FEF9C3", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  progressHintText: { fontSize: 12, color: "#92400E", fontWeight: "500" },
  actionBtn: {
    backgroundColor: "#3629B7", borderRadius: 16, height: 50,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    shadowColor: "#3629B7", shadowOpacity: 0.2, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  actionBtnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
  actionBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  lockBtn: {
    backgroundColor: "#0F172A", borderRadius: 16, height: 50,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
  },
  lockBtnDisabled: { backgroundColor: "#94A3B8" },
  lockHint: { fontSize: 12, color: "#64748B", textAlign: "center", paddingHorizontal: 4 },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FEE2E2", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  errorBannerText: { flex: 1, fontSize: 12, color: "#991B1B" },
  projectCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderColor: "#C7D2FE",
    shadowColor: "#3629B7", shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  projectCardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  projectIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#EEF0FF", justifyContent: "center", alignItems: "center",
  },
  projectCardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  projectCardSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  memberRow: {
    backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#EEF0FF", justifyContent: "center", alignItems: "center",
  },
  memberInfo: { flex: 1 },
  memberUserId: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  capacityText: { fontSize: 11, color: "#64748B", marginTop: 2 },
  memberBadges: { flexDirection: "row", alignItems: "center", gap: 6 },
  adminBadge: { backgroundColor: "#EEF0FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  adminBadgeText: { fontSize: 11, fontWeight: "700", color: "#3629B7" },
  inviteChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  inviteChipText: { fontSize: 11, fontWeight: "700" },
  autoSponsorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  autoSponsorTitle: { fontSize: 15, fontWeight: "700", color: "#3629B7" },
  autoSponsorDesc: { fontSize: 12, color: "#64748B", marginTop: 2, lineHeight: 16 },
  autoSponsorOptions: { borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 12, marginTop: 4, gap: 10 },
  radioOption: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  radioOptionText: { fontSize: 13, color: "#334155", fontWeight: "500" },
  customLimitContainer: { marginTop: 4, paddingLeft: 26 },
  inputLabel: { fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: "500" },
  customLimitInput: { borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: "#0F172A", backgroundColor: "#F8FAFC" },
  saveSponsorBtn: { backgroundColor: "#3629B7", borderRadius: 12, height: 38, justifyContent: "center", alignItems: "center", marginTop: 14 },
  saveSponsorBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  resendBtn: { backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 6 },
  resendBtnText: { fontSize: 11, fontWeight: "700", color: "#D97706" },
});
