import React, { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GroupAPI } from "../../api/group.api";
import { GroupDetailResponse } from "../../types/group.types";
import { formatCurrencyVND, parseCurrencyToNumber } from "../../utils/project";
import { getGroupProjectErrorMessage } from "../../utils/groupProjectErrors";
import { useThemeMode } from "../../theme/ThemeProvider";

type Props = {
  visible: boolean;
  group: GroupDetailResponse;
  prefillTargetAmount?: number;
  prefillTotalMonths?: number;
  totalCapacity?: number;
  onClose: () => void;
  onCreated: (groupProjectId: string) => void;
  onNotFeasible?: () => void;
};

export default function CreateGroupProjectModal({
  visible,
  group,
  prefillTargetAmount,
  prefillTotalMonths,
  totalCapacity,
  onClose,
  onCreated,
  onNotFeasible,
}: Props) {
  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [totalMonths, setTotalMonths] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setTargetAmount(
        prefillTargetAmount && prefillTargetAmount > 0 ? prefillTargetAmount.toString() : ""
      );
      setTotalMonths(
        prefillTotalMonths && prefillTotalMonths > 0 ? prefillTotalMonths.toString() : ""
      );
      setName("");
      setDescription("");
      setErrors({});
    }
  }, [visible, prefillTargetAmount, prefillTotalMonths]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40, maxHeight: "90%",
    },
    handle: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    title: { fontSize: 20, fontWeight: "800", color: theme.text },
    // Banner giữ nền vàng nhạt cố định (semantic) nên chữ giữ màu tối cố định.
    warningBanner: {
      flexDirection: "row", alignItems: "flex-start", gap: 8,
      backgroundColor: "#FEF9C3", borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
    },
    warningText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },
    label: { fontSize: 13, fontWeight: "600", color: theme.subtext, marginBottom: 6 },
    input: {
      backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: theme.text,
    },
    inputError: { borderColor: "#EF4444" },
    textArea: { minHeight: 72, textAlignVertical: "top" },
    inputRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border,
      borderRadius: 12, paddingHorizontal: 14,
    },
    inputInline: { flex: 1, height: 44, fontSize: 15, color: theme.text, fontWeight: "600" },
    currencyTag: { fontSize: 13, fontWeight: "700", color: theme.subtext },
    errorText: { fontSize: 12, color: "#EF4444", marginTop: 4 },
    createBtn: {
      marginTop: 28, height: 52, backgroundColor: theme.primary, borderRadius: 16,
      justifyContent: "center", alignItems: "center",
      shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
    createBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  }), [theme, mode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Project name is required";
    const amount = parseCurrencyToNumber(targetAmount);
    if (!amount || amount <= 0) e.targetAmount = "Target amount is required";
    const months = parseInt(totalMonths, 10);
    if (!months || months <= 0) e.totalMonths = "Duration is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Call suggestions API to simulate actual capacity and check feasibility with auto-sponsorship rules
      const suggestRes = await GroupAPI.getSuggestions({
        groupId: group.groupId,
        inputMonths: parseInt(totalMonths, 10),
        inputAmount: parseCurrencyToNumber(targetAmount),
      });

      if (suggestRes.success && suggestRes.data) {
        const data = suggestRes.data;
        if (!data.isFeasible) {
          Alert.alert(
            "Không khả thi",
            "Với mức thu nhập hiện tại của nhóm, mục tiêu này chưa thực sự phù hợp. Chúng tôi sẽ đề xuất các phương án khả thi dựa trên đóng góp của thành viên.",
            [
              {
                text: "Xem đề xuất",
                onPress: () => {
                  setLoading(false);
                  onNotFeasible?.();
                },
              },
              {
                text: "Hủy",
                style: "cancel",
                onPress: () => setLoading(false),
              },
            ]
          );
          return;
        }

        if (data.totalDeficit && data.totalDeficit > 0) {
          // Group can afford via sponsorship! Show simulation alert matching Web
          Alert.alert(
            "Mô Phỏng Gánh Vác Đóng Góp",
            "Một số thành viên trong nhóm không đủ khả năng tài chính để đóng góp đều nhau. Tuy nhiên, các thành viên khác có đủ khả năng bù đắp phần thiếu hụt này.\n\nDự án sẽ được khởi tạo dưới dạng Chờ duyệt tài trợ (hoặc Tự động kích hoạt nếu người gánh đã bật Auto-Sponsor). Bạn có muốn tiếp tục?",
            [
              { text: "Hủy bỏ", style: "cancel", onPress: () => setLoading(false) },
              {
                text: "Xác nhận & Khởi tạo",
                onPress: async () => {
                  setLoading(true);
                  await executeCreate();
                },
              },
            ]
          );
          return;
        }
      }

      await executeCreate();
    } catch {
      Alert.alert("Error", "Something went wrong.");
      setLoading(false);
    }
  };

  const executeCreate = async () => {
    try {
      const res = await GroupAPI.createGroupProject({
        groupId: group.groupId,
        name: name.trim(),
        description: description.trim() || undefined,
        targetAmount: parseCurrencyToNumber(targetAmount),
        totalMonths: parseInt(totalMonths, 10),
        currency: "VND",
      });
      if (res.success && res.data) {
        onCreated(res.data.groupProjectId);
      } else {
        const msg =
          getGroupProjectErrorMessage(res.errorCode, "create-project") ??
          res.message ??
          "Failed to create group project.";
        Alert.alert("Error", msg);
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const bypassDateGate = process.env.EXPO_PUBLIC_BYPASS_DATE_GATE === "true";
  const today = new Date().getDate();
  const outsideWindow = !bypassDateGate && (today < 1 || today > 7);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Create Group Project</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.subtext} />
            </Pressable>
          </View>

          {/* Warning banner */}
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={14} color="#92400E" />
            <Text style={styles.warningText}>
              Target and deadline are fixed after creation and cannot be changed.
            </Text>
          </View>

          {outsideWindow && (
            <View style={[styles.warningBanner, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="calendar-outline" size={14} color="#991B1B" />
              <Text style={[styles.warningText, { color: "#991B1B" }]}>
                Group projects can only be created on days 1–7 of each month.
              </Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="e.g. New Car Fund"
              placeholderTextColor={theme.subtext}
              value={name}
              onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: "" })); }}
              maxLength={120}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

            <Text style={[styles.label, { marginTop: 14 }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this project about?"
              placeholderTextColor={theme.subtext}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <Text style={[styles.label, { marginTop: 14 }]}>Target Amount (VND) *</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.inputInline, errors.targetAmount ? styles.inputError : null]}
                placeholder="10,000,000"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={(v) => { setTargetAmount(v); if (errors.targetAmount) setErrors((e) => ({ ...e, targetAmount: "" })); }}
              />
              <Text style={styles.currencyTag}>VND</Text>
            </View>
            {errors.targetAmount ? <Text style={styles.errorText}>{errors.targetAmount}</Text> : null}

            <Text style={[styles.label, { marginTop: 14 }]}>Duration (Months) *</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.inputInline, errors.totalMonths ? styles.inputError : null]}
                placeholder="7"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                value={totalMonths}
                onChangeText={(v) => { setTotalMonths(v); if (errors.totalMonths) setErrors((e) => ({ ...e, totalMonths: "" })); }}
              />
              <Text style={styles.currencyTag}>months</Text>
            </View>
            {errors.totalMonths ? <Text style={styles.errorText}>{errors.totalMonths}</Text> : null}
            <Pressable
              style={({ pressed }) => [
                styles.createBtn,
                pressed && { opacity: 0.85 },
                (loading || outsideWindow) && styles.btnDisabled,
              ]}
              onPress={handleCreate}
              disabled={loading || outsideWindow}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createBtnText}>Create Group Project</Text>
              )}
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
