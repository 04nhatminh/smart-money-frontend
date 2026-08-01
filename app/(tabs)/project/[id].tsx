import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { GroupAPI } from "../../../src/api/group.api";
import EditProjectModal from "../../../src/components/projects/EditProjectModal";
import InviteMemberModal from "../../../src/components/projects/InviteMemberModal";
import ContributeModal from "../../../src/components/projects/ContributeModal";
import {
  CONTRIBUTABLE_STATUSES,
  ProjectDetailResponse,
  ProjectHistory,
  ProjectTrackingResponse,
  TERMINAL_FAILED_STATUSES,
} from "../../../src/types/project.types";
import { formatCurrencyVND, getSafeProgress } from "../../../src/utils/project";
import {
  historyOutcomeStyles,
  inferOutcome,
  paceStatusStyles,
  sortHistoriesDesc,
  statusReasonStyles,
} from "../../../src/utils/projectTracking";
import { t } from "../../../src/i18n";
import { useThemeMode } from "../../../src/theme/ThemeProvider";
import { Theme, ThemeMode } from "../../../src/theme/tokens";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;
  const styles = useMemo(
    () => createStyles(theme, mode, accent, surface),
    [theme, mode, accent, surface]
  );

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [tracking, setTracking] = useState<ProjectTrackingResponse | null>(null);
  const [histories, setHistories] = useState<ProjectHistory[]>([]);
  const groupProjectIdRef = useRef<string | null>(null);
  const completionAlertedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [contributeModalVisible, setContributeModalVisible] = useState(false);

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

  const handleAbandonProject = () => {
    Alert.alert(
      t("project.abandon_project"),
      t("project.abandon_confirm_desc"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("project.abandon_project"),
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await ProjectAPI.abandon(id);
              if (res.success) {
                Alert.alert(t("common.name_app"), t("project.abandon_success"));
                await fetchProjectDetail();
              } else {
                Alert.alert(t("common.error"), res.message || t("project.abandon_failed"));
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

  // Loads detail + tracking + history together. `silent` skips the full-screen
  // spinner and error alert (used by pull-to-refresh).
  const fetchProjectDetail = async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      const [detailRes, trackingRes, historyRes] = await Promise.all([
        ProjectAPI.getById(id),
        ProjectAPI.getTracking(id),
        ProjectAPI.getHistory(id),
      ]);

      if (detailRes.success && detailRes.data) {
        setProject(detailRes.data);
        // Prefer the dedicated history endpoint; fall back to the embedded copy.
        const rawHistories =
          historyRes.success && historyRes.data
            ? historyRes.data
            : detailRes.data.histories ?? [];
        setHistories(sortHistoriesDesc(rawHistories));
      } else if (!silent) {
        Alert.alert(t("common.error"), detailRes.message || t("common.error"));
      }

      if (trackingRes.success && trackingRes.data) {
        setTracking(trackingRes.data);
      }
    } catch (err) {
      console.error("Fetch project details error:", err);
      if (!silent) Alert.alert(t("common.error"), t("common.error"));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await fetchProjectDetail(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  useEffect(() => {
    groupProjectIdRef.current = project?.groupProjectId ?? null;
  }, [project?.groupProjectId]);

  useEffect(() => {
    if (!id) return;

    // Helper import from WebSocket service
    const { subscribeToTopic } = require("../../../src/services/websocket");

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToTopic(
        `/topic/project/${id}/ledger`,
        (payload: { newTotal: number; latestContribution?: string }) => {
          console.log("🟢 [ProjectDetailScreen] WebSocket update received:", payload);
          if (typeof payload?.newTotal !== "number" || Number.isNaN(payload.newTotal)) {
            console.warn("⚠️ Ledger update missing a numeric newTotal, ignoring", payload);
            return;
          }
          setProject((prev) => {
            if (!prev) return null;
            const newTotal = payload.newTotal;
            const target = prev.targetAmount;
            const progress = target > 0 ? (newTotal / target) * 100 : 0;
            const remaining = Math.max(0, target - newTotal);
            return {
              ...prev,
              totalContributed: newTotal,
              // In the all-auto model totalContributed IS net saved — keep the
              // headline number in sync so the bar and "Net saved" never diverge.
              netSaved: newTotal,
              progressPercent: progress,
              remaining: remaining,
            };
          });

          // The optimistic update above moves the bar instantly; reconcile the
          // server-derived fields (moneyOwed, pace, frozen cap, history) with a
          // silent refetch so the debt overlay/panel and pace chip don't go stale.
          fetchProjectDetail(true).catch(() => {
            // Non-critical — keep the optimistic snapshot.
          });

          if (payload.latestContribution) {
            Alert.alert(t("common.name_app"), payload.latestContribution);
          }

          const gid = groupProjectIdRef.current;
          if (gid && !completionAlertedRef.current) {
            GroupAPI.getGroupProjectDetail(gid)
              .then((gpRes) => {
                if (gpRes.success && gpRes.data?.status === "COMPLETED" && !completionAlertedRef.current) {
                  completionAlertedRef.current = true;
                  Alert.alert(
                    "Group Goal Reached!",
                    "Your group has reached its savings goal together!",
                    [
                      {
                        text: "View Group Project",
                        onPress: () => router.push(`/group-project/${gid}` as any),
                      },
                      { text: "OK", style: "cancel" },
                    ]
                  );
                }
              })
              .catch(() => {
                // Non-critical — group project status check failed silently
              });
          }
        }
      );
    } catch (e) {
      console.warn("⚠️ WebSocket subscription failed in detail screen", e);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id]);

  if (loading && !project) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{t("project.loading_detail")}</Text>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/project");
  };

  if (!project) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>{t("project.not_found")}</Text>
        <Pressable
          style={styles.backLinkButton}
          onPress={handleBack}
        >
          <Text style={styles.backLinkText}>{t("project.go_back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const progress = getSafeProgress(project.progressPercent);
  const isPersonal = project.type === "PERSONAL";
  const isCompleted = project.status === "COMPLETED";
  const isSubPersonal = !!project.groupProjectId;
  // EXPIRED / ABANDONED / CANCELLED are terminal failed states — no resume actions.
  const isTerminalFailed = TERMINAL_FAILED_STATUSES.includes(project.status);
  const netSaved = project.netSaved ?? project.totalContributed;
  const moneyOwed = project.moneyOwed ?? 0;
  // Manual contribute (Screen 5): personal, standalone (group sub-projects are
  // auto-funded via settlement) goals in a contributable state.
  const canContribute =
    isPersonal &&
    !isSubPersonal &&
    CONTRIBUTABLE_STATUSES.includes(project.status);

  // Debt overlay (B1): red segment to the right of the green net fill, sized as
  // debt's share of the target and clamped to the empty space on the bar.
  const debtPercent =
    project.targetAmount > 0
      ? Math.min(Math.max(0, 100 - progress), (moneyOwed / project.targetAmount) * 100)
      : 0;

  // Status reason banner (B2): the human "why" behind the badge.
  const statusReason = project.statusReason ?? "NONE";
  const reasonStyle = statusReasonStyles[statusReason];
  let reasonText = t(reasonStyle.i18nKey);
  if (statusReason === "FROZEN_DEBT") {
    // The frozen X/Y suffix needs maxFrozenMonths, which only rides on tracking.
    // Append it only when we actually know the cap — otherwise show just the reason
    // (avoids rendering a misleading "Frozen 2/0 months").
    const mx = tracking?.maxFrozenMonths ?? 0;
    if (mx > 0) {
      const fm = tracking?.frozenMonths ?? project.frozenMonths ?? 0;
      const frozenCount = t("project.frozen_count")
        .replace("{count}", String(fm))
        .replace("{max}", String(mx));
      reasonText = `${reasonText} ${frozenCount}`;
    }
  }
  const showReasonBanner = reasonStyle.banner && !!reasonText;

  // Pace chip (B1): prefer the detail response (pace now rides on it), fall back to
  // the tracking resource. Hidden when not applicable (terminal / no deadline).
  const paceStatus = project.paceStatus ?? tracking?.paceStatus;
  const paceStyle = paceStatus ? paceStatusStyles[paceStatus] : null;
  const showPaceChip = !!paceStyle && paceStatus !== "NOT_APPLICABLE";
  // "At this pace, ~N months of saving left" — distinct from the calendar monthsLeft.
  const paceMonthsLeft = project.paceMonthsLeft ?? tracking?.monthLeft ?? null;

  // Debt panel (B3) estimate — only meaningful when there's debt.
  const debtClearEstimate = tracking?.debtClearEstimateMonths ?? null;

  // Status -> badge colors. Falls back to neutral grey for anything unmapped.
  const statusColors: Record<string, { bg: string; text: string }> = {
    ACTIVE: { bg: "#EFF6FF", text: "#2563EB" },
    ONGOING: { bg: "#EFF6FF", text: "#2563EB" },
    COMPLETED: { bg: "#DCFCE7", text: "#15803D" },
    OVERDUE: { bg: "#FEF3C7", text: "#B45309" },
    FROZEN: { bg: "#FEF9C3", text: "#92400E" },
    EXPIRED: { bg: "#FEE2E2", text: "#991B1B" },
    ABANDONED: { bg: "#FEE2E2", text: "#991B1B" },
    CANCELLED: { bg: "#F3F4F6", text: "#6B7280" },
  };
  const currentStatusColor = statusColors[project.status] ?? { bg: "#F3F4F6", text: "#6B7280" };

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
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {!isPersonal && (
              <Pressable
                style={styles.editButton}
                onPress={() => setInviteModalVisible(true)}
              >
                <Ionicons name="person-add-outline" size={22} color="#FFFFFF" />
              </Pressable>
            )}
            {project.status === "ACTIVE" && (
              <Pressable
                style={styles.editButton}
                onPress={() => setEditModalVisible(true)}
              >
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
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
              {showPaceChip && paceStyle && (
                <View style={[styles.chip, { backgroundColor: paceStyle.bg }]}>
                  <Text style={[styles.chipText, { color: paceStyle.text }]}>
                    {t(paceStyle.i18nKey)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.statusLabelText, { backgroundColor: currentStatusColor.bg, color: currentStatusColor.text }]}>
              {project.status}
            </Text>
          </View>

          {showReasonBanner && (
            <View
              style={[
                styles.reasonBanner,
                { backgroundColor: reasonStyle.bg, borderColor: reasonStyle.border },
              ]}
            >
              <Ionicons name={reasonStyle.icon as any} size={15} color={reasonStyle.text} />
              <Text style={[styles.reasonBannerText, { color: reasonStyle.text }]}>
                {reasonText}
              </Text>
            </View>
          )}

          <Text style={styles.targetLabel}>{t("project.target_amount")}</Text>
          <Text style={styles.targetValue}>
            {formatCurrencyVND(project.targetAmount)} {project.currency}
          </Text>

          {project.monthlySaving ? (
            <Text style={styles.reservingSubline}>
              {t("project.reserving_monthly").replace(
                "{amount}",
                `${formatCurrencyVND(project.monthlySaving)} ${project.currency}`
              )}
            </Text>
          ) : null}

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
            {debtPercent > 0 && (
              <View
                style={[
                  styles.progressBarDebt,
                  { width: `${debtPercent}%` },
                ]}
              />
            )}
          </View>

          {moneyOwed > 0 && (
            <Text style={styles.debtCaption}>
              {t("project.debt_caption")
                .replace("{amount}", `${formatCurrencyVND(moneyOwed)} ${project.currency}`)}
            </Text>
          )}

          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.gridLabel}>{t("project.net_saved")}</Text>
              <Text style={styles.gridValue}>
                {formatCurrencyVND(netSaved)}
              </Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.gridLabel}>{t("project.remaining")}</Text>
              <Text style={styles.gridValue}>
                {formatCurrencyVND(project.remaining)}
              </Text>
            </View>
          </View>

          {canContribute && (
            <Pressable
              style={styles.contributeButton}
              onPress={() => setContributeModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.contributeButtonText}>{t("project.contribute_action")}</Text>
            </Pressable>
          )}

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
            {!isCompleted && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t("project.current_month")}</Text>
                <Text style={styles.metaValue}>
                  {project.currentMonth
                    ? `${project.currentMonth}/${project.durationMonths || project.currentMonth}`
                    : "N/A"}
                </Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.money_owed")}</Text>
              <Text style={[styles.metaValue, project.moneyOwed && project.moneyOwed > 0 ? styles.owedText : null]}>
                {project.moneyOwed !== undefined ? `${formatCurrencyVND(project.moneyOwed)} ${project.currency}` : "N/A"}
              </Text>
            </View>
            {!isCompleted && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t("project.months_left")}</Text>
                <Text style={styles.metaValue}>
                  {project.monthsLeft !== undefined ? `${project.monthsLeft} ${project.monthsLeft > 1 ? t("project.months") : t("project.month")}` : "N/A"}
                </Text>
              </View>
            )}
            {!isCompleted && paceMonthsLeft != null && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t("project.pace_months_left")}</Text>
                <Text style={[styles.metaValue, paceStatus === "BEHIND" && styles.owedText]}>
                  ~{paceMonthsLeft} {paceMonthsLeft > 1 ? t("project.months") : t("project.month")}
                </Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t("project.created_at")}</Text>
              <Text style={styles.metaValue}>
                {project.createdAt ? project.createdAt.split("T")[0] : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Debt Panel (B3) — only when there is overspend debt */}
        {moneyOwed > 0 && (
          <View style={[styles.card, styles.debtCard]}>
            <View style={styles.debtHeaderRow}>
              <Ionicons name="alert-circle" size={18} color="#B45309" />
              <Text style={styles.debtTitle}>{t("project.debt_panel_title")}</Text>
              <Text style={styles.debtAmount}>
                {formatCurrencyVND(moneyOwed)} {project.currency}
              </Text>
            </View>
            <Text style={styles.debtDesc}>{t("project.debt_panel_desc")}</Text>
            {debtClearEstimate != null && (
              <View style={styles.debtEstimateRow}>
                <Ionicons name="time-outline" size={13} color="#92400E" />
                <Text style={styles.debtEstimateText}>
                  {t("project.debt_clear_estimate").replace("{count}", String(debtClearEstimate))}
                </Text>
              </View>
            )}
          </View>
        )}

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
          {histories.length > 0 ? (
            histories.map((history) => {
              const outcome = history.outcome ?? inferOutcome(history);
              const outcomeStyle = historyOutcomeStyles[outcome];
              const netChange =
                history.netChange ?? history.moneySavedAfter - history.moneySavedBefore;
              const netSign = netChange > 0 ? "+" : netChange < 0 ? "−" : "";
              return (
              <View key={history.id || history.createdAt} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyDateBox}>
                    <MaterialCommunityIcons name="calendar-month" size={18} color={accent} />
                    <Text style={styles.historyMonthText}>
                      {t("project.month")} {history.month}/{history.year}
                    </Text>
                  </View>
                  <Text style={[styles.historySavingText, { color: outcomeStyle.color }]}>
                    {netSign}{formatCurrencyVND(Math.abs(netChange))} {project.currency}
                  </Text>
                </View>

                <View style={styles.historyOutcomeRow}>
                  <Ionicons name={outcomeStyle.icon as any} size={14} color={outcomeStyle.color} />
                  <Text style={[styles.historyOutcomeText, { color: outcomeStyle.color }]}>
                    {t(outcomeStyle.i18nKey)}
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
              );
            })
          ) : (
            <View style={styles.emptyHistoryBox}>
              <MaterialCommunityIcons name="history" size={32} color={theme.subtext} />
              <Text style={styles.emptyHistoryText}>{t("project.no_history")}</Text>
            </View>
          )}
        </View>

        {/* Group Project Members List */}
        {!isPersonal && project.members && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Project Members</Text>
            {project.members.length > 0 ? (
              project.members.map((member, index) => (
                <View key={member.userId || index} style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <View style={[styles.memberAvatar, member.admin && { backgroundColor: "#EEF2F6" }]}>
                      <Text style={[styles.memberAvatarText, member.admin && { color: "#475569" }]}>
                        {member.admin ? "A" : "M"}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.memberEmail}>{member.fullName || member.username}</Text>
                      <Text style={styles.memberShare}>
                        {member.email} • {member.admin ? "Admin" : "Member"}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.progressBadge,
                    member.joinStatus === "INVITED" && { backgroundColor: "#FEF3C7" }
                  ]}>
                    <Text style={[
                      styles.progressBadgeText,
                      member.joinStatus === "INVITED" && { color: "#D97706" }
                    ]}>
                      {member.joinStatus}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyHistoryBox}>
                <Ionicons name="people-outline" size={32} color={theme.subtext} />
                <Text style={styles.emptyHistoryText}>No group members joined yet.</Text>
              </View>
            )}
          </View>
        )}

        {/* Danger zone: abandon (sub-personal, still active) → delete */}
        {isSubPersonal && !isTerminalFailed ? (
          <>
            <Pressable
              style={styles.abandonProjectButton}
              onPress={handleAbandonProject}
            >
              <Ionicons name="hand-left-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.deleteProjectText}>{t("project.abandon_project")}</Text>
            </Pressable>
            <Text style={styles.dangerHintText}>{t("project.delete_locked_hint")}</Text>
          </>
        ) : (
          <Pressable
            style={styles.deleteProjectButton}
            onPress={handleDeleteProject}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.deleteProjectText}>{t("project.delete_project")}</Text>
          </Pressable>
        )}

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

      {/* Invite Member Modal */}
      {inviteModalVisible && (
        <InviteMemberModal
          visible={inviteModalVisible}
          projectId={id}
          onClose={() => setInviteModalVisible(false)}
        />
      )}

      {/* Manual Contribute Modal (Screen 5) */}
      {contributeModalVisible && (
        <ContributeModal
          visible={contributeModalVisible}
          project={project}
          onClose={() => setContributeModalVisible(false)}
          onContributed={(updated) => {
            setContributeModalVisible(false);
            setProject(updated);
            if (updated.status === "COMPLETED") {
              Alert.alert(t("common.name_app"), t("project.contribute_completed"));
            }
            // Reconcile server-derived fields (pace, history, milestone pings).
            fetchProjectDetail(true).catch(() => {});
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.subtext,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: theme.bg,
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
    backgroundColor: theme.primary,
    borderRadius: 12,
  },
  backLinkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: theme.primary,
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
    backgroundColor: surface,
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
    backgroundColor: accent + "15",
    borderColor: accent,
    borderWidth: 1,
  },
  personalChipText: {
    color: accent,
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
    color: theme.subtext,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  targetValue: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.text,
    marginTop: 4,
    marginBottom: 18,
  },
  reservingSubline: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: "600",
    marginTop: -12,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: theme.subtext,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16A34A",
  },
  progressBarBackground: {
    flexDirection: "row",
    width: "100%",
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.inputBg,
    overflow: "hidden",
    marginBottom: 18,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#16A34A",
  },
  progressBarDebt: {
    height: "100%",
    backgroundColor: "#EF4444",
  },
  debtCaption: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: -10,
    marginBottom: 14,
  },
  detailsGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 14,
  },
  detailCol: {
    flex: 1,
    alignItems: "center",
  },
  gridLabel: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: "500",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.subtext,
    lineHeight: 22,
  },
  historyItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    color: theme.text,
  },
  historySavingText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10B981",
  },
  historyDetails: {
    backgroundColor: theme.inputBg,
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
    color: theme.subtext,
  },
  historySubValue: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.text,
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
    color: theme.subtext,
  },
  metaInfoGrid: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
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
    color: theme.subtext,
    fontWeight: "500",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.text,
  },
  completedTextBlur: {
    opacity: 0.35,
    textDecorationLine: "line-through",
  },
  owedText: {
    color: "#EF4444",
  },
  reasonBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 14,
  },
  reasonBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  debtCard: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    backgroundColor: "#FFFBEB",
  },
  debtHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  debtTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#92400E",
  },
  debtAmount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#DC2626",
  },
  debtDesc: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 19,
  },
  debtEstimateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
  },
  debtEstimateText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },
  historyOutcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  historyOutcomeText: {
    fontSize: 12,
    fontWeight: "700",
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
  abandonProjectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D97706",
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    shadowColor: "#D97706",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dangerHintText: {
    fontSize: 12,
    color: "#92400E",
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  deleteProjectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  contributeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  contributeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: accent + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: accent,
  },
  memberEmail: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.text,
  },
  memberShare: {
    fontSize: 12,
    color: theme.subtext,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },
});
