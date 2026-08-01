import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  GroupDetailResponse,
  GroupProjectSuggestionsResponse,
} from "../../types/group.types";
import { formatCurrencyVND, formatNumberWithDots, parseCurrencyToNumber } from "../../utils/project";
import { useThemeMode } from "../../theme/ThemeProvider";
import { Theme, ThemeMode } from "../../theme/tokens";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";

/** Xấp xỉ thời lượng animation "slide" của Modal trên RN. */
const CLOSE_ANIMATION_MS = 350;

type PlanMode = "amount" | "duration";

type Props = {
  visible: boolean;
  group: GroupDetailResponse;
  onClose: () => void;
  onContinue: (prefill: { targetAmount: number; totalMonths: number; totalCapacity: number }) => void;
};

export default function GroupProjectSuggestionsModal({
  visible,
  group,
  onClose,
  onContinue,
}: Props) {
  const { theme, mode: themeMode } = useThemeMode();
  // Đọc lang để component re-render khi người dùng đổi ngôn ngữ.
  useLanguage();
  const insets = useSafeAreaInsets();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = themeMode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = themeMode === "green" || themeMode === "purple" ? "#FFFFFF" : theme.card;
  const styles = useMemo(
    () => createStyles(theme, themeMode, accent, surface, insets.bottom),
    [theme, themeMode, accent, surface, insets.bottom]
  );

  const [mode, setMode] = useState<PlanMode>("amount");
  const [amountInput, setAmountInput] = useState("");
  const [monthsInput, setMonthsInput] = useState("");
  const [suggestion, setSuggestion] = useState<GroupProjectSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);

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

  // The anchor is whichever value the admin is fixing; the other is derived by
  // the backend from the group's monthly capacity.
  const anchorAmount = parseCurrencyToNumber(amountInput);
  const anchorMonths = parseInt(monthsInput, 10);
  const anchorValid = mode === "amount" ? anchorAmount > 0 : anchorMonths > 0;

  // Any change to the anchor or the mode invalidates a prior suggestion, so a
  // stale derived value can never be shown against a different input.
  const switchMode = (next: PlanMode) => {
    if (next === mode) return;
    setMode(next);
    setSuggestion(null);
  };

  const handleAmountChange = (v: string) => {
    // Hiển thị số tiền có dấu chấm ngăn cách hàng nghìn ngay khi gõ.
    const numeric = parseCurrencyToNumber(v);
    setAmountInput(numeric > 0 ? formatNumberWithDots(numeric) : "");
    setSuggestion(null);
  };

  const handleMonthsChange = (v: string) => {
    setMonthsInput(v);
    setSuggestion(null);
  };

  const calculate = async () => {
    const payload =
      mode === "amount"
        ? { groupId: group.groupId, inputAmount: anchorAmount }
        : { groupId: group.groupId, inputMonths: anchorMonths };
    setLoading(true);
    try {
      const res = await GroupAPI.getSuggestions(payload);
      if (res.success && res.data) setSuggestion(res.data);
      else Alert.alert(t("common.error"), res.message || t("group.suggestions.fetch_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!suggestion) return;
    // Keep the anchor verbatim; take the other dimension from the suggestion.
    const targetAmount = mode === "amount" ? anchorAmount : suggestion.suggestedAmount;
    const totalMonths = mode === "amount" ? suggestion.suggestedMonths : anchorMonths;
    if (!targetAmount || !totalMonths) return;
    onContinue({ targetAmount, totalMonths, totalCapacity: suggestion.totalCapacity });
    handleClose();
  };

  const reset = () => {
    setMode("amount");
    setAmountInput("");
    setMonthsInput("");
    setSuggestion(null);
    // Về 0 khi animation đã xong, để lần mở sau không còn padding bàn phím cũ.
    setKeyboardHeight(0);
  };

  // Xoá form SAU khi animation trượt xuống kết thúc. Reset ngay lúc bấm đóng sẽ
  // vẽ lại nội dung sheet đè lên frame đang chạy animation -> giật/nháy. Lúc timer
  // chạy thì visible đã false nên Modal không render children.
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReset = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      resetTimer.current = null;
      reset();
    }, CLOSE_ANIMATION_MS);
  };

  // Mở lại trước khi timer kịp chạy: reset ngay để form không còn dữ liệu cũ.
  useEffect(() => {
    if (visible && resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
      reset();
    }
  }, [visible]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const handleClose = () => {
    // Ẩn bàn phím trước: animation ẩn bàn phím chạy song song với animation
    // trượt xuống của sheet sẽ làm cửa sổ resize giữa chừng -> giật.
    Keyboard.dismiss();
    onClose();
    scheduleReset();
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
            <Text style={styles.title}>{t("group.suggestions.title")}</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.subtext} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>{t("group.suggestions.subtitle")}</Text>

          {/* Mode toggle */}
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleTab, mode === "amount" && styles.toggleTabActive]}
              onPress={() => switchMode("amount")}
            >
              <Text style={[styles.toggleText, mode === "amount" && styles.toggleTextActive]}>
                {t("group.suggestions.by_amount")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleTab, mode === "duration" && styles.toggleTabActive]}
              onPress={() => switchMode("duration")}
            >
              <Text style={[styles.toggleText, mode === "duration" && styles.toggleTextActive]}>
                {t("group.suggestions.by_duration")}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mode === "amount" ? (
              <>
                <Text style={styles.label}>{t("group.suggestions.amount_label")}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("group.suggestions.amount_placeholder")}
                    placeholderTextColor={theme.subtext}
                    keyboardType="numeric"
                    value={amountInput}
                    onChangeText={handleAmountChange}
                  />
                  <Text style={styles.currencyTag}>VND</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t("group.suggestions.months_label")}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder={t("group.suggestions.months_placeholder")}
                    placeholderTextColor={theme.subtext}
                    keyboardType="numeric"
                    value={monthsInput}
                    onChangeText={handleMonthsChange}
                  />
                  <Text style={styles.currencyTag}>{t("group.project_months_unit")}</Text>
                </View>
              </>
            )}

            {/* Derived preview */}
            {suggestion && (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Ionicons name="people-outline" size={15} color={accent} />
                  <Text style={styles.previewMuted}>
                    {t("group.suggestions.capacity", {
                      amount: formatCurrencyVND(suggestion.totalCapacity),
                    })}
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                {mode === "amount" ? (
                  <Text style={styles.previewMain}>
                    {t("group.suggestions.result_months_label")}{" "}
                    <Text style={styles.previewBold}>
                      {t("group.suggestions.result_months_value", { count: suggestion.suggestedMonths })}
                    </Text>
                  </Text>
                ) : (
                  <Text style={styles.previewMain}>
                    {t("group.suggestions.result_amount_label")}{" "}
                    <Text style={styles.previewBold}>
                      {t("group.suggestions.result_amount_value", {
                        amount: formatCurrencyVND(suggestion.suggestedAmount),
                      })}
                    </Text>
                  </Text>
                )}
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.85 },
                (!anchorValid || loading) && styles.btnDisabled,
              ]}
              onPress={suggestion ? handleContinue : calculate}
              disabled={!anchorValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {suggestion ? t("common.continue") : t("group.suggestions.calculate")}
                </Text>
              )}
            </Pressable>

            {suggestion && (
              <Text style={styles.footnote}>{t("group.suggestions.footnote")}</Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
      </View>
    </Modal>
  );
}

// Factory style theo theme: overlay giữ rgba, chữ trắng trên nút primary giữ nguyên.
const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string, bottomInset: number) =>
  StyleSheet.create({
    avoider: { flex: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingTop: 24, paddingHorizontal: 24,
      // Nền kéo thêm xuống dưới phần nội dung cho sheet đầy đặn hơn.
      paddingBottom: 24,
      maxHeight: "92%",
    },
    sheetScroll: { flexGrow: 0 },
    // Chừa chỗ cho thanh điều hướng / home indicator vì sheet vẽ tràn xuống đáy.
    sheetContent: { paddingBottom: 40 + bottomInset },
    handle: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    title: { fontSize: 20, fontWeight: "800", color: theme.text },
    subtitle: { fontSize: 13, color: theme.subtext, lineHeight: 19, marginBottom: 18 },
    toggleRow: {
      flexDirection: "row", backgroundColor: theme.inputBg, borderRadius: 12,
      padding: 4, marginBottom: 20,
    },
    toggleTab: { flex: 1, height: 38, borderRadius: 9, justifyContent: "center", alignItems: "center" },
    toggleTabActive: {
      backgroundColor: surface,
      shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1,
    },
    toggleText: { fontSize: 14, fontWeight: "600", color: theme.subtext },
    toggleTextActive: { color: accent, fontWeight: "700" },
    label: { fontSize: 13, fontWeight: "600", color: theme.subtext, marginBottom: 8 },
    inputRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border,
      borderRadius: 12, paddingHorizontal: 14,
    },
    input: { flex: 1, height: 48, fontSize: 16, color: theme.text, fontWeight: "700" },
    currencyTag: { fontSize: 13, fontWeight: "700", color: theme.subtext },
    previewCard: { backgroundColor: accent + "15", borderRadius: 14, padding: 16, marginTop: 16 },
    previewRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    previewMuted: { fontSize: 12, color: theme.subtext, fontWeight: "500" },
    previewDivider: { height: 1, backgroundColor: accent + "30", marginVertical: 10 },
    previewMain: { fontSize: 15, color: theme.text, lineHeight: 22 },
    previewBold: { fontWeight: "800", color: accent },
    primaryBtn: {
      marginTop: 24, height: 52, backgroundColor: theme.primary, borderRadius: 16,
      justifyContent: "center", alignItems: "center",
      shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
    primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    footnote: { fontSize: 12, color: theme.subtext, textAlign: "center", marginTop: 12, lineHeight: 17 },
  });
