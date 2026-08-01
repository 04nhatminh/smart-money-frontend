import React, { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupAPI } from "../../api/group.api";
import { GroupDetailResponse } from "../../types/group.types";
import { formatCurrencyVND, formatNumberWithDots, parseCurrencyToNumber } from "../../utils/project";
import { getGroupProjectErrorMessage } from "../../utils/groupProjectErrors";
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";

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
  // Đọc lang để component re-render khi người dùng đổi ngôn ngữ.
  useLanguage();
  const insets = useSafeAreaInsets();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' || mode === 'purple' ? '#FFFFFF' : theme.card;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [totalMonths, setTotalMonths] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setTargetAmount(
        prefillTargetAmount && prefillTargetAmount > 0 ? formatNumberWithDots(prefillTargetAmount) : ""
      );
      setTotalMonths(
        prefillTotalMonths && prefillTotalMonths > 0 ? prefillTotalMonths.toString() : ""
      );
      setName("");
      setDescription("");
      setErrors({});
    }
  }, [visible, prefillTargetAmount, prefillTotalMonths]);

  // Tự né bàn phím thay cho KeyboardAvoidingView: KAV khởi tạo lại từ
  // Keyboard.metrics() nên khi mở lại modal sau lần trước có gõ phím, nó dựng
  // sẵn padding cũ -> sheet "nảy" lên rồi mới rơi xuống. Ở đây mỗi lần mở luôn
  // bắt đầu từ 0 và chỉ đổi theo sự kiện bàn phím thật.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setKeyboardHeight(0);

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const styles = useMemo(() => StyleSheet.create({
    avoider: { flex: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingTop: 24, paddingHorizontal: 24,
      // Nền kéo thêm xuống dưới phần nội dung cho sheet đầy đặn hơn.
      paddingBottom: 24,
      // Giới hạn chiều cao để nội dung cuộn được khi bàn phím đẩy sheet lên.
      maxHeight: "92%",
    },
    sheetScroll: { flexGrow: 0 },
    // Chừa chỗ cho thanh điều hướng / home indicator vì sheet giờ vẽ tràn xuống đáy.
    sheetContent: { paddingBottom: 40 + insets.bottom },
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
  }), [theme, mode, insets.bottom]);

  const handleClose = () => {
    // Ẩn bàn phím trước: animation ẩn bàn phím chạy song song với animation
    // trượt xuống của sheet sẽ làm cửa sổ resize giữa chừng -> giật.
    Keyboard.dismiss();
    onClose();
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t("group.project_name_required");
    const amount = parseCurrencyToNumber(targetAmount);
    if (!amount || amount <= 0) e.targetAmount = t("group.project_target_required");
    const months = parseInt(totalMonths, 10);
    if (!months || months <= 0) e.totalMonths = t("group.project_duration_required");
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
            t("group.project_not_feasible_title"),
            t("group.project_not_feasible_message"),
            [
              {
                text: t("group.project_view_suggestions"),
                onPress: () => {
                  setLoading(false);
                  onNotFeasible?.();
                },
              },
              {
                text: t("common.cancel"),
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
            t("group.project_sponsor_title"),
            t("group.project_sponsor_message"),
            [
              { text: t("common.cancel"), style: "cancel", onPress: () => setLoading(false) },
              {
                text: t("group.project_sponsor_confirm"),
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
      Alert.alert(t("common.error"), t("group.project_create_failed"));
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
          t("group.project_create_failed");
        Alert.alert(t("common.error"), msg);
      }
    } catch {
      Alert.alert(t("common.error"), t("group.project_create_failed"));
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
      onRequestClose={handleClose}
    >
      {/* Modal edge-to-edge trên Android không được hệ thống resize, nên phải tự
          đẩy sheet lên: chỉ thêm padding đáy đúng bằng chiều cao bàn phím. */}
      <View style={[styles.avoider, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>{t("group.project_create_title")}</Text>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.subtext} />
              </Pressable>
            </View>

            {/* Warning banner */}
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={14} color="#92400E" />
              <Text style={styles.warningText}>{t("group.project_warning")}</Text>
            </View>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>{t("group.project_name_label")}</Text>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder={t("group.project_name_placeholder")}
                placeholderTextColor={theme.subtext}
                value={name}
                onChangeText={(v) => { setName(v); if (errors.name) setErrors((e) => ({ ...e, name: "" })); }}
                maxLength={120}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

              <Text style={[styles.label, { marginTop: 14 }]}>{t("group.project_description_label")}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t("group.project_description_placeholder")}
                placeholderTextColor={theme.subtext}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />

              <Text style={[styles.label, { marginTop: 14 }]}>{t("group.project_target_label")}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.inputInline, errors.targetAmount ? styles.inputError : null]}
                  placeholder={t("group.project_target_placeholder")}
                  placeholderTextColor={theme.subtext}
                  keyboardType="numeric"
                  value={targetAmount}
                  onChangeText={(v) => {
                    // Hiển thị số tiền có dấu chấm ngăn cách hàng nghìn ngay khi gõ.
                    const numeric = parseCurrencyToNumber(v);
                    setTargetAmount(numeric > 0 ? formatNumberWithDots(numeric) : "");
                    if (errors.targetAmount) setErrors((e) => ({ ...e, targetAmount: "" }));
                  }}
                />
                <Text style={styles.currencyTag}>VND</Text>
              </View>
              {errors.targetAmount ? <Text style={styles.errorText}>{errors.targetAmount}</Text> : null}

              <Text style={[styles.label, { marginTop: 14 }]}>{t("group.project_duration_label")}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.inputInline, errors.totalMonths ? styles.inputError : null]}
                  placeholder={t("group.project_duration_placeholder")}
                  placeholderTextColor={theme.subtext}
                  keyboardType="numeric"
                  value={totalMonths}
                  onChangeText={(v) => { setTotalMonths(v); if (errors.totalMonths) setErrors((e) => ({ ...e, totalMonths: "" })); }}
                />
                <Text style={styles.currencyTag}>{t("group.project_months_unit")}</Text>
              </View>
              {errors.totalMonths ? <Text style={styles.errorText}>{errors.totalMonths}</Text> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.createBtn,
                  pressed && { opacity: 0.85 },
                  loading && styles.btnDisabled,
                ]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.createBtnText}>{t("group.project_create_action")}</Text>
                )}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}
