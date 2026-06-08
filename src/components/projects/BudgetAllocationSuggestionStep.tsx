import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ButtonSave } from "../ButtonSave";

type Props = {
  loading: boolean;
  onSkip: () => void;
  onCreate: () => void;
};

export default function BudgetAllocationSuggestionStep({
  loading,
  onSkip,
  onCreate,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="pie-chart" size={56} color="#4B3FD6" />
      </View>

      <Text style={styles.title}>Budget Allocation</Text>

      <Text style={styles.description}>
        Your project is ready! Set up an AI-powered budget allocation based on
        your financial profile to stay on track.
      </Text>

      <View style={styles.featureCard}>
        <View style={styles.featureRow}>
          <View style={styles.featureIconBox}>
            <Ionicons name="sparkles" size={16} color="#4B3FD6" />
          </View>
          <Text style={styles.featureText}>AI-powered category suggestions</Text>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIconBox}>
            <Ionicons name="person-circle-outline" size={16} color="#4B3FD6" />
          </View>
          <Text style={styles.featureText}>
            Tailored to your financial profile
          </Text>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featureIconBox}>
            <Ionicons name="checkmark-circle" size={16} color="#4B3FD6" />
          </View>
          <Text style={styles.featureText}>
            Organized automatically by category
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <ButtonSave
          label="Skip"
          variant="secondary"
          onPress={onSkip}
          disabled={loading}
        />
        <ButtonSave
          label="Create"
          onPress={onCreate}
          loading={loading}
          loadingText="Checking..."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingBottom: 12,
    alignItems: "center",
  },

  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFEAF8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
    textAlign: "center",
  },

  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  featureCard: {
    width: "100%",
    backgroundColor: "#F5F3FF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 36,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0D9FA",
    alignItems: "center",
    justifyContent: "center",
  },

  featureText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
});
