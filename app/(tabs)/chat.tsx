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
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Ionicons } from "@expo/vector-icons";
import AIAPI from "../../src/api/ai.api";
import { useAISuggestions } from "../../src/context/AISuggestionContext";
import { t } from "../../src/i18n";          // ← thêm import
import { useLanguage } from "../../src/i18n/LanguageProvider"; // (tuỳ chọn)

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
};

export default function AIScreen() {
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: t('ai.welcome'), // ← dùng dịch
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
    // Cleanup khi unmount: hủy stream nếu còn
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
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

  const appendChunk = (current: string, chunk: string): string => {
    if (!current) return chunk;
    const lastChar = current[current.length - 1];
    const firstChar = chunk[0];
    // Nếu đã có khoảng trắng ở biên thì không thêm
    if (lastChar === ' ' || firstChar === ' ') return current + chunk;
    // Nếu kết thúc hoặc bắt đầu bằng dấu câu thì không thêm
    const punct = /[.,!?;:)]/;
    if (punct.test(lastChar) || punct.test(firstChar)) return current + chunk;
    // Nếu cả hai đều là ký tự chữ/số, thêm khoảng trắng
    if (/\w/.test(lastChar) && /\w/.test(firstChar)) {
      return current + ' ' + chunk;
    }
    return current + chunk;
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) return;

    // Hủy stream cũ nếu có
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Thêm tin nhắn của user
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      role: "user",
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Tạo placeholder cho assistant (đang loading)
    const loadingId = `${Date.now()}-loading`;
    setMessages((prev) => [
      ...prev,
      { id: loadingId, text: "", role: "assistant" },
    ]);
    setLoading(true);

    let fullReply = "";
    let pendingBuffer = "";
    let flushTimer: ReturnType<typeof setTimeout>;
    try {
      const unsubscribe = await AIAPI.streamChat(
        message,
        // onChunk
        (chunk) => {
          fullReply = chunk;   // ← gán trực tiếp

          setMessages(prev =>
            prev.map(item =>
              item.id === loadingId
                ? { ...item, text: fullReply }
                : item
            )
          );
          scrollToBottom();
        },
        // onError
        (error) => {
          console.error("Stream error:", error);
          setMessages((prev) =>
            prev.map((item) =>
              item.id === loadingId
                ? { ...item, text: t('ai.error_connection') } // ← dịch
                : item
            )
          );
          setLoading(false);
        },
        // onComplete
        () => {
          setLoading(false);
          scrollToBottom();
        }
      );

      // Lưu hàm hủy để dọn dẹp sau
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Failed to start stream:", error);
      setMessages((prev) =>
        prev.map((item) =>
          item.id === loadingId
            ? { ...item, text: t('ai.error_unable') } // ← dịch
            : item
        )
      );
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    let fullReply = "";
    let pendingBuffer = "";
    const markdownStyles = getMarkdownStyles(isUser);
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
          <Markdown style={markdownStyles} mergeStyle={true}>
            {item.text || (loading && item.id.endsWith('-loading') ? '...' : '')}
          </Markdown>
        </View>
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
});