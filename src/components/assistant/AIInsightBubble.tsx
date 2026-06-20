import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InsightItem } from "../../storage/aiInsightStorage";

interface Props {
  insight: InsightItem | null;
  loading: boolean;
  state?: "Positive" | "Negative"; // 👈 thêm
  onPress?: () => void;
  onClose?: () => void;
}

export default function AIInsightBubble({
  insight,
  loading,
  onPress,
  onClose
}: Props) {

  if (!loading && !insight) {
    return null;
  }

  console.log("Render AIInsightBubble:", { insight, loading });
  
  const happyImg = require("../../../assets/happy_money.png");
  const sadImg = require("../../../assets/sad_money.png");

  return (
  <TouchableOpacity
    activeOpacity={0.9}
    style={styles.container}
    onPress={onPress}
  >
    <View style={styles.wrapper}>
      {/* ❌ CLOSE BUTTON */}
      <TouchableOpacity
        onPress={onClose}
        style={styles.closeBtn}
      >
        <Text style={{ color: "#fff", fontSize: 12 }}>✕</Text>
      </TouchableOpacity>
      
      {/* 🔺 Tail */}
      <View style={styles.tail} />

      <View style={styles.bubble}>
        <View style={styles.information}>
          <Text style={styles.title}>SmartMoney AI</Text>

          <Text style={styles.message}>
            {loading
              ? "Analyzing your finances..."
              : insight?.text}
          </Text>
        </View>

        {/* 👇 IMAGE */}
        {!loading && insight?.state && (
          <Image
            source={insight?.state === "Positive" ? happyImg : sadImg}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

    </View>
  </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 36,
    alignItems: "center",
    display: "flex",
    width: "100%",
  },

  wrapper: {
    position: "relative",
    maxWidth: "90%",
    width: "100%",
    overflow: "visible", // 👈 QUAN TRỌNG NHẤT
  },

  image: {
    width: 80,
    height: 80,
    alignSelf: "center"
  },

  closeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 999,

    backgroundColor: "#3629B7",
    borderRadius: 12,
    width: 24,
    height: 24,

    alignItems: "center",
    justifyContent: "center",

    elevation: 4, // android
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  information: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },

  bubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignContent: "center",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 160,
    borderWidth: 4,
    width: "100%",
    borderColor: "#3629B7",

    // 👇 nhích lên chút
    marginTop: 6,
  },

  // 🔥 Tail tam giác
  tail: {
    position: "absolute",
    right: 30,

    // 🔥 kéo lên trên bubble
    top: 165,

    width: 0,
    zIndex: 100,
    height: 0,

    borderLeftWidth: 15,
    borderRightWidth: 10,
    borderTopWidth: 45,

    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#3629B7",
  },

  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3629B7",
    marginBottom: 4,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
});