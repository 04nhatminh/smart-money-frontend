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
import * as Clipboard from "expo-clipboard";
import AIAPI from "../../src/api/ai.api";
import { useAISuggestions } from "../../src/context/AISuggestionContext";
import { t, tLang } from "../../src/i18n";          // ← thêm import
import { useLanguage } from "../../src/i18n/LanguageProvider"; // (tuỳ chọn)
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../src/utils/dataRefreshEmitter";
import {
  ChatIntent,
  BudgetUpdateSuggestion,
  SavingsPlanSuggestion,
  SimulationResult,
  ProjectChangeSuggestion,
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
  projectChangeSuggestions?: ProjectChangeSuggestion[];
  actionRequired?: boolean;
  relatedQuestions?: string[];
  // Detected language of this turn's reply — undefined for the local "welcome" message and
  // error placeholders that never hit the API. Drives the Yes/No decision-chip wording so it
  // matches the actual conversation language, not just the app's fixed UI locale.
  english?: boolean;
  // For assistant messages: the user request that produced this reply, so it can be resent on retry.
  sourceText?: string;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCopyId, setActiveCopyId] = useState<string | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const handleCopy = async (id: string, text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    setCopiedId(id);
    copyResetTimerRef.current = setTimeout(() => {
      setCopiedId(null);
      setActiveCopyId(null);
    }, 1200);
  };

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

  // Runs (or re-runs) the API call + typewriter reveal for a given assistant
  // placeholder message. Shared by both the initial send and retry-on-error.
  // `resolvesDecision` is true when this message is the user's yes/no answer to the previous
  // turn's pending suggestion — on success it tells the rest of the app (budgets/project screens,
  // which keep their own local copies of this data) to re-fetch, since a real mutation may just
  // have happened.
  const runAssistantRequest = async (userText: string, assistantId: string, resolvesDecision = false) => {
    setLoading(true);

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
      const res = await AIAPI.chat(userText);

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
                  projectChangeSuggestions: data.projectChangeSuggestions || [],
                  actionRequired: data.actionRequired,
                  relatedQuestions: data.relatedQuestions || [],
                  english: data.english,
                }
              : m
          )
        );
        setLoading(false);
        scrollToBottom();
        if (resolvesDecision) {
          // Best-effort: fires even on a denied/expired action — refetching unchanged data is
          // harmless, and we don't parse `data.reply` to guess success/failure.
          dataRefreshEmitter.emit(FINANCIAL_DATA_UPDATED);
        }
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

  // True when the last message is a "done" assistant reply carrying an unresolved suggestion
  // (actionRequired) — the chat is locked to a yes/no answer until this resolves. Never true for
  // the out-of-scope warning, which isn't a suggestion to decide on.
  const lastMessage = messages[messages.length - 1];
  const awaitingDecision =
    !!lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.phase === "done" &&
    !!lastMessage.actionRequired &&
    lastMessage.intent !== "OUT_OF_SCOPE";

  const sendMessage = async (overrideText?: string) => {
    const message = (overrideText ?? input).trim();
    if (!message || loading) return;

    const resolvesDecision = awaitingDecision;

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
      { id: assistantId, text: "", role: "assistant", phase: "context", sourceText: message },
    ]);
    scrollToBottom();

    await runAssistantRequest(message, assistantId, resolvesDecision);
  };

  // Re-sends the original user request for an assistant message that errored out,
  // reusing the same message slot instead of appending a new one.
  const retryMessage = async (assistantId: string) => {
    if (loading) return;
    const target = messages.find((m) => m.id === assistantId);
    if (!target || !target.sourceText) return;

    if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, phase: "context", text: "" } : m
      )
    );
    scrollToBottom();

    await runAssistantRequest(target.sourceText, assistantId);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    const markdownStyles = getMarkdownStyles(isUser);
    const isThinking = !isUser && (item.phase === "context" || item.phase === "thinking");
    const isOutOfScope = !isUser && item.phase === "done" && item.intent === "OUT_OF_SCOPE";
    const isLastMessage = messages.length > 0 && messages[messages.length - 1].id === item.id;
    // Yes/No decision chips: only on the LAST message, only when it's an actual suggestion
    // (actionRequired), never for the out-of-scope warning.
    const showDecisionChips = !isUser && isLastMessage && item.phase === "done" && !!item.actionRequired && !isOutOfScope;
    // Hidden on EVERY message (not just this one) while a decision is pending elsewhere —
    // otherwise an older message's related-question chip would let the user bypass the
    // "chat locked until you answer yes/no" gate below.
    const hasRelatedQuestions =
      !isUser && item.phase === "done" && (item.relatedQuestions?.length ?? 0) > 0 &&
      !showDecisionChips && !awaitingDecision;
    const canCopy = !!item.text && (isUser || item.phase === "done" || item.phase === "error");
    const canRetry = !isUser && item.phase === "error";
    const isCopied = copiedId === item.id;
    const isMenuOpen = activeCopyId === item.id;

    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.userWrapper : styles.assistantWrapper,
        ]}
      >
        {isMenuOpen && canCopy && (
          <TouchableOpacity
            onPress={() => handleCopy(item.id, item.text)}
            style={styles.copyPopup}
            activeOpacity={0.8}
          >
            <Ionicons name={isCopied ? "checkmark" : "copy-outline"} size={14} color="#FFF" />
            <Text style={styles.copyPopupText}>
              {isCopied ? t('ai.copied') : t('ai.copy')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canCopy}
          delayLongPress={350}
          onLongPress={() => setActiveCopyId(item.id)}
          onPress={() => isMenuOpen && setActiveCopyId(null)}
          style={[
            styles.bubble,
            isUser ? styles.userBubble : (isOutOfScope ? styles.outOfScopeBubble : styles.assistantBubble),
          ]}
        >
          {isThinking ? (
            <ThinkingIndicator
              label={item.phase === "context" ? t('ai.loading_context') : t('ai.thinking')}
            />
          ) : (
            <>
              {isOutOfScope && (
                <View style={styles.outOfScopeLabelRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#B45309" />
                  <Text style={styles.outOfScopeLabelText}>{t('ai.out_of_scope_label')}</Text>
                </View>
              )}
              <Markdown style={markdownStyles} mergeStyle={true}>
                {item.text || ""}
              </Markdown>
            </>
          )}
        </TouchableOpacity>

        {canRetry && (
          <View
            style={[
              styles.messageActions,
              isUser ? styles.messageActionsUser : styles.messageActionsAssistant,
            ]}
          >
            <TouchableOpacity
              onPress={() => retryMessage(item.id)}
              disabled={loading}
              style={styles.actionBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="refresh" size={14} color="#3629B7" />
              <Text style={[styles.actionBtnText, { color: "#3629B7" }]}>
                {t('ai.retry')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showDecisionChips && (() => {
          // Match the actual conversation language (from the backend's detection), not just the
          // app's fixed UI locale — falls back to the app locale when undefined (e.g. an older
          // cached response).
          const lang = item.english === undefined ? undefined : (item.english ? "en" : "vi");
          const noLabel = lang ? tLang('ai.quick_reply_no', lang) : t('ai.quick_reply_no');
          const yesLabel = lang ? tLang('ai.quick_reply_yes', lang) : t('ai.quick_reply_yes');
          return (
            <View style={styles.decisionRow}>
              <TouchableOpacity
                style={styles.decisionChipNo}
                onPress={() => sendMessage(noLabel)}
                disabled={loading}
              >
                <Text style={styles.decisionChipNoText}>{noLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.decisionChipYes}
                onPress={() => sendMessage(yesLabel)}
                disabled={loading}
              >
                <Text style={styles.decisionChipYesText}>{yesLabel}</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {hasRelatedQuestions && (
          <View style={styles.relatedQuestionsGroup}>
            {item.relatedQuestions!.map((question, index) => (
              <TouchableOpacity
                key={`${item.id}-related-${index}`}
                style={[styles.relatedQuestionChip, loading && styles.suggestionChipDisabled]}
                onPress={() => sendMessage(question)}
                disabled={loading}
              >
                <Text style={styles.relatedQuestionText}>{question}</Text>
              </TouchableOpacity>
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
                  style={[styles.suggestionChip, (loading || awaitingDecision) && styles.suggestionChipDisabled]}
                  onPress={() => setInput(item)}
                  disabled={loading || awaitingDecision}
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
            placeholder={
              awaitingDecision
                ? t('ai.awaiting_decision_placeholder')
                : loading
                ? t('ai.waiting_for_reply')
                : t('ai.placeholder')
            }
            multiline
            editable={!loading && !awaitingDecision}
            placeholderTextColor="#9CA3AF"
            style={[styles.input, (loading || awaitingDecision) && styles.inputDisabled]}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={loading || awaitingDecision}
            style={[styles.sendBtn, (loading || awaitingDecision) && styles.sendBtnDisabled]}
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

  messageActions: {
    flexDirection: "row",
    marginTop: 4,
  },

  messageActionsUser: {
    justifyContent: "flex-end",
  },

  messageActionsAssistant: {
    justifyContent: "flex-start",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },

  actionBtnText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },

  // ── Hold-to-copy popup (shown on long-press of a bubble) ─────────────────
  copyPopup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  copyPopupText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
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

  suggestionChipDisabled: {
    opacity: 0.5,
  },

  relatedQuestionsGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    maxWidth: "90%",
    marginTop: 8,
  },

  relatedQuestionChip: {
    backgroundColor: "#F3F4F8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },

  relatedQuestionText: {
    fontSize: 13,
    color: "#3629B7",
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

  outOfScopeBubble: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  outOfScopeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  outOfScopeLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
    marginLeft: 4,
    textTransform: "uppercase",
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
    backgroundColor: "#FFFFFF",
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

  sendBtnDisabled: {
    backgroundColor: "#A79EDB",
  },

  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "#F3F4F8",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    color: "#111827",
  },

  inputDisabled: {
    opacity: 0.6,
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

  // ── Yes/No decision chips (replaces the old confirm/dismiss card+buttons) ────
  decisionRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  decisionChipNo: {
    backgroundColor: "#F3F4F8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  decisionChipNoText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "600",
  },
  decisionChipYes: {
    backgroundColor: "#3629B7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  decisionChipYesText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
