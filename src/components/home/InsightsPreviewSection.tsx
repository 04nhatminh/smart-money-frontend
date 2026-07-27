import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useThemeMode } from "../../theme/ThemeProvider";
import { useInsights } from "../../hooks/useInsights";
import InsightCard from "../insights/InsightCard";

/**
 * Home section teasing the adaptive-engine insights feed: shows the single
 * most relevant insight (server-ordered) with a "See all" link to /insights.
 * Renders nothing while loading or when there is nothing to report.
 */
export default function InsightsPreviewSection() {
  useLanguage(); // re-render on EN/VI switch
  const { theme, mode } = useThemeMode();
  const { insights, loading, error } = useInsights();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;

  const styles = useMemo(() => StyleSheet.create({
    section: {
      marginBottom: 22,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: "700",
      color: accent,
    },
  }), [theme, mode]);

  if (loading || error || insights.length === 0) {
    return null;
  }

  const topInsight = insights[0];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {t("insights.home_section_title")}
        </Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push("/insights" as any)}
        >
          <Text style={styles.seeAllText}>{t("insights.see_all")}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push("/insights" as any)}
      >
        <InsightCard insight={topInsight} compact />
      </TouchableOpacity>
    </View>
  );
}
