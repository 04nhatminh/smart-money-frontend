import React, { useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupAPI } from "../../api/group.api";
import { ProjectAPI } from "../../api/project.api";
import { GroupProjectDetailResponse, GroupProjectPriority } from "../../types/group.types";
import { getGroupProjectErrorMessage } from "../../utils/groupProjectErrors";
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";

type Props = {
  visible: boolean;
  groupProject: GroupProjectDetailResponse;
  currentUserId: string;
  onClose: () => void;
  onJoined: () => void;
};

// Nhãn/mô tả lấy từ i18n theo `value` (group.priority.HIGH / HIGH_desc...) nên
// config ở đây chỉ giữ phần màu sắc.
const PRIORITY_CONFIG: { value: GroupProjectPriority; color: string; bg: string }[] = [
  { value: "HIGH", color: "#DC2626", bg: "#FEE2E2" },
  { value: "MEDIUM", color: "#D97706", bg: "#FEF3C7" },
  { value: "LOW", color: "#059669", bg: "#D1FAE5" },
];

export default function PriorityPickerModal({
  visible,
  groupProject,
  currentUserId,
  onClose,
  onJoined,
}: Props) {
  const { theme, mode } = useThemeMode();
  // Đọc lang để component re-render khi người dùng đổi ngôn ngữ.
  useLanguage();
  const insets = useSafeAreaInsets();
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' || mode === 'purple' ? '#FFFFFF' : theme.card;

  const [selected, setSelected] = useState<GroupProjectPriority | null>(null);
  const [loading, setLoading] = useState(false);
  const [takenPriorities, setTakenPriorities] = useState<Set<GroupProjectPriority>>(new Set());
  const [checkingPriorities, setCheckingPriorities] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingTop: 24, paddingHorizontal: 24,
      // Chừa chỗ cho thanh điều hướng / home indicator vì sheet vẽ tràn xuống đáy.
      paddingBottom: 40 + insets.bottom,
    },
    handle: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    title: { fontSize: 20, fontWeight: "800", color: theme.text },
    subtitle: { fontSize: 13, color: theme.subtext, lineHeight: 20, marginBottom: 20 },
    tilesRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
    checkingRow: { height: 100, alignItems: "center", justifyContent: "center", marginBottom: 24 },
    tile: {
      flex: 1, borderRadius: 16, padding: 14, borderWidth: 2,
      alignItems: "center", minHeight: 100, justifyContent: "center",
    },
    tileTaken: { opacity: 0.5 },
    takenBadge: {
      position: "absolute", top: 6, right: 6,
      backgroundColor: theme.border, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2,
    },
    takenBadgeText: { fontSize: 9, fontWeight: "700", color: theme.subtext },
    tileLabel: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
    tileDesc: { fontSize: 11, color: theme.subtext, textAlign: "center", lineHeight: 15 },
    checkIcon: { position: "absolute", bottom: 8, right: 8 },
    confirmBtn: {
      height: 52, backgroundColor: theme.primary, borderRadius: 16,
      justifyContent: "center", alignItems: "center",
      shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
    confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  }), [theme, mode, insets.bottom]);

  // A priority is "taken" when THIS user already has another active project using
  // it — each of the user's active projects must hold a distinct priority level.
  // It has nothing to do with what other group members picked. A user with no
  // active projects has nothing taken, so all three slots are available.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setCheckingPriorities(true);
      setSelected(null);
      try {
        const res = await ProjectAPI.getAll();
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) {
          const used = res.data
            .filter((p) => p.status === "ACTIVE")
            .map((p) => p.priority as GroupProjectPriority);
          setTakenPriorities(new Set(used));
        } else {
          setTakenPriorities(new Set());
        }
      } catch {
        if (!cancelled) setTakenPriorities(new Set());
      } finally {
        if (!cancelled) setCheckingPriorities(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  // Mark current user as already joined
  const alreadyJoined = groupProject.members.some((m) => m.userId === currentUserId);

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert(t("group.priority.select_title"), t("group.priority.select_message"));
      return;
    }
    setLoading(true);
    try {
      const res = await GroupAPI.joinGroupProject(groupProject.groupProjectId, { priority: selected });
      if (res.success) {
        setSelected(null);
        onJoined();
      } else {
        const msg =
          getGroupProjectErrorMessage(res.errorCode, "join-project") ??
          res.message ??
          t("group.priority.join_failed");
        Alert.alert(t("common.error"), msg);
      }
    } catch {
      Alert.alert(t("common.error"), t("group.priority.join_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    // statusBar/navigationBarTranslucent: app bật edge-to-edge, thiếu 2 cờ này
    // thì Modal dừng ngay trên thanh điều hướng -> lộ giao diện phía dưới.
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{t("group.priority.title")}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.subtext} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>{t("group.priority.subtitle")}</Text>

          {checkingPriorities ? (
            <View style={styles.checkingRow}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
          <View style={styles.tilesRow}>
            {PRIORITY_CONFIG.map((p) => {
              const isTaken = takenPriorities.has(p.value);
              const isSelected = selected === p.value;
              return (
                <Pressable
                  key={p.value}
                  style={[
                    styles.tile,
                    { backgroundColor: isSelected ? p.bg : theme.inputBg, borderColor: isSelected ? p.color : theme.border },
                    isTaken && styles.tileTaken,
                  ]}
                  onPress={() => !isTaken && setSelected(p.value)}
                  disabled={isTaken}
                >
                  {isTaken && (
                    <View style={styles.takenBadge}>
                      <Text style={styles.takenBadgeText}>{t("group.priority.taken")}</Text>
                    </View>
                  )}
                  <Text style={[styles.tileLabel, { color: isTaken ? "#9CA3AF" : p.color }]}>
                    {t(`group.priority.${p.value}`)}
                  </Text>
                  {/* Khi được chọn, ô có nền tint sáng cố định nên chữ mô tả giữ màu tối cố định. */}
                  <Text
                    style={[
                      styles.tileDesc,
                      isSelected && { color: "#64748B" },
                      isTaken && { color: "#9CA3AF" },
                    ]}
                  >
                    {t(`group.priority.${p.value}_desc`)}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={p.color} style={styles.checkIcon} />
                  )}
                </Pressable>
              );
            })}
          </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && { opacity: 0.85 },
              (!selected || loading || checkingPriorities || alreadyJoined) && styles.btnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selected || loading || checkingPriorities || alreadyJoined}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmBtnText}>
                {alreadyJoined ? t("group.priority.already_joined") : t("group.priority.confirm")}
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
