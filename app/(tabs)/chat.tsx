import React, { useRef, useState, useEffect } from "react";
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AIAPI from "../../src/api/ai.api"

type Message = {
  id: string;
  text: string;
  role: "user" | "assistant";
};

export default function AIScreen() {
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        "Xin chào 👋 Tôi là SmartMoney AI. Tôi có thể phân tích chi tiêu, tiết kiệm và tư vấn tài chính cá nhân cho bạn.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

    useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({
        animated: true,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      role: "user",
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    const loadingId = `${Date.now()}-loading`;

    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        text: "Đang phân tích tài chính...",
        role: "assistant",
      },
    ]);

    setLoading(true);

    try {
      const res = await AIAPI.promptAI(message);

      const aiReply =
        res?.data?.reply ||
        "Xin lỗi, tôi chưa thể đưa ra câu trả lời lúc này.";

      setMessages(prev =>
        prev.map(item =>
          item.id === loadingId
            ? {
              ...item,
              text: aiReply,
            }
            : item
        )
      );

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error(error);

      setMessages(prev =>
        prev.map(item =>
          item.id === loadingId
            ? {
              ...item,
              text: "Đã xảy ra lỗi khi kết nối AI.",
            }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageWrapper,
          isUser
            ? styles.userWrapper
            : styles.assistantWrapper,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser
              ? styles.userBubble
              : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser && { color: "#FFF" },
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Ionicons
              name="sparkles"
              size={18}
              color="#FFF"
            />
          </View>

          <View>
            <Text style={styles.headerTitle}>
              SmartMoney AI
            </Text>

            <Text style={styles.headerSubtitle}>
              Financial Assistant
            </Text>
          </View>
        </View>

        <TouchableOpacity>
          <Ionicons
            name="menu"
            size={24}
            color="#222"
          />
        </TouchableOpacity>
      </View>

      {/* CHAT */}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 160,
        }}
      />

      {/* INPUT */}

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Hỏi về tài chính cá nhân..."
          multiline
          style={styles.input}
        />

        <TouchableOpacity
          onPress={sendMessage}
          disabled={loading}
          style={styles.sendBtn}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Ionicons
              name="send"
              size={22}
              color="#ffffff"
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8FC",
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 27,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
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