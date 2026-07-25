import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { t } from "../../i18n";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useThemeMode } from "../../theme/ThemeProvider";
import { useSuggestions } from "../../hooks/useSuggestions";
import { localizeInsight } from "../../utils/insightFormat";
import {
  SUGGESTION_TYPE_ICONS,
  statusChipStyle,
  suggestionTitle,
} from "../../utils/suggestionFormat";

/**
 * Home section for actionable adaptive-engine suggestions (PENDING only).
 *
 * UX rules baked in (per the FE handoff guide):
 *  - Renders NOTHING when there is nothing to act on — never an empty state.
 *    Suggestions don't always follow an event, so the section just vanishes.
 *  - Never decides inline: the yes/no card is the only decision surface, so a
 *    tap always routes to /suggestions/{id} (one) or the inbox (many). No
 *    Yes/No buttons live here.
 *  - Not gated on interventionLevel: NOTIFY users get no push, but cards may
 *    still exist server-side, so this becomes their entry point. Gate purely on
 *    "are there PENDING items".
 *
 * One suggestion → a preview card (mirrors the inbox row, so no project-name
 * fetch is needed). Two or more → a compact "N waiting" banner to the inbox.
 */
export default function PendingSuggestionsSection() {
  useLanguage(); // re-render on EN/VI switch
  const { theme, mode } = useThemeMode();
  const { suggestions, loading, error } = useSuggestions("PENDING");

  if (loading || error || suggestions.length === 0) {
    return null;
  }

  const chip = statusChipStyle("PENDING", mode === "dark");

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" ? "#FFFFFF" : theme.card;

  const header = (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("suggestion.home_section_title")}</Text>
      {suggestions.length > 1 ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push("/suggestions" as any)}
        >
          <Text style={[styles.seeAllText, { color: accent }]}>{t("suggestion.see_all")}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // Several pending → a count banner routing to the inbox.
  if (suggestions.length > 1) {
    return (
      <View style={styles.section}>
        {header}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.card,
            { backgroundColor: surface, borderColor: theme.border },
          ]}
          onPress={() => router.push("/suggestions" as any)}
        >
          <View style={[styles.iconBox, { backgroundColor: chip.bg }]}>
            <Ionicons name="bulb-outline" size={22} color={chip.color} />
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.text }]}>
              {t("suggestion.pending_count", { count: suggestions.length })}
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              {t("suggestion.review_prompt")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
        </TouchableOpacity>
      </View>
    );
  }

  // Exactly one → a preview of that suggestion, routing to its card.
  const only = suggestions[0];

  return (
    <View style={styles.section}>
      {header}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.card,
          { backgroundColor: surface, borderColor: theme.border },
        ]}
        onPress={() => router.push(`/suggestions/${only.id}` as any)}
      >
        <View style={[styles.iconBox, { backgroundColor: chip.bg }]}>
          <Ionicons
            name={SUGGESTION_TYPE_ICONS[only.type] as any}
            size={22}
            color={chip.color}
          />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.text }]}>
            {suggestionTitle(only.type)}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.subtext }]}
            numberOfLines={2}
          >
            {localizeInsight(only.payload.insightSnapshot)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
});
