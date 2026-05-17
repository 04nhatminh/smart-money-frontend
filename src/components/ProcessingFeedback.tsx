import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNotificationUI } from "../context/NotificationUIContext";

/**
 * Standalone component để hiển thị processing feedback/toast
 */
export const ProcessingFeedback: React.FC = () => {
  const { state } = useNotificationUI();

  // Only show if there's a message and status is not idle
  if (state.status === "idle" || !state.message) {
    return null;
  }

  let backgroundColor = "#333";
  if (state.status === "processing") backgroundColor = "#ffa500";
  else if (state.status === "success") backgroundColor = "#4caf50";
  else if (state.status === "error") backgroundColor = "#f44336";

  return (
    <View style={[styles.toast, { backgroundColor }]}>
      <Text style={styles.toastText}>
        {String(state.message || "")}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 9999,
  },
  toastText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },
});
