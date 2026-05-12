import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useNotificationUI } from "../../context/NotificationUIContext";

export default function NotificationToast() {
  const { state } = useNotificationUI();

  if (state.status === "idle") return null;

  const gifs: any = {
    processing: require("../../../assets/gifs/processing.gif"),
    success: require("../../../assets/gifs/success.gif"),
    error: require("../../../assets/gifs/error.gif"),
  };

  const getBorderColor = () => {
    switch (state.status) {
      case "processing":
        return "#A8A3D7";
      case "success":
        return "#3629B7";
      case "error":
        return "#FF6B6B"; // cho dễ phân biệt lỗi
      default:
        return "#3629B7";
    }
  };

  return (
    <View style={[styles.container, { borderColor: getBorderColor() }]}>
      <Image source={gifs[state.status]} style={styles.gif} />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {state.status === "processing"
            ? "Processing..."
            : state.status === "success"
            ? "Success"
            : "Error"}
        </Text>

        <Text style={styles.text}>{state.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",

    // border highlight
    borderWidth: 1.5,

    // shadow đẹp (iOS + Android)
    shadowColor: "#3629B7",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  gif: {
    width: 42,
    height: 42,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3629B7",
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    color: "#555",
  },
});