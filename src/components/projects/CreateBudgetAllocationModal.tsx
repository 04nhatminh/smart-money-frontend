import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BudgetAllocationApi } from "../../api/budgetAllocation.api";
import { GenerateBudgetAllocationPayload } from "../../types/budget_allocation.types";

type GenerationStatus = "loading" | "success" | "error";

type Props = {
  visible: boolean;
  payload: GenerateBudgetAllocationPayload | null;
  onClose: () => void;
};

export default function CreateBudgetAllocationModal({
  visible,
  payload,
  onClose,
}: Props) {
  const [status, setStatus] = useState<GenerationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const generate = (p: GenerateBudgetAllocationPayload) => {
    setStatus("loading");
    setErrorMessage("");
    BudgetAllocationApi.generateBudget(p).then((res) => {
      if (res.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(
          res.message ?? "Error while saving financial profile"
        );
      }
    });
  };

  useEffect(() => {
    if (visible && payload) {
      generate(payload);
    }
  }, [visible]);

  const handleRetry = () => {
    if (payload) generate(payload);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {status === "loading" && (
            <>
              <View style={styles.loadingIconBox}>
                <ActivityIndicator size="large" color="#4B3FD6" />
              </View>
              <Text style={styles.title}>Generating Budget…</Text>
              <Text style={styles.body}>
                AI is creating your personalized budget allocation. This may
                take a moment.
              </Text>
            </>
          )}

          {status === "success" && (
            <>
              <LinearGradient
                colors={["#4B3FD6", "#7C6FF7"]}
                style={styles.successIconBox}
              >
                <Ionicons name="checkmark" size={30} color="#FFFFFF" />
              </LinearGradient>

              <Text style={styles.title}>Budget Created!</Text>

              <View style={styles.successBanner}>
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color="#059669"
                />
                <Text style={styles.successBannerText}>
                  Created financial profile successfully
                </Text>
              </View>

              <Text style={styles.body}>
                Your budget allocation has been set up based on your financial
                profile.
              </Text>

              <Pressable style={styles.fullBtn} onPress={onClose}>
                <LinearGradient
                  colors={["#3629B7", "#5655B9"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientInner}
                >
                  <Text style={styles.primaryBtnText}>Done</Text>
                </LinearGradient>
              </Pressable>
            </>
          )}

          {status === "error" && (
            <>
              <View style={styles.errorIconBox}>
                <Ionicons name="alert-circle" size={30} color="#EF4444" />
              </View>

              <Text style={styles.title}>Generation Failed</Text>

              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={15} color="#B91C1C" />
                <Text style={styles.errorBannerText}>
                  Error while saving financial profile
                </Text>
              </View>

              {!!errorMessage && (
                <Text style={styles.errorDetail}>{errorMessage}</Text>
              )}

              <View style={styles.actionRow}>
                <Pressable style={styles.secondaryBtn} onPress={onClose}>
                  <Text style={styles.secondaryBtnText}>Skip</Text>
                </Pressable>

                <Pressable style={styles.fullBtn} onPress={handleRetry}>
                  <LinearGradient
                    colors={["#3629B7", "#5655B9"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientInner}
                  >
                    <Text style={styles.primaryBtnText}>Try Again</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  loadingIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  errorIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },

  body: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    width: "100%",
  },

  successBannerText: {
    fontSize: 13,
    color: "#065F46",
    fontWeight: "600",
    flex: 1,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    width: "100%",
  },

  errorBannerText: {
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "600",
    flex: 1,
  },

  errorDetail: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },

  fullBtn: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
  },

  gradientInner: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 25,
    backgroundColor: "#E9E9EF",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryBtnText: {
    color: "#1F2937",
    fontWeight: "600",
    fontSize: 15,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
});
