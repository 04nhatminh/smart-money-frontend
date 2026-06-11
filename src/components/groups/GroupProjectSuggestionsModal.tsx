import React, { useState } from "react";
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
import CreateGroupProjectModal from "./CreateGroupProjectModal";

type Props = {
  visible: boolean;
  group: GroupDetailResponse;
  onClose: () => void;
  onProjectCreated: (groupProjectId: string) => void;
};

export default function GroupProjectSuggestionsModal({
  visible,
  group,
  onClose,
  onProjectCreated,
}: Props) {
  const [amountInput, setAmountInput] = useState("");
  const [monthsInput, setMonthsInput] = useState("");
  const [suggestion, setSuggestion] = useState<GroupProjectSuggestionsResponse | null>(null);
  const [loadingAmount, setLoadingAmount] = useState(false);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [prefill, setPrefill] = useState<{ targetAmount: number; totalMonths: number } | null>(null);

  const totalCapacity = suggestion?.totalCapacity ?? 0;

  const fetchByAmount = async () => {
    const amount = parseCurrencyToNumber(amountInput);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Enter a valid target amount.");
      return;
    }
    setLoadingAmount(true);
    try {
      const res = await GroupAPI.getSuggestions({ groupId: group.groupId, inputAmount: amount });
      if (res.success && res.data) setSuggestion(res.data);
      else Alert.alert("Error", res.message || "Could not fetch suggestions.");
    } finally {
      setLoadingAmount(false);
    }
  };

  const fetchByMonths = async () => {
    const months = parseInt(monthsInput, 10);
    if (!months || months <= 0) {
      Alert.alert("Error", "Enter a valid number of months.");
      return;
    }
    setLoadingMonths(true);
    try {
      const res = await GroupAPI.getSuggestions({ groupId: group.groupId, inputMonths: months });
      if (res.success && res.data) setSuggestion(res.data);
      else Alert.alert("Error", res.message || "Could not fetch suggestions.");
    } finally {
      setLoadingMonths(false);
    }
  };

  const handleUseAmount = () => {
    const amount = parseCurrencyToNumber(amountInput);
    const months = suggestion?.suggestedMonths ?? parseInt(monthsInput, 10);
    if (!amount || !months) return;
    setPrefill({ targetAmount: amount, totalMonths: months });
    setShowCreate(true);
  };

  const handleUseMonths = () => {
    const months = parseInt(monthsInput, 10) || suggestion?.suggestedMonths;
    const amount = suggestion?.suggestedAmount ?? parseCurrencyToNumber(amountInput);
    if (!amount || !months) return;
    setPrefill({ targetAmount: amount, totalMonths: months });
    setShowCreate(true);
  };

  const handleClose = () => {
    setAmountInput("");
    setMonthsInput("");
    setSuggestion(null);
    setPrefill(null);
    onClose();
  };

  return (
    <>
      <Modal visible={visible && !showCreate} transparent animationType="slide" onRequestClose={handleClose}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Plan Group Project</Text>
              <Pressable onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            {suggestion && (
              <View style={styles.capacityRow}>
                <Ionicons name="people-outline" size={14} color="#3629B7" />
                <Text style={styles.capacityText}>
                  Total capacity: <Text style={styles.capacityBold}>{formatCurrencyVND(suggestion.totalCapacity)} VND/month</Text>
                </Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* By Amount */}
              <View style={styles.calcCard}>
                <Text style={styles.calcLabel}>I want to save:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.calcInput}
                    placeholder="e.g. 10,000,000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={amountInput}
                    onChangeText={setAmountInput}
                  />
                  <Text style={styles.currencyTag}>VND</Text>
                </View>
                {suggestion && amountInput && suggestion.suggestedMonths != null ? (
                  <View style={styles.resultRow}>
                    <Ionicons name="arrow-forward" size={14} color="#3629B7" />
                    <Text style={styles.resultText}>
                      Minimum months needed: <Text style={styles.resultBold}>{suggestion.suggestedMonths}</Text>
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.calcBtn, pressed && { opacity: 0.85 }, loadingAmount && styles.btnDisabled]}
                  onPress={fetchByAmount}
                  disabled={loadingAmount}
                >
                  {loadingAmount ? <ActivityIndicator color="#3629B7" size="small" /> : <Text style={styles.calcBtnText}>Calculate</Text>}
                </Pressable>
              </View>

              {/* By Months */}
              <View style={[styles.calcCard, { marginTop: 12 }]}>
                <Text style={styles.calcLabel}>I want to finish in:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.calcInput}
                    placeholder="e.g. 6"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={monthsInput}
                    onChangeText={setMonthsInput}
                  />
                  <Text style={styles.currencyTag}>months</Text>
                </View>
                {suggestion && monthsInput && suggestion.suggestedAmount != null ? (
                  <View style={styles.resultRow}>
                    <Ionicons name="arrow-forward" size={14} color="#3629B7" />
                    <Text style={styles.resultText}>
                      Achievable amount: <Text style={styles.resultBold}>{formatCurrencyVND(suggestion.suggestedAmount)} VND</Text>
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.calcBtn, pressed && { opacity: 0.85 }, loadingMonths && styles.btnDisabled]}
                  onPress={fetchByMonths}
                  disabled={loadingMonths}
                >
                  {loadingMonths ? <ActivityIndicator color="#3629B7" size="small" /> : <Text style={styles.calcBtnText}>Calculate</Text>}
                </Pressable>
              </View>

              {suggestion && (
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.useBtn, pressed && { opacity: 0.85 }]}
                    onPress={handleUseAmount}
                    disabled={!amountInput}
                  >
                    <Text style={styles.useBtnText}>Use Amount</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.useBtn, styles.useBtnAlt, pressed && { opacity: 0.85 }]}
                    onPress={handleUseMonths}
                    disabled={!monthsInput}
                  >
                    <Text style={[styles.useBtnText, { color: "#3629B7" }]}>Use Months</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {prefill && (
        <CreateGroupProjectModal
          visible={showCreate}
          group={group}
          prefillTargetAmount={prefill.targetAmount}
          prefillTotalMonths={prefill.totalMonths}
          onClose={() => { setShowCreate(false); setPrefill(null); }}
          onCreated={(id) => { setShowCreate(false); onProjectCreated(id); }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, maxHeight: "85%",
  },
  handle: { width: 40, height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  capacityRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EEF0FF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 16 },
  capacityText: { fontSize: 13, color: "#3629B7" },
  capacityBold: { fontWeight: "700" },
  calcCard: {
    backgroundColor: "#F8FAFC", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
  },
  calcLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 10 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 10,
  },
  calcInput: { flex: 1, height: 44, fontSize: 15, color: "#0F172A", fontWeight: "600" },
  currencyTag: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  resultText: { fontSize: 13, color: "#475569" },
  resultBold: { fontWeight: "700", color: "#0F172A" },
  calcBtn: {
    height: 38, backgroundColor: "#EEF0FF", borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  calcBtnText: { fontSize: 13, fontWeight: "700", color: "#3629B7" },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  useBtn: {
    flex: 1, height: 48, backgroundColor: "#3629B7", borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  useBtnAlt: { backgroundColor: "#EEF0FF" },
  useBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
