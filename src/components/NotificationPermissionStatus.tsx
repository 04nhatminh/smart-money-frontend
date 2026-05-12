import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNotificationListenerPermission } from "../hooks/useNotificationListenerPermission";

/**
 * Component để check và request NotificationListener permission
 * Hiển thị status + button để enable
 */
export const NotificationPermissionStatus = () => {
  const { isGranted, isLoading, request, openGuide } =
    useNotificationListenerPermission();

  const handleEnable = async () => {
    const success = await request();
    if (!success) {
      Alert.alert(
        "Still Disabled?",
        "The permission might not have been enabled. You can:\n\n1. Tap 'Show Guide' to see step-by-step instructions\n2. Or manually go to Settings > Apps > Smart Money > Notifications > Notification Access",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Show Guide",
            onPress: openGuide,
          },
        ]
      );
    } else {
      Alert.alert("Success!", "✅ Notification access is now enabled");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBox, isGranted ? styles.enabled : styles.disabled]}>
        <Text style={styles.icon}>
          {isLoading ? "⏳" : isGranted ? "✅" : "❌"}
        </Text>
        <View style={styles.content}>
          <Text style={styles.title}>
            {isLoading
              ? "Checking..."
              : isGranted
                ? "Notification Access Enabled"
                : "Notification Access Disabled"}
          </Text>
          <Text style={styles.description}>
            {isLoading
              ? "Verifying notification permission..."
              : isGranted
                ? "Auto-capture bank notifications is active"
                : "Enable to automatically capture bank notifications"}
          </Text>
        </View>
      </View>

      {!isGranted && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleEnable}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.enableButtonText}>📱 Enable Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guideButton}
            onPress={openGuide}
            disabled={isLoading}
          >
            <Text style={styles.guideButtonText}>📖 Show Guide</Text>
          </TouchableOpacity>
        </View>
      )}

      {isGranted && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🎉 Ready to capture bank notifications! You'll see transactions
            appear automatically when you receive bank notifications.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  enabled: {
    backgroundColor: "#ECFDF5",
    borderLeftColor: "#10B981",
  },
  disabled: {
    backgroundColor: "#FEF2F2",
    borderLeftColor: "#EF4444",
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 19,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 10,
  },
  enableButton: {
    flex: 1,
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  enableButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  guideButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  guideButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  infoText: {
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 20,
  },
});
