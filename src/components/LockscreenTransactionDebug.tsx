import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSyncLockscreenTransactions } from "../hooks/useSyncLockscreenTransactions";

/**
 * Component để view/debug lockscreen transactions
 * Dùng cho development/testing
 */
export const LockscreenTransactionDebug = () => {
  const { isLoading, error, stats, syncNow, clearAll } =
    useSyncLockscreenTransactions();
  const [expanded, setExpanded] = useState(false);

  const handleSync = async () => {
    Alert.alert(
      "Sync Transactions",
      "Do you want to sync unsynced transactions now?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Sync",
          onPress: async () => {
            await syncNow();
            Alert.alert("Success", "Transactions synced!");
          },
        },
      ]
    );
  };

  const handleClear = async () => {
    Alert.alert(
      "Clear All",
      "This will delete all cached lockscreen transactions. Continue?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            await clearAll();
            Alert.alert("Success", "All transactions cleared!");
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>📱 Lockscreen Transactions</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statBadge}>
              {stats.total} {stats.total === 1 ? "item" : "items"}
            </Text>
            {stats.unsynced > 0 && (
              <Text style={[styles.statBadge, styles.unsynced]}>
                ⚠️ {stats.unsynced} unsynced
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.arrow}>{expanded ? "▼" : "▶"}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Error message */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsBox}>
            <Text style={styles.statLabel}>Total Transactions:</Text>
            <Text style={styles.statValue}>{stats.total}</Text>

            <Text style={styles.statLabel}>Synced:</Text>
            <Text style={styles.statValue}>{stats.synced}</Text>

            <Text style={styles.statLabel}>Unsynced:</Text>
            <Text style={[styles.statValue, { color: "#FF6B6B" }]}>
              {stats.unsynced}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.syncButton]}
              onPress={handleSync}
              disabled={isLoading || stats.unsynced === 0}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>🔄 Sync Now</Text>
                  {stats.unsynced > 0 && (
                    <Text style={styles.buttonSubText}>
                      ({stats.unsynced} pending)
                    </Text>
                  )}
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
              disabled={isLoading || stats.total === 0}
            >
              <Text style={styles.buttonText}>🗑️ Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
            <Text style={styles.infoText}>
              • Notifications received on lockscreen are captured automatically
            </Text>
            <Text style={styles.infoText}>
              • Transaction data is extracted and stored locally
            </Text>
            <Text style={styles.infoText}>
              • When app opens, unsynced transactions are auto-synced to server
            </Text>
            <Text style={styles.infoText}>
              • You can manually trigger sync using "Sync Now" button
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E8EAED",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EAED",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBadge: {
    backgroundColor: "#E5E7EB",
    color: "#374151",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  unsynced: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  arrow: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  content: {
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "500",
  },
  statsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 4,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  syncButton: {
    backgroundColor: "#3B82F6",
  },
  clearButton: {
    backgroundColor: "#EF4444",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  buttonSubText: {
    color: "#E0E7FF",
    fontSize: 11,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: "#DBEAFE",
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#1E40AF",
    marginBottom: 4,
    lineHeight: 18,
  },
});
