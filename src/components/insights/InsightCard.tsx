import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t } from "../../i18n";
import { useThemeMode } from "../../theme/ThemeProvider";
import { Insight } from "../../types/insight.types";
import {
  formatPeriod,
  localizeInsight,
  severityStyle,
} from "../../utils/insightFormat";

const categoryIcons: Record<string, any> = {
  FOOD: require("../../../assets/categories/food.png"),
  TRANSPORTATION: require("../../../assets/categories/transport.png"),
  CLOTHING: require("../../../assets/categories/clothing.png"),
  UTILITIES: require("../../../assets/categories/utilities.png"),
  ENTERTAINMENT: require("../../../assets/categories/entertainment.png"),
  HEALTH: require("../../../assets/categories/health.png"),
  EDUCATION: require("../../../assets/categories/education.png"),
  SHOPPING: require("../../../assets/categories/other.png"),
  OTHER: require("../../../assets/categories/other.png"),
};

type InsightCardProps = {
  insight: Insight;
  compact?: boolean;
};

export default function InsightCard({ insight, compact }: InsightCardProps) {
  const { theme, mode } = useThemeMode();
  const sev = severityStyle(insight.severity, mode === "dark");
  const icon = insight.category ? categoryIcons[insight.category] : null;

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: sev.color }]} />

      <View style={[styles.iconBox, { backgroundColor: sev.bg }]}>
        {icon ? (
          <Image source={icon} style={styles.iconImage} resizeMode="contain" />
        ) : (
          <Ionicons name="wallet-outline" size={22} color={sev.color} />
        )}
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.sentence, { color: theme.text }]}
          numberOfLines={compact ? 2 : undefined}
        >
          {localizeInsight(insight)}
        </Text>

        <View style={styles.bottomRow}>
          <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
            <Text style={[styles.severityText, { color: sev.color }]}>
              {t(`severity.${insight.severity}`)}
            </Text>
          </View>
          <Text style={[styles.period, { color: theme.subtext }]}>
            {formatPeriod(insight.period)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    overflow: "hidden",
  },
  cardCompact: {
    padding: 12,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  body: {
    flex: 1,
  },
  sentence: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  severityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "700",
  },
  period: {
    fontSize: 11,
    fontWeight: "500",
  },
});
