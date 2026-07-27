import React, { useMemo, useState } from "react";
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
import {
  GroupDetailResponse,
  GroupProjectSuggestionsResponse,
} from "../../types/group.types";
import { formatCurrencyVND, parseCurrencyToNumber } from "../../utils/project";
import { useThemeMode } from "../../theme/ThemeProvider";
import { Theme, ThemeMode } from "../../theme/tokens";
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
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = themeMode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = themeMode === "green" ? "#FFFFFF" : theme.card;
  const styles = useMemo(
    () => createStyles(theme, themeMode, accent, surface),
    [theme, themeMode, accent, surface]
  );

  const [mode, setMode] = useState<PlanMode>("amount");
  const [amountInput, setAmountInput] = useState("");
  const [monthsInput, setMonthsInput] = useState("");
  const [suggestion, setSuggestion] = useState<GroupProjectSuggestionsResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
    setAmountInput(v);
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
      else Alert.alert("Error", res.message || "Could not fetch suggestions.");
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

  const handleClose = () => {
    setMode("amount");
    setAmountInput("");
    setMonthsInput("");
    setSuggestion(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Plan Group Project</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.subtext} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Fix either the target or the duration — we'll work out the other from your group's monthly capacity.
          </Text>

          {/* Mode toggle */}
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleTab, mode === "amount" && styles.toggleTabActive]}
              onPress={() => switchMode("amount")}
            >
              <Text style={[styles.toggleText, mode === "amount" && styles.toggleTextActive]}>
                By Amount
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleTab, mode === "duration" && styles.toggleTabActive]}
              onPress={() => switchMode("duration")}
            >
              <Text style={[styles.toggleText, mode === "duration" && styles.toggleTextActive]}>
                By Duration
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {mode === "amount" ? (
              <>
                <Text style={styles.label}>I want to save</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10,000,000"
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
                <Text style={styles.label}>I want to finish in</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 6"
                    placeholderTextColor={theme.subtext}
                    keyboardType="numeric"
                    value={monthsInput}
                    onChangeText={handleMonthsChange}
                  />
                  <Text style={styles.currencyTag}>months</Text>
                </View>
              </>
            )}

            {/* Derived preview */}
            {suggestion && (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Ionicons name="people-outline" size={15} color={accent} />
                  <Text style={styles.previewMuted}>
                    Group capacity: {formatCurrencyVND(suggestion.totalCapacity)} VND/month
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                {mode === "amount" ? (
                  <Text style={styles.previewMain}>
                    Reaches your goal in{" "}
                    <Text style={styles.previewBold}>{suggestion.suggestedMonths} months</Text>
                  </Text>
                ) : (
                  <Text style={styles.previewMain}>
                    Your group can save{" "}
                    <Text style={styles.previewBold}>
                      {formatCurrencyVND(suggestion.suggestedAmount)} VND
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
                <Text style={styles.primaryBtnText}>{suggestion ? "Continue" : "Calculate"}</Text>
              )}
            </Pressable>

            {suggestion && (
              <Text style={styles.footnote}>
                You can fine-tune the exact target and duration on the next step.
              </Text>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Factory style theo theme: overlay giữ rgba, chữ trắng trên nút primary giữ nguyên.
const createStyles = (theme: Theme, mode: ThemeMode, accent: string, surface: string) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 40, maxHeight: "85%",
    },
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
