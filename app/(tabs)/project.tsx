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
    <Pressable style={groupStyles.card} onPress={onPress}>
      <View style={groupStyles.cardHeader}>
        <View style={groupStyles.iconWrap}>
          <Ionicons name="people" size={22} color="#3629B7" />
        </View>
        <View style={groupStyles.cardInfo}>
          <Text style={groupStyles.cardName} numberOfLines={1}>{group.name}</Text>
          {group.description ? (
            <Text style={groupStyles.cardDesc} numberOfLines={1}>{group.description}</Text>
          ) : null}
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
        <Ionicons name="person-outline" size={13} color="#9CA3AF" />
        <Text style={groupStyles.footerText}>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</Text>
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
  const { create, amount, deadline } = useLocalSearchParams<{
    create?: string;
    amount?: string;
    deadline?: string;
  }>();
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
    backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#EEF0FF", justifyContent: "center", alignItems: "center",
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  cardDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
  badges: { flexDirection: "row", gap: 6, alignItems: "center" },
  adminBadge: { backgroundColor: "#EEF0FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  adminBadgeText: { fontSize: 10, fontWeight: "700", color: "#3629B7" },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusChipText: { fontSize: 10, fontWeight: "700" },
  footer: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 12, color: "#9CA3AF" },
});
