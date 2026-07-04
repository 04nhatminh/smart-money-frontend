import React, { useRef, useState, useEffect } from "react";
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Ionicons } from "@expo/vector-icons";
import AIAPI from "../../src/api/ai.api";
import { budgetAPI } from "../../src/api/budget.api";
import { ProjectAPI } from "../../src/api/project.api";
import { useAISuggestions } from "../../src/context/AISuggestionContext";
import { t } from "../../src/i18n";          // ← thêm import
import { useLanguage } from "../../src/i18n/LanguageProvider"; // (tuỳ chọn)
import { formatVND } from "../../src/utils/formatCurrency";
import {
  ChatIntent,
  BudgetUpdateSuggestion,
  SavingsPlanSuggestion,
  SimulationResult,
} from "../../src/types/ai.types";

type MessagePhase = "context" | "thinking" | "streaming" | "done" | "error";
type SuggestionStatus = "pending" | "applying" | "confirmed" | "denied" | "error";

type BudgetSuggestionItem = BudgetUpdateSuggestion & {
  status: SuggestionStatus;
  errorMsg?: string;
};

type SavingsSuggestionItem = SavingsPlanSuggestion & {
  status: SuggestionStatus;
  errorMsg?: string;
};

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
  phase?: MessagePhase;
  intent?: ChatIntent;
  budgetSuggestions?: BudgetSuggestionItem[];
  simulationResult?: SimulationResult;
  savingsSuggestions?: SavingsSuggestionItem[];
};

// Typewriter reveal speed for the "real-time generation" effect on the
// (already-complete) reply returned by POST /api/v1/ai/chat.
const TYPEWRITER_TICK_MS = 16;
const TYPEWRITER_TOTAL_TICKS = 45;
// Delay before switching the placeholder label from "loading context" to
// "thinking" — purely cosmetic staging since both happen inside one HTTP call.
const CONTEXT_PHASE_MS = 550;

function ThinkingIndicator({ label }: { label: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );

    const loops = [makeLoop(dot1, 0), makeLoop(dot2, 150), makeLoop(dot3, 300)];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dot1, dot2, dot3]);

  const dotStyle = (value: Animated.Value) => ({
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
    ],
  });

  return (
    <View style={styles.thinkingRow}>
      <Text style={styles.thinkingLabel}>{label}</Text>
      <View style={styles.thinkingDots}>
        <Animated.View style={[styles.thinkingDot, dotStyle(dot1)]} />
        <Animated.View style={[styles.thinkingDot, dotStyle(dot2)]} />
        <Animated.View style={[styles.thinkingDot, dotStyle(dot3)]} />
      </View>
    </View>
  );
}

function SuggestionActions({
  status,
  errorMsg,
  onConfirm,
  onDeny,
}: {
  status: SuggestionStatus;
  errorMsg?: string;
  onConfirm: () => void;
  onDeny: () => void;
}) {
  if (status === "applying") {
    return (
      <View style={styles.suggestionStatusRow}>
        <ActivityIndicator size="small" color="#3629B7" />
        <Text style={styles.suggestionStatusText}>{t('ai.suggestion_applying')}</Text>
      </View>
    );
  }
  if (status === "confirmed") {
    return (
      <View style={styles.suggestionStatusRow}>
        <Ionicons name="checkmark-circle" size={16} color="#2E9E5B" />
        <Text style={[styles.suggestionStatusText, { color: "#2E9E5B" }]}>
          {t('ai.suggestion_confirmed')}
        </Text>
      </View>
    );
  }
  if (status === "denied") {
    return (
      <View style={styles.suggestionStatusRow}>
        <Text style={styles.suggestionStatusText}>{t('ai.suggestion_denied')}</Text>
      </View>
    );
  }
  if (status === "error") {
    return (
      <View style={styles.suggestionStatusRow}>
        <Text style={[styles.suggestionStatusText, { color: "#D64545" }]}>
          {errorMsg || t('ai.suggestion_error')}
        </Text>
        <TouchableOpacity onPress={onConfirm} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>{t('ai.suggestion_confirm')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.suggestionActions}>
      <TouchableOpacity onPress={onDeny} style={styles.denyBtn}>
        <Text style={styles.denyBtnText}>{t('ai.suggestion_deny')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn}>
        <Text style={styles.confirmBtnText}>{t('ai.suggestion_confirm')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function BudgetSuggestionCard({
  suggestion,
  onConfirm,
  onDeny,
}: {
  suggestion: BudgetSuggestionItem;
  onConfirm: () => void;
  onDeny: () => void;
}) {
  return (
    <View style={styles.suggestionCard}>
      <Text style={styles.suggestionCardTitle}>{suggestion.category}</Text>
      <Text style={styles.suggestionCardAmounts}>
        {formatVND(suggestion.currentAmount)} → {formatVND(suggestion.suggestedAmount)}
      </Text>
      <Text style={styles.suggestionCardReason}>{suggestion.reason}</Text>
      <SuggestionActions
        status={suggestion.status}
        errorMsg={suggestion.errorMsg}
        onConfirm={onConfirm}
        onDeny={onDeny}
      />
    </View>
  );
}

function SavingsSuggestionCard({
  suggestion,
  onConfirm,
  onDeny,
}: {
  suggestion: SavingsSuggestionItem;
  onConfirm: () => void;
  onDeny: () => void;
}) {
  const isDeferral = suggestion.suggestedMonthLeft != null;
  return (
    <View style={styles.suggestionCard}>
      <Text style={styles.suggestionCardTitle}>{suggestion.projectName}</Text>
      {isDeferral ? (
        <Text style={styles.suggestionCardAmounts}>
          {t('ai.savings_month_left_label')}: {suggestion.suggestedMonthLeft}
        </Text>
      ) : (
        <Text style={styles.suggestionCardAmounts}>
          {formatVND(suggestion.currentMoneySaved)} → {formatVND(suggestion.newMoneySaved ?? suggestion.currentMoneySaved)}
        </Text>
      )}
      <Text style={styles.suggestionCardReason}>{suggestion.reason}</Text>
      <SuggestionActions
        status={suggestion.status}
        errorMsg={suggestion.errorMsg}
        onConfirm={onConfirm}
        onDeny={onDeny}
      />
    </View>
  );
}

function SimulationPanel({ result }: { result: SimulationResult }) {
  return (
    <View style={[styles.suggestionCard, styles.simulationPanel]}>
      <Text style={styles.suggestionCardTitle}>{t('ai.simulation_title')}</Text>
      <Text style={styles.suggestionCardReason}>{result.scenario}</Text>
      <Text style={styles.simulationRow}>
        {t('ai.simulation_new_safe_spending')}: {formatVND(result.newSafeSpending)}
      </Text>
      {!!result.projectImpact && (
        <Text style={styles.simulationRow}>
          {t('ai.simulation_project_impact')}: {result.projectImpact}
        </Text>
      )}
      {result.violates20Rule && (
        <View style={styles.simulationWarning}>
          <Ionicons name="warning" size={14} color="#B45309" />
          <Text style={styles.simulationWarningText}>
            {t('ai.simulation_violation_warning')}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function AIScreen() {
  const flatListRef = useRef<FlatList>(null);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: t('ai.welcome'), // ← dùng dịch
      phase: "done",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    // Cleanup khi unmount: hủy các timer đang chạy nếu còn
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, []);

  const {
    questions,
    loading: suggestionLoading
  } = useAISuggestions();

  const getMarkdownStyles = (isUser: boolean) => {
    const textColor = isUser ? '#FFF' : '#111';
    const linkColor = isUser ? '#B3A0FF' : '#3629B7';
    const codeBg = isUser ? 'rgba(255,255,255,0.2)' : '#f0f0f0';
    const blockquoteColor = isUser ? '#B3A0FF' : '#ccc';

    return {
      ...baseMarkdownStyles,
      body: { ...baseMarkdownStyles.body, color: textColor },
      heading1: { ...baseMarkdownStyles.heading1, color: textColor },
      heading2: { ...baseMarkdownStyles.heading2, color: textColor },
      heading3: { ...baseMarkdownStyles.heading3, color: textColor },
      heading4: { ...baseMarkdownStyles.heading4, color: textColor },
      heading5: { ...baseMarkdownStyles.heading5, color: textColor },
      heading6: { ...baseMarkdownStyles.heading6, color: textColor },
      paragraph: { ...baseMarkdownStyles.paragraph, color: textColor },      // ✅ thêm màu
      listItem: { ...baseMarkdownStyles.listItem, color: textColor },        // ✅ thêm màu
      bullet_list: { ...baseMarkdownStyles.bullet_list },                    // không cần màu, là container
      ordered_list: { ...baseMarkdownStyles.ordered_list },
      code_block: { ...baseMarkdownStyles.code_block, backgroundColor: codeBg, color: textColor },
      code_inline: { ...baseMarkdownStyles.code_inline, backgroundColor: codeBg, color: textColor },
      strong: { ...baseMarkdownStyles.strong, color: textColor },
      em: { ...baseMarkdownStyles.em, color: textColor },
      link: { ...baseMarkdownStyles.link, color: linkColor },
      blockquote: { ...baseMarkdownStyles.blockquote, borderLeftColor: blockquoteColor, color: textColor },
    };
  };

  // Reveals `fullText` progressively on message `id` to simulate real-time
  // generation, since POST /chat returns the full reply in one response.
  const startTypewriter = (id: string, fullText: string, onDone: () => void) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, phase: "streaming" } : m))
    );

    if (!fullText) {
      onDone();
      return;
    }

    let index = 0;
    const step = Math.max(1, Math.ceil(fullText.length / TYPEWRITER_TOTAL_TICKS));

    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    typewriterTimerRef.current = setInterval(() => {
      index += step;
      const shown = fullText.slice(0, index);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: shown } : m))
      );
      scrollToBottom();

      if (index >= fullText.length) {
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        onDone();
      }
    }, TYPEWRITER_TICK_MS);
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;

    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);

    // Thêm tin nhắn của user
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      role: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Placeholder cho assistant: bắt đầu ở pha "đang tải dữ liệu tài chính"
    const assistantId = `${Date.now()}-assistant`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, text: "", role: "assistant", phase: "context" },
    ]);
    setLoading(true);
    scrollToBottom();

    // Sau một khoảng ngắn, chuyển sang pha "đang suy nghĩ" trong lúc chờ API
    phaseTimerRef.current = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.phase === "context"
            ? { ...m, phase: "thinking" }
            : m
        )
      );
    }, CONTEXT_PHASE_MS);

    try {
      const res = await AIAPI.chat(message);

      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }

      if (!res.success || !res.data) {
        const errorText =
          res.errorCode === "RATE_LIMIT"
            ? t('ai.error_rate_limit')
            : t('ai.error_connection');
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, phase: "error", text: errorText } : m
          )
        );
        setLoading(false);
        return;
      }

      const data = res.data;
      startTypewriter(assistantId, data.reply || "", () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  phase: "done",
                  intent: data.intent,
                  budgetSuggestions: (data.budgetSuggestions || []).map((s) => ({
                    ...s,
                    status: "pending" as SuggestionStatus,
                  })),
                  simulationResult: data.simulationResult || undefined,
                  savingsSuggestions: (data.savingsSuggestions || []).map((s) => ({
                    ...s,
                    status: "pending" as SuggestionStatus,
                  })),
                }
              : m
          )
        );
        setLoading(false);
        scrollToBottom();
      });
    } catch (error) {
      console.error("Failed to send chat message:", error);
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, phase: "error", text: t('ai.error_unable') }
            : m
        )
      );
      setLoading(false);
    }
  };

  const updateBudgetSuggestion = (
    messageId: string,
    budgetId: string,
    patch: Partial<BudgetSuggestionItem>
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id !== messageId
          ? m
          : {
              ...m,
              budgetSuggestions: m.budgetSuggestions?.map((s) =>
                s.budgetId === budgetId ? { ...s, ...patch } : s
              ),
            }
      )
    );
  };

  const updateSavingsSuggestion = (
    messageId: string,
    projectId: string,
    patch: Partial<SavingsSuggestionItem>
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id !== messageId
          ? m
          : {
              ...m,
              savingsSuggestions: m.savingsSuggestions?.map((s) =>
                s.projectId === projectId ? { ...s, ...patch } : s
              ),
            }
      )
    );
  };

  const handleConfirmBudget = async (messageId: string, suggestion: BudgetSuggestionItem) => {
    updateBudgetSuggestion(messageId, suggestion.budgetId, { status: "applying" });
    const res = await budgetAPI.updateBudget(suggestion.budgetId, {
      amountLimit: suggestion.suggestedAmount,
    });
    if (res.success) {
      updateBudgetSuggestion(messageId, suggestion.budgetId, { status: "confirmed" });
    } else {
      updateBudgetSuggestion(messageId, suggestion.budgetId, {
        status: "error",
        errorMsg: res.message,
      });
    }
  };

  const handleDenyBudget = (messageId: string, budgetId: string) => {
    updateBudgetSuggestion(messageId, budgetId, { status: "denied" });
  };

  const handleConfirmSavings = async (messageId: string, suggestion: SavingsSuggestionItem) => {
    updateSavingsSuggestion(messageId, suggestion.projectId, { status: "applying" });
    const payload =
      suggestion.suggestedAddAmount != null
        ? { moneySaved: suggestion.newMoneySaved ?? undefined }
        : { monthLeft: suggestion.suggestedMonthLeft ?? undefined };
    const res = await ProjectAPI.updateTracking(suggestion.projectId, payload);
    if (res.success) {
      updateSavingsSuggestion(messageId, suggestion.projectId, { status: "confirmed" });
    } else {
      updateSavingsSuggestion(messageId, suggestion.projectId, {
        status: "error",
        errorMsg: res.message,
      });
    }
  };

  const handleDenySavings = (messageId: string, projectId: string) => {
    updateSavingsSuggestion(messageId, projectId, { status: "denied" });
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const markdownStyles = getMarkdownStyles(isUser);
    const isThinking = !isUser && (item.phase === "context" || item.phase === "thinking");
    const hasBudgetSuggestions = !isUser && item.phase === "done" && (item.budgetSuggestions?.length ?? 0) > 0;
    const hasSavingsSuggestions = !isUser && item.phase === "done" && (item.savingsSuggestions?.length ?? 0) > 0;
    const hasSimulation = !isUser && item.phase === "done" && !!item.simulationResult;

    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.userWrapper : styles.assistantWrapper,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {isThinking ? (
            <ThinkingIndicator
              label={item.phase === "context" ? t('ai.loading_context') : t('ai.thinking')}
            />
          ) : (
            <Markdown style={markdownStyles} mergeStyle={true}>
              {item.text || ""}
            </Markdown>
          )}
        </View>

        {hasSimulation && <SimulationPanel result={item.simulationResult!} />}

        {hasBudgetSuggestions && (
          <View style={styles.suggestionGroup}>
            <Text style={styles.suggestionGroupTitle}>{t('ai.budget_suggestion_title')}</Text>
            {item.budgetSuggestions!.map((s) => (
              <BudgetSuggestionCard
                key={s.budgetId}
                suggestion={s}
                onConfirm={() => handleConfirmBudget(item.id, s)}
                onDeny={() => handleDenyBudget(item.id, s.budgetId)}
              />
            ))}
          </View>
        )}

        {hasSavingsSuggestions && (
          <View style={styles.suggestionGroup}>
            <Text style={styles.suggestionGroupTitle}>{t('ai.savings_suggestion_title')}</Text>
            {item.savingsSuggestions!.map((s) => (
              <SavingsSuggestionCard
                key={s.projectId}
                suggestion={s}
                onConfirm={() => handleConfirmSavings(item.id, s)}
                onDeny={() => handleDenySavings(item.id, s.projectId)}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Nút quay lại */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#222" />
          </TouchableOpacity>

          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={18} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t('ai.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('ai.subtitle')}</Text>
          </View>
        </View>

        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="#222" />
        </TouchableOpacity>
      </View>

      {/* CHAT LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
      />

      <View style={styles.UserContainer}>
        {questions.length > 0 && (
          <View style={styles.suggestionContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={questions}
              keyExtractor={(item, index) => `${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => setInput(item)}
                >
                  <Text style={styles.suggestionText}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* INPUT */}
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('ai.placeholder')}
            multiline
            style={styles.input}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={loading}
            style={styles.sendBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="send" size={22} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const baseMarkdownStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 24,          // ⬆️ tăng lên để thoáng hơn
  },
  heading1: { fontSize: 20, fontWeight: 'bold', marginVertical: 6 },
  heading2: { fontSize: 18, fontWeight: 'bold', marginVertical: 6 },
  heading3: { fontSize: 16, fontWeight: 'bold', marginVertical: 4 },
  heading4: { fontSize: 15, fontWeight: 'bold', marginVertical: 4 },
  heading5: { fontSize: 14, fontWeight: 'bold', marginVertical: 4 },
  heading6: { fontSize: 13, fontWeight: 'bold', marginVertical: 4 },
  paragraph: { marginVertical: 6 },   // ⬆️ thêm khoảng cách giữa các đoạn
  listItem: { marginVertical: 4 },    // ⬆️ cách nhau giữa các item trong list
  bullet_list: { marginVertical: 6 }, // khoảng cách trên dưới của toàn bộ list
  ordered_list: { marginVertical: 6 },
  code_block: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    borderRadius: 2,
    fontFamily: 'monospace',
  },
  strong: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  link: { textDecorationLine: 'underline' },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#ccc',
    paddingLeft: 8,
    marginVertical: 6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8FC",
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    marginRight: 8,
    padding: 4, // để tăng vùng bấm
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#3629B7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  messageWrapper: {
    marginBottom: 12,
  },

  userWrapper: {
    alignItems: "flex-end",
  },

  assistantWrapper: {
    alignItems: "flex-start",
  },
  suggestionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
  },

  suggestionChip: {
    backgroundColor: "#F3F4F8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },

  suggestionText: {
    fontSize: 13,
    color: "#3629B7",
  },

  bubble: {
    maxWidth: "90%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',   // ✅ ngăn nội dung tràn ra ngoài
    flexShrink: 1,        // ✅ co lại vừa đủ

  },

  userBubble: {
    backgroundColor: "#3629B7",
  },

  assistantBubble: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#111",
  },

  inputContainer: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },

  UserContainer: {
    display: "flex",
    padding: 5,
    backgroundColor: "#ffffff53",
    flexDirection: "column"
  },

  sendBtn: {
    alignSelf: "center",
    borderColor: "#fffffff",
    borderWidth: 1,
    paddingHorizontal: 14,
    borderRadius: 5,
    paddingVertical: 7,
    backgroundColor: "#3629B7"
  },

  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "#F3F4F8",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },

  // ── Thinking / loading-context indicator ─────────────────────────────────
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  thinkingLabel: {
    fontSize: 13,
    color: "#777",
    marginRight: 8,
    fontStyle: "italic",
  },
  thinkingDots: {
    flexDirection: "row",
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3629B7",
    marginHorizontal: 2,
  },

  // ── Suggestion cards (budget / savings / simulation) ─────────────────────
  suggestionGroup: {
    maxWidth: "90%",
    marginTop: 8,
  },
  suggestionGroupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
    marginTop: 4,
  },
  suggestionCard: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  suggestionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
  suggestionCardAmounts: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3629B7",
    marginTop: 4,
  },
  suggestionCardReason: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  suggestionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  confirmBtn: {
    backgroundColor: "#3629B7",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginLeft: 8,
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  denyBtn: {
    backgroundColor: "#F3F4F8",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  denyBtnText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  suggestionStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  suggestionStatusText: {
    fontSize: 13,
    color: "#777",
    marginLeft: 6,
  },
  retryBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#3629B7",
  },
  retryBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Simulation panel ──────────────────────────────────────────────────────
  simulationPanel: {
    borderColor: "#D8D4F7",
    backgroundColor: "#FAF9FF",
  },
  simulationRow: {
    fontSize: 13,
    color: "#333",
    marginTop: 4,
  },
  simulationWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
  },
  simulationWarningText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 6,
    flexShrink: 1,
  },
});
