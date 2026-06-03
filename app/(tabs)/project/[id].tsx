import React, { useEffect, useState } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { ProjectAPI } from "../../../src/api/project.api";
import EditProjectModal from "../../../src/components/projects/EditProjectModal";
import { ProjectDetailResponse } from "../../../src/types/project.types";
import { formatCurrencyVND, getSafeProgress } from "../../../src/utils/project";
import { t } from "../../../src/i18n";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const handleDeleteProject = () => {
    Alert.alert(
      t("project.delete_project"),
      t("project.delete_confirm_desc"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await ProjectAPI.delete(id);
              if (res.success) {
                Alert.alert(t("common.name_app"), t("project.delete_success"));
                router.replace("/(tabs)/project");
              } else {
                Alert.alert(t("common.error"), res.message || "Failed to delete project");
              }
            } catch (err) {
              console.error(err);
              Alert.alert(t("common.error"), t("common.error"));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const fetchProjectDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await ProjectAPI.getById(id);
      if (res.success && res.data) {
        setProject(res.data);
      } else {
        Alert.alert(t("common.error"), res.message || "Failed to fetch project details");
      }
    } catch (err) {
      console.error("Fetch project details error:", err);
      Alert.alert(t("common.error"), t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const res = await ProjectAPI.getById(id);
      if (res.success && res.data) {
        setProject(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  if (loading && !project) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F2CCB" />
        <Text style={styles.loadingText}>{t("project.loading_detail")}</Text>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>{t("project.not_found")}</Text>
        <Pressable
          style={styles.backLinkButton}
          onPress={() => router.replace("/(tabs)/project")}
        >
          <Text style={styles.backLinkText}>{t("project.go_back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const progress = getSafeProgress(project.progressPercent);
  const isPersonal = project.type === "PERSONAL";
  const isCompleted = project.status === "COMPLETED";

  const priorityColors = {
    HIGH: { bg: "#FEE2E2", text: "#DC2626", border: "#FCA5A5" },
    MEDIUM: { bg: "#FEF3C7", text: "#D97706", border: "#FCD34D" },
    LOW: { bg: "#D1FAE5", text: "#059669", border: "#6EE7B7" },
  };

  const currentPriority = priorityColors[project.priority] || priorityColors.LOW;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/project")}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project.name}
          </Text>
          <Pressable
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3F2CCB"]}
            tintColor="#3F2CCB"
          />
        }
      >
        {/* Project Meta Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.chip,
                  isPersonal ? styles.personalChip : styles.groupChip,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isPersonal ? styles.personalChipText : styles.groupChipText,
                  ]}
                >
                  {isPersonal ? "Personal" : "Group"}
                </Text>
              </View>
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: currentPriority.bg,
                    borderColor: currentPriority.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: currentPriority.text }]}>
                  {project.priority}
                </Text>
              </View>
            </View>
            <Text style={styles.statusLabelText}>
              {project.status}
            </Text>
          </View>

          <Text style={styles.targetLabel}>{t("project.target_amount")}</Text>
          <Text style={styles.targetValue}>
            {formatCurrencyVND(project.targetAmount)} {project.currency}
          </Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{t("project.progress")}</Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.gridLabel}>{t("project.saved")}</Text>
              <Text style={styles.gridValue}>
                {formatCurrencyVND(project.totalContributed)}
              </Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.gridLabel}>{t("project.remaining")}</Text>
              <Text style={styles.gridValue}>
                {formatCurrencyVND(project.remaining)}
              </Text>
            </View>
          </View>

          {/* New Project Info Grid */}
          <View style={styles.metaInfoGrid}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.monthly_saving")}</Text>
              <Text style={styles.metaValue}>
                {project.monthlySaving ? `${formatCurrencyVND(project.monthlySaving)} ${project.currency}` : "N/A"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.original_planned")}</Text>
              <Text style={styles.metaValue}>
                {project.durationMonths ? `${project.durationMonths} ${project.durationMonths > 1 ? t("project.months") : t("project.month")}` : "N/A"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.current_month")}</Text>
              <Text style={[styles.metaValue, isCompleted && styles.completedTextBlur]}>
                {project.currentMonth ? `${project.currentMonth}/${project.monthsLeft || 'N/A'}` : "N/A"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.money_owed")}</Text>
              <Text style={[styles.metaValue, project.moneyOwed && project.moneyOwed > 0 ? styles.owedText : null]}>
                {project.moneyOwed !== undefined ? `${formatCurrencyVND(project.moneyOwed)} ${project.currency}` : "N/A"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.months_left")}</Text>
              <Text style={styles.metaValue}>
                {project.monthsLeft !== undefined ? `${project.monthsLeft} ${project.monthsLeft > 1 ? t("project.months") : t("project.month")}` : "N/A"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.created_at")}</Text>
              <Text style={styles.metaValue}>
                {project.createdAt ? project.createdAt.split("T")[0] : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("project.description")}</Text>
          <Text style={styles.descriptionText}>
            {project.description || t("project.no_description")}
          </Text>
        </View>

        {/* Monthly savings overview / Histories */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t("project.monthly_history")}</Text>
          {project.histories && project.histories.length > 0 ? (
            project.histories.map((history) => (
              <View key={history.id || history.createdAt} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyDateBox}>
                    <MaterialCommunityIcons name="calendar-month" size={18} color="#3F2CCB" />
                    <Text style={styles.historyMonthText}>
                      {t("project.month")} {history.month}/{history.year}
                    </Text>
                  </View>
                  <Text style={styles.historySavingText}>
                    +{formatCurrencyVND(history.monthlySaving - history.penalty + history.surplusInvested)} {project.currency}
                  </Text>
                </View>

                <View style={styles.historyDetails}>
                  <View style={styles.historyInfoRow}>
                    <Text style={styles.historySubLabel}>{t("project.saved_before")}:</Text>
                    <Text style={styles.historySubValue}>
                      {formatCurrencyVND(history.moneySavedBefore)}
                    </Text>
                  </View>
                  <View style={styles.historyInfoRow}>
                    <Text style={styles.historySubLabel}>{t("project.saved_after")}:</Text>
                    <Text style={styles.historySubValue}>
                      {formatCurrencyVND(history.moneySavedAfter)}
                    </Text>
                  </View>
                  <View style={styles.historyInfoRow}>
                    <Text style={styles.historySubLabel}>{t("project.months_left")}:</Text>
                    <Text style={styles.historySubValue}>
                      {history.monthLeftAfter} (was {history.monthLeftBefore})
                    </Text>
                  </View>
                  {history.penalty > 0 && (
                    <View style={styles.historyInfoRow}>
                      <Text style={[styles.historySubLabel, styles.penaltyLabel]}>{t("project.penalty")}:</Text>
                      <Text style={[styles.historySubValue, styles.penaltyText]}>
                        {formatCurrencyVND(history.penalty)}
                      </Text>
                    </View>
                  )}
                  {history.surplusInvested > 0 && (
                    <View style={styles.historyInfoRow}>
                      <Text style={[styles.historySubLabel, styles.surplusLabel]}>{t("project.surplus_invested")}:</Text>
                      <Text style={[styles.historySubValue, styles.surplusText]}>
                        +{formatCurrencyVND(history.surplusInvested)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistoryBox}>
              <MaterialCommunityIcons name="history" size={32} color="#9CA3AF" />
              <Text style={styles.emptyHistoryText}>{t("project.no_history")}</Text>
            </View>
          )}
        </View>

        {/* Delete Project Button */}
        <Pressable
          style={styles.deleteProjectButton}
          onPress={handleDeleteProject}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.deleteProjectText}>{t("project.delete_project")}</Text>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Edit Project Modal */}
      {editModalVisible && (
        <EditProjectModal
          visible={editModalVisible}
          project={project}
          onClose={() => setEditModalVisible(false)}
          onUpdated={fetchProjectDetail}
        />
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F6F6F8",
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: "#EF4444",
    fontWeight: "700",
  },
  backLinkButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3F2CCB",
    borderRadius: 12,
  },
  backLinkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#3F2CCB",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
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
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginHorizontal: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  personalChip: {
    backgroundColor: "#EEF0FF",
    borderColor: "#6C63FF",
    borderWidth: 1,
  },
  personalChipText: {
    color: "#5B5BD6",
  },
  groupChip: {
    backgroundColor: "#FFF0F3",
    borderColor: "#FF6482",
    borderWidth: 1,
  },
  groupChipText: {
    color: "#FF4D6D",
  },
  statusLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  targetLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  targetValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 4,
    marginBottom: 18,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16A34A",
  },
  progressBarBackground: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 18,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#16A34A",
  },
  detailsGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
  },
  detailCol: {
    flex: 1,
    alignItems: "center",
  },
  gridLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  historyItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  historyMonthText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  historySavingText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10B981",
  },
  historyDetails: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  historyInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historySubLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  historySubValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  penaltyLabel: {
    color: "#EF4444",
    fontWeight: "600",
  },
  penaltyText: {
    color: "#EF4444",
    fontWeight: "700",
  },
  surplusLabel: {
    color: "#2563EB",
    fontWeight: "600",
  },
  surplusText: {
    color: "#2563EB",
    fontWeight: "700",
  },
  emptyHistoryBox: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  metaInfoGrid: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 14,
    paddingTop: 14,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  completedTextBlur: {
    opacity: 0.35,
    textDecorationLine: "line-through",
  },
  owedText: {
    color: "#EF4444",
  },
  deleteProjectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 4,
    marginBottom: 16,
    shadowColor: "#DC2626",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  deleteProjectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
