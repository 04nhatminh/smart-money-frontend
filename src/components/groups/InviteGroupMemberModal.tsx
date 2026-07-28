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
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";

/** Xấp xỉ thời lượng animation "slide" của Modal trên RN. */
const CLOSE_ANIMATION_MS = 350;

type Props = {
  visible: boolean;
  groupId: string;
  onClose: () => void;
  onInvited: () => void;
};

export default function InviteGroupMemberModal({ visible, groupId, onClose, onInvited }: Props) {
  const { theme, mode } = useThemeMode();
  // Đọc lang để component re-render khi người dùng đổi ngôn ngữ.
  useLanguage();
  const insets = useSafeAreaInsets();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' || mode === 'purple' ? '#FFFFFF' : theme.card;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

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
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    title: { fontSize: 20, fontWeight: "800", color: theme.text },
    subtitle: { fontSize: 13, color: theme.subtext, lineHeight: 20, marginBottom: 20 },
    label: { fontSize: 13, fontWeight: "600", color: theme.subtext, marginBottom: 6 },
    input: {
      backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: theme.text,
    },
    inputError: { borderColor: "#EF4444" },
    errorText: { fontSize: 12, color: "#EF4444", marginTop: 4 },
    inviteBtn: {
      marginTop: 28, height: 52, backgroundColor: theme.primary, borderRadius: 16,
      flexDirection: "row", justifyContent: "center", alignItems: "center",
      shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
    inviteBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  }), [theme, mode, insets.bottom]);

  const reset = () => {
    setEmail("");
    setEmailError("");
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

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError(t("group.invite_email_required"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(t("group.invite_email_invalid"));
      return;
    }
    setEmailError("");
    setLoading(true);
    try {
      const res = await GroupAPI.inviteMember(groupId, { email: trimmed });
      if (res.success) {
        Alert.alert(t("group.invite_sent_title"), t("group.invite_sent_message", { email: trimmed }));
        onInvited();
        scheduleReset();
      } else {
        Alert.alert(t("common.error"), res.message || t("group.invite_failed"));
      }
    } catch {
      Alert.alert(t("common.error"), t("group.invite_failed"));
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

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{t("group.invite_title")}</Text>
                <Pressable onPress={handleClose} hitSlop={12}>
                  <Ionicons name="close" size={24} color={theme.subtext} />
                </Pressable>
              </View>

              <Text style={styles.subtitle}>{t("group.invite_subtitle")}</Text>

              <Text style={styles.label}>{t("group.invite_email_label")}</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder={t("group.invite_email_placeholder")}
                placeholderTextColor={theme.subtext}
                value={email}
                onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.inviteBtn, pressed && { opacity: 0.85 }, loading && styles.btnDisabled]}
                onPress={handleInvite}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.inviteBtnText}>{t("group.invite_action")}</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}
