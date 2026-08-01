import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupAPI } from "../../api/group.api";
import { GroupDetailResponse, GroupListItemResponse } from "../../types/group.types";
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";

/** Xấp xỉ thời lượng animation "slide" của Modal trên RN. */
const CLOSE_ANIMATION_MS = 350;

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (group: GroupDetailResponse) => void;
};

export default function CreateGroupModal({ visible, onClose, onCreated }: Props) {
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
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  const [myGroups, setMyGroups] = useState<GroupDetailResponse[]>([]);
  const [cloneGroupId, setCloneGroupId] = useState("");
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Huỷ khi modal đóng: tránh setState (kéo theo re-render cả danh sách nhóm)
    // ngay giữa lúc sheet đang chạy animation trượt xuống.
    let cancelled = false;

    GroupAPI.getMyGroups().then(async (res) => {
      if (cancelled || !res.success || !res.data) return;
      // Fetch full details of each group to get member list (including emails)
      try {
        const detailedGroups = await Promise.all(
          res.data.map(async (g) => {
            const detailRes = await GroupAPI.getGroupDetail(g.groupId);
            return detailRes.success && detailRes.data ? detailRes.data : null;
          })
        );
        if (cancelled) return;
        setMyGroups(detailedGroups.filter(Boolean) as GroupDetailResponse[]);
      } catch {
        // Fallback: we don't block opening the modal
      }
    });

    return () => { cancelled = true; };
  }, [visible]);

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
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    title: { fontSize: 20, fontWeight: "800", color: theme.text },
    label: { fontSize: 13, fontWeight: "600", color: theme.subtext, marginBottom: 6 },
    input: {
      backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: theme.text,
    },
    inputError: { borderColor: "#EF4444" },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    errorText: { fontSize: 12, color: "#EF4444", marginTop: 4 },
    cloneButton: {
      borderWidth: 1.5,
      borderColor: accent,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: accent + "15",
      marginTop: 8,
    },
    cloneButtonSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    cloneButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: accent,
    },
    createBtn: {
      marginTop: 28, height: 52, backgroundColor: theme.primary, borderRadius: 16,
      justifyContent: "center", alignItems: "center",
      shadowColor: "#3629B7", shadowOpacity: 0.25, shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    btnDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0, elevation: 0 },
    createBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

    // Selector Modal Overlay Styles
    selectorOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    selectorSheet: {
      backgroundColor: surface,
      borderRadius: 20,
      width: "100%",
      maxHeight: "70%",
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    selectorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingBottom: 14,
      marginBottom: 10,
    },
    selectorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    selectorList: {
      marginTop: 8,
    },
    selectorItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: theme.inputBg,
    },
    selectorItemActive: {
      backgroundColor: accent + "15",
      borderWidth: 1,
      borderColor: accent,
    },
    selectorItemText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    selectorItemTextActive: {
      color: accent,
    },
    selectorItemSub: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 4,
    },
    selectorItemEmails: {
      fontSize: 12,
      color: theme.subtext,
      marginTop: 4,
      lineHeight: 16,
    },
  }), [theme, mode, insets.bottom]);

  const reset = () => {
    setName("");
    setDescription("");
    setNameError("");
    setCloneGroupId("");
    setShowSelectorModal(false);
    // Về 0 khi animation đã xong, để lần mở sau không còn padding bàn phím cũ.
    setKeyboardHeight(0);
  };

  // Xoá form SAU khi animation trượt xuống kết thúc. Reset ngay lúc bấm đóng sẽ
  // vẽ lại toàn bộ nội dung sheet (chữ biến mất, nút clone đổi màu) đè lên frame
  // đang chạy animation -> giật/nháy. Lúc timer chạy thì visible đã false nên
  // Modal không render children, re-render gần như miễn phí.
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
    // Đóng selector trước (nếu đang mở) để hai modal không cùng animate.
    setShowSelectorModal(false);
    onClose();
    scheduleReset();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError(t("group.name_required"));
      return;
    }
    setNameError("");
    setLoading(true);
    try {
      const res = await GroupAPI.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        cloneGroupId: cloneGroupId || undefined,
      });
      if (res.success && res.data) {
        onCreated(res.data);
        scheduleReset();
      } else {
        Alert.alert(t("common.error"), res.message || t("group.create_failed"));
      }
    } catch {
      Alert.alert(t("common.error"), t("group.create_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* statusBar/navigationBarTranslucent: app bật edge-to-edge, thiếu 2 cờ này
          thì Modal dừng ngay trên thanh điều hướng -> lộ giao diện phía dưới. */}
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
                  <Text style={styles.title}>{t("group.create_title")}</Text>
                  <Pressable onPress={handleClose} hitSlop={12}>
                    <Ionicons name="close" size={24} color={theme.subtext} />
                  </Pressable>
                </View>

                <Text style={styles.label}>{t("group.name_label")}</Text>
                <TextInput
                  style={[styles.input, nameError ? styles.inputError : null]}
                  placeholder={t("group.name_placeholder")}
                  placeholderTextColor={theme.subtext}
                  value={name}
                  onChangeText={(v) => { setName(v); if (nameError) setNameError(""); }}
                  maxLength={120}
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                <Text style={[styles.label, { marginTop: 16 }]}>{t("group.description_label")}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={t("group.description_placeholder")}
                  placeholderTextColor={theme.subtext}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />

                <Text style={[styles.label, { marginTop: 16 }]}>{t("group.clone_label")}</Text>
                <Pressable
                  style={[styles.cloneButton, cloneGroupId ? styles.cloneButtonSelected : null]}
                  onPress={() => setShowSelectorModal(true)}
                >
                  <Ionicons
                    name={cloneGroupId ? "copy" : "copy-outline"}
                    size={18}
                    color={cloneGroupId ? "#FFFFFF" : accent}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.cloneButtonText, cloneGroupId ? { color: "#FFFFFF" } : null]} numberOfLines={1}>
                    {cloneGroupId
                      ? t("group.cloning", { name: myGroups.find((g) => g.groupId === cloneGroupId)?.name ?? "" })
                      : t("group.clone_select")}
                  </Text>
                  {cloneGroupId && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setCloneGroupId("");
                      }}
                      style={{ marginLeft: 10 }}
                      hitSlop={10}
                    >
                      <Ionicons name="close-circle" size={18} color="#FFFFFF" />
                    </Pressable>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }, loading && styles.btnDisabled]}
                  onPress={handleCreate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createBtnText}>{t("group.create_action")}</Text>
                  )}
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </View>
      </Modal>

      {/* Select Group Modal Overlay */}
      <Modal
        visible={showSelectorModal && visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowSelectorModal(false)}
      >
        <Pressable style={styles.selectorOverlay} onPress={() => setShowSelectorModal(false)}>
          <Pressable style={styles.selectorSheet} onPress={() => {}}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>{t("group.clone_select")}</Text>
              <Pressable onPress={() => setShowSelectorModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.subtext} />
              </Pressable>
            </View>
            <ScrollView style={styles.selectorList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Pressable
                style={[styles.selectorItem, !cloneGroupId && styles.selectorItemActive]}
                onPress={() => {
                  setCloneGroupId("");
                  setShowSelectorModal(false);
                }}
              >
                <Text style={[styles.selectorItemText, !cloneGroupId && styles.selectorItemTextActive]}>
                  {t("group.clone_none")}
                </Text>
                {!cloneGroupId && <Ionicons name="checkmark" size={20} color={accent} />}
              </Pressable>

              {myGroups.map((g) => {
                const memberEmails = g.members
                  .filter((m) => m.inviteStatus === "JOINED")
                  .map((m) => m.email || m.username || t("group.unknown_member"))
                  .join(", ");

                return (
                  <Pressable
                    key={g.groupId}
                    style={[styles.selectorItem, cloneGroupId === g.groupId && styles.selectorItemActive]}
                    onPress={() => {
                      setCloneGroupId(g.groupId);
                      setShowSelectorModal(false);
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.selectorItemText, cloneGroupId === g.groupId && styles.selectorItemTextActive]}>
                        {g.name}
                      </Text>
                      {memberEmails ? (
                        <Text style={styles.selectorItemEmails} numberOfLines={2}>
                          {t("group.members", { emails: memberEmails })}
                        </Text>
                      ) : (
                        <Text style={styles.selectorItemSub}>{t("group.no_members")}</Text>
                      )}
                    </View>
                    {cloneGroupId === g.groupId && <Ionicons name="checkmark" size={20} color={accent} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
