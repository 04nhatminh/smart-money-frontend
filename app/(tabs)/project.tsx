import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import ProjectSummaryCards from "../../src/components/projects/ProjectSummaryCards";
import ProjectCard from "../../src/components/projects/ProjectCard";
import ProjectStatusFilterModal from "../../src/components/projects/ProjectStatusFilterModal";
import CreateProjectModal from "../../src/components/projects/CreateProjectModal";
import CreateGroupModal from "../../src/components/groups/CreateGroupModal";
import { useProjectList } from "../../src/hooks/useProjectList";
import { projectListStyles as styles } from "../../src/styles/projectListStyles";
import { ProjectListItemResponse } from "../../src/types/project.types";
import { GroupListItemResponse, GroupStatus } from "../../src/types/group.types";
import { GroupAPI } from "../../src/api/group.api";
import { useAuth } from "../../src/context/AuthContext";
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../src/utils/dataRefreshEmitter";

type TabMode = "personal" | "group";

const GROUP_STATUS_COLORS: Record<GroupStatus, { bg: string; text: string }> = {
  FORMING: { bg: "#FEF9C3", text: "#92400E" },
  LOCKED: { bg: "#D1FAE5", text: "#065F46" },
  DISSOLVED: { bg: "#F3F4F6", text: "#6B7280" },
};

function GroupCard({ group, onPress }: { group: GroupListItemResponse; onPress: () => void }) {
  const { user } = useAuth();
  const c = GROUP_STATUS_COLORS[group.status] ?? GROUP_STATUS_COLORS.DISSOLVED;
  const isAdmin = group.adminId === user?.id;

  return (
    <Pressable
      style={({ pressed }) => [
        groupStyles.card,
        pressed && { opacity: 0.92, backgroundColor: "#FAFAFC" },
      ]}
      onPress={onPress}
    >
      <View style={groupStyles.cardHeader}>
        <View style={groupStyles.iconWrap}>
          <Ionicons name="people" size={22} color="#3629B7" />
        </View>
        <View style={groupStyles.cardInfo}>
          <Text style={groupStyles.cardName} numberOfLines={1}>{group.name}</Text>
          {group.description ? (
            <Text style={groupStyles.cardDesc} numberOfLines={1}>{group.description}</Text>
          ) : null}
          {group.groupProjectStatus === "ACTIVE" ? (
            <View style={groupStyles.projectBadgeActive}>
              <Ionicons name="rocket-outline" size={12} color="#047857" />
              <Text style={groupStyles.projectBadgeActiveText}>Dự án đang chạy</Text>
            </View>
          ) : group.groupProjectStatus === "PENDING_SPONSORSHIP" ? (
            <View style={groupStyles.projectBadgePending}>
              <Ionicons name="time-outline" size={12} color="#B45309" />
              <Text style={groupStyles.projectBadgePendingText}>Chờ khảo sát tài trợ</Text>
            </View>
          ) : group.groupProjectStatus === "COMPLETED" ? (
            <View style={groupStyles.projectBadgeCompleted}>
              <Ionicons name="checkmark-circle-outline" size={12} color="#1D4ED8" />
              <Text style={groupStyles.projectBadgeCompletedText}>Dự án đã hoàn thành</Text>
            </View>
          ) : group.groupProjectStatus === "DISSOLVED" ? (
            <View style={groupStyles.projectBadgeDissolved}>
              <Ionicons name="close-circle-outline" size={12} color="#BE123C" />
              <Text style={groupStyles.projectBadgeDissolvedText}>Dự án đã giải thể</Text>
            </View>
          ) : group.groupProjectStatus === "EXPIRED" || group.groupProjectStatus === "SPONSORSHIP_FAILED" ? (
            <View style={groupStyles.projectBadgeInactive}>
              <Ionicons name="alert-circle-outline" size={12} color="#4B5563" />
              <Text style={groupStyles.projectBadgeInactiveText}>Dự án đã kết thúc</Text>
            </View>
          ) : (
            <View style={groupStyles.projectBadgeInactive}>
              <Text style={groupStyles.projectBadgeInactiveText}>Chưa có dự án</Text>
            </View>
          )}
        </View>
        <View style={groupStyles.badges}>
          {isAdmin && (
            <View style={groupStyles.adminBadge}>
              <Text style={groupStyles.adminBadgeText}>Admin</Text>
            </View>
          )}
          <View style={[groupStyles.statusChip, { backgroundColor: c.bg }]}>
            <Text style={[groupStyles.statusChipText, { color: c.text }]}>{group.status}</Text>
          </View>
        </View>
      </View>

      <View style={groupStyles.footer}>
        <View style={groupStyles.memberCountRow}>
          <Ionicons name="person-outline" size={13} color="#64748B" />
          <Text style={groupStyles.footerText}>
            {group.memberCount} thành viên
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </Pressable>
  );
}

export default function ProjectScreen() {
  const [tabMode, setTabMode] = useState<TabMode>("personal");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openStatusFilterModal, setOpenStatusFilterModal] = useState(false);
  const [openCreateGroupModal, setOpenCreateGroupModal] = useState(false);
  // Seeds from an accepted CREATE_PROJECT suggestion (target amount + ISO
  // deadline), used to pre-fill the create modal. Every field stays editable.
  const [createSeedAmount, setCreateSeedAmount] = useState<number | undefined>(undefined);
  const [createSeedDeadline, setCreateSeedDeadline] = useState<string | undefined>(undefined);

  // create=1 route param -> auto-open the create modal pre-filled with the seeds.
  // tab=group route param -> switch to group tab.
  const { create, amount, deadline, tab } = useLocalSearchParams<{
    create?: string;
    amount?: string;
    deadline?: string;
    tab?: string;
  }>();

  useEffect(() => {
    if (tab === "group") {
      setTabMode("group");
      router.setParams({ tab: undefined });
    } else if (tab === "personal") {
      setTabMode("personal");
      router.setParams({ tab: undefined });
    }
  }, [tab]);

  useEffect(() => {
    if (create === "1") {
      const seed = Number(amount);
      setCreateSeedAmount(Number.isFinite(seed) && seed > 0 ? seed : undefined);
      setCreateSeedDeadline(deadline || undefined);
      setTabMode("personal");
      setOpenCreateModal(true);
      // Consume the params so switching tabs / re-render doesn't re-open it.
      router.setParams({ create: undefined, amount: undefined, deadline: undefined });
    }
  }, [create, amount, deadline]);

  // Personal project state
  const {
    filteredProjects,
    summary,
    filter,
    statusFilter,
    search,
    refreshing,
    setFilter,
    setStatusFilter,
    setSearch,
    onRefresh,
    fetchProjects,
  } = useProjectList();

  // Group state
  const [groups, setGroups] = useState<GroupListItemResponse[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsRefreshing, setGroupsRefreshing] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
    useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const res = await GroupAPI.getMyGroups();
      if (res.success && res.data) setGroups(res.data);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tabMode === "group") fetchGroups();
  }, [tabMode, fetchGroups]);

  useEffect(() => {
    // AI chat can execute a real project mutation on the user's behalf (confirm-then-execute via
    // plain "yes"/"no") — there's no shared context/query cache for this data, so re-fetch here
    // when that happens instead of showing stale numbers until the next manual reload.
    const refreshListener = () => fetchProjects();
    dataRefreshEmitter.on(FINANCIAL_DATA_UPDATED, refreshListener);
    return () => {dataRefreshEmitter.off(FINANCIAL_DATA_UPDATED, refreshListener); }
  }, [fetchProjects]);

  const onGroupsRefresh = async () => {
    setGroupsRefreshing(true);
    await fetchGroups();
    setGroupsRefreshing(false);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.trim().toLowerCase())
  );

  const handlePressProject = (project: ProjectListItemResponse) => {
    router.push(`/(tabs)/project/${project.projectId}` as any);
  };


  return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable onPress={() => router.replace("/(tabs)/home")} style={{ marginRight: 4 }}>
                <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.title}>Projects</Text>
          </View>

          <Pressable
            style={styles.createButton}
            onPress={() => tabMode === "personal" ? setOpenCreateModal(true) : setOpenCreateGroupModal(true)}
          >
            <Text style={styles.createButtonText}>
              {tabMode === "personal" ? "+ Create" : "+ New Group"}
            </Text>
          </Pressable>
        </View>

        {/* Personal / Group toggle */}
        <View style={tabToggleStyles.row}>
          <Pressable
            style={[tabToggleStyles.tab, tabMode === "personal" && tabToggleStyles.tabActive]}
            onPress={() => setTabMode("personal")}
          >
            <Ionicons name="person-outline" size={14} color={tabMode === "personal" ? "#3629B7" : "#C2C2C7"} />
            <Text style={[tabToggleStyles.tabText, tabMode === "personal" && tabToggleStyles.tabTextActive]}>
              Personal
            </Text>
          </Pressable>
          <Pressable
            style={[tabToggleStyles.tab, tabMode === "group" && tabToggleStyles.tabActive]}
            onPress={() => setTabMode("group")}
          >
            <Ionicons name="people-outline" size={14} color={tabMode === "group" ? "#3629B7" : "#C2C2C7"} />
            <Text style={[tabToggleStyles.tabText, tabMode === "group" && tabToggleStyles.tabTextActive]}>
              Group
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#C2C2C7"
              value={tabMode === "personal" ? search : groupSearch}
              onChangeText={tabMode === "personal" ? setSearch : setGroupSearch}
              style={styles.searchInput}
            />
          </View>

          {tabMode === "personal" && (
            <Pressable
              style={[styles.filterIconButton, statusFilter !== "ALL" && styles.filterIconButtonActive]}
              onPress={() => setOpenStatusFilterModal(true)}
            >
              <Ionicons name="funnel" size={24} color="#FFFFFF" />
            </Pressable>
          )}
          </View>
        </View>

        {/* Personal tab content */}
        {tabMode === "personal" && (
          <View style={styles.content}>
            <ProjectSummaryCards totalSaved={summary.totalSaved} totalAmount={summary.totalAmount} />
            <FlatList
              data={filteredProjects}
              keyExtractor={(item) => item.projectId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              renderItem={({ item }) => (
                <ProjectCard
                  project={item}
                  onPress={handlePressProject}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No projects found.</Text>
                </View>
              }
            />
          </View>
        )}

        {/* Group tab content */}
        {tabMode === "group" && (
          <View style={styles.content}>
            {groupsLoading && groups.length === 0 ? (
              <View style={groupStyles.center}>
                <ActivityIndicator color="#3629B7" />
              </View>
            ) : (
              <FlatList
                data={filteredGroups}
                keyExtractor={(item) => item.groupId}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={groupsRefreshing} onRefresh={onGroupsRefresh} />}
                renderItem={({ item }) => (
                  <GroupCard
                    group={item}
                    onPress={() => router.push(`/group/${item.groupId}` as any)}
                  />
                )}
                ListEmptyComponent={
                  <View style={groupStyles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#C7C7CC" style={{ marginBottom: 12 }} />
                    <Text style={styles.emptyText}>No groups yet.</Text>
                    <Pressable
                      style={groupStyles.emptyCreateBtn}
                      onPress={() => setOpenCreateGroupModal(true)}
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                      <Text style={groupStyles.emptyCreateBtnText}>Create a Group</Text>
                    </Pressable>
                  </View>
                }
              />
            )}
          </View>
        )}

        <ProjectStatusFilterModal
          visible={openStatusFilterModal}
          value={statusFilter}
          onClose={() => setOpenStatusFilterModal(false)}
          onChange={setStatusFilter}
        />

        <CreateProjectModal
          visible={openCreateModal}
          initialAmount={createSeedAmount}
          initialDeadline={createSeedDeadline}
          onClose={() => { setOpenCreateModal(false); setCreateSeedAmount(undefined); setCreateSeedDeadline(undefined); }}
          onCreated={() => { setOpenCreateModal(false); setCreateSeedAmount(undefined); setCreateSeedDeadline(undefined); fetchProjects(); }}
        />

        <CreateGroupModal
          visible={openCreateGroupModal}
          onClose={() => setOpenCreateGroupModal(false)}
          onCreated={(group) => {
            setOpenCreateGroupModal(false);
            fetchGroups();
            router.push(`/group/${group.groupId}` as any);
          }}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const tabToggleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 7, borderRadius: 17,
  },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#C2C2C7" },
  tabTextActive: { color: "#3629B7" },
});

const groupStyles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyState: { paddingTop: 48, alignItems: "center" },
  emptyCreateBtn: {
    marginTop: 16, flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#3629B7", borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyCreateBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1.5,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#EEF0FF", justifyContent: "center", alignItems: "center",
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  cardDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
  badges: { flexDirection: "row", gap: 6, alignItems: "center" },
  adminBadge: { backgroundColor: "#EEF0FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  adminBadgeText: { fontSize: 10, fontWeight: "700", color: "#3629B7" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusChipText: { fontSize: 10, fontWeight: "700" },

  projectBadgeActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  projectBadgeActiveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
  },
  projectBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  projectBadgePendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B45309",
  },
  projectBadgeCompleted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  projectBadgeCompletedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  projectBadgeDissolved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  projectBadgeDissolvedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#BE123C",
  },
  projectBadgeInactive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  projectBadgeInactiveText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
  },
  
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  memberCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
});
