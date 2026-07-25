import React, { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GroupAPI } from "../../api/group.api";
import { GroupDetailResponse, GroupListItemResponse } from "../../types/group.types";
import { useThemeMode } from "../../theme/ThemeProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (group: GroupDetailResponse) => void;
};

export default function CreateGroupModal({ visible, onClose, onCreated }: Props) {
  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  const [myGroups, setMyGroups] = useState<GroupDetailResponse[]>([]);
  const [cloneGroupId, setCloneGroupId] = useState("");
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  useEffect(() => {
    if (visible) {
      GroupAPI.getMyGroups().then(async (res) => {
        if (res.success && res.data) {
          // Fetch full details of each group to get member list (including emails)
          try {
            const detailedGroups = await Promise.all(
              res.data.map(async (g) => {
                const detailRes = await GroupAPI.getGroupDetail(g.groupId);
                return detailRes.success && detailRes.data ? detailRes.data : null;
              })
            );
            setMyGroups(detailedGroups.filter(Boolean) as GroupDetailResponse[]);
          } catch {
            // Fallback: we don't block opening the modal
          }
        }
      });
    }
  }, [visible]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40,
    },
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
  }), [theme, mode]);

  const reset = () => {
    setName("");
    setDescription("");
    setNameError("");
    setCloneGroupId("");
    setShowSelectorModal(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError("Group name is required");
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
        reset();
        onCreated(res.data);
      } else {
        Alert.alert("Error", res.message || "Failed to create group.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>New Group</Text>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.subtext} />
              </Pressable>
            </View>

            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="e.g. Family Savings"
              placeholderTextColor={theme.subtext}
              value={name}
              onChangeText={(v) => { setName(v); if (nameError) setNameError(""); }}
              maxLength={120}
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            <Text style={[styles.label, { marginTop: 16 }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What is this group saving for?"
              placeholderTextColor={theme.subtext}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Clone from Group (Optional)</Text>
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
                  ? `Cloning: ${myGroups.find((g) => g.groupId === cloneGroupId)?.name}`
                  : "Select Group to Clone"}
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
                <Text style={styles.createBtnText}>Create Group</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Select Group Modal Overlay */}
      <Modal
        visible={showSelectorModal && visible}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSelectorModal(false)}
      >
        <Pressable style={styles.selectorOverlay} onPress={() => setShowSelectorModal(false)}>
          <Pressable style={styles.selectorSheet} onPress={() => {}}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Select Group to Clone</Text>
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
                  -- Do not clone (Empty group) --
                </Text>
                {!cloneGroupId && <Ionicons name="checkmark" size={20} color={accent} />}
              </Pressable>

              {myGroups.map((g) => {
                const memberEmails = g.members
                  .filter((m) => m.inviteStatus === "JOINED")
                  .map((m) => m.email || m.username || "Unknown")
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
                          Members: {memberEmails}
                        </Text>
                      ) : (
                        <Text style={styles.selectorItemSub}>No members joined yet</Text>
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
