import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSuggestions } from "../../src/hooks/useSuggestions";
import { t } from "../../src/i18n";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import {
  SUGGESTION_STATUSES,
  Suggestion,
  SuggestionStatus,
} from "../../src/types/suggestion.types";
import { localizeInsight } from "../../src/utils/insightFormat";
import {
  SUGGESTION_TYPE_ICONS,
  statusChipStyle,
  suggestionTitle,
} from "../../src/utils/suggestionFormat";

/**
 * Suggestions inbox. The daily roll-up notification deep-links here
 * (app://suggestions), so the list may contain PENDING cards the user was
 * never individually pinged about — expected behaviour, not a bug.
 */
export default function SuggestionsInboxScreen() {
  const { theme, mode } = useThemeMode();
  useLanguage(); // re-render on EN/VI switch

  const [activeStatus, setActiveStatus] = useState<SuggestionStatus>("PENDING");
  const { suggestions, loading, error, reload } = useSuggestions(activeStatus);

  const renderItem = ({ item }: { item: Suggestion }) => {
    const chip = statusChipStyle(item.status, mode === "dark");

    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        activeOpacity={0.75}
        onPress={() => router.push(`/suggestions/${item.id}` as any)}
      >
        <View style={[styles.rowIconBox, { backgroundColor: chip.bg }]}>
          <Ionicons
            name={SUGGESTION_TYPE_ICONS[item.type] as any}
            size={22}
            color={chip.color}
          />
        </View>

        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>
            {suggestionTitle(item.type)}
          </Text>
          <Text
            style={[styles.rowSubtitle, { color: theme.subtext }]}
            numberOfLines={2}
          >
            {localizeInsight(item.payload.insightSnapshot)}
          </Text>

          <View style={styles.rowBottom}>
            <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
              <Text style={[styles.statusChipText, { color: chip.color }]}>
                {t(`suggestion.status.${item.status}`)}
              </Text>
            </View>
            <Text style={[styles.rowDate, { color: theme.subtext }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/(tabs)")
          }
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>
          {t("suggestion.inbox_title")}
        </Text>

        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabBar}>
        {SUGGESTION_STATUSES.map((status) => {
          const active = status === activeStatus;
          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? theme.primary : theme.inputBg,
                },
              ]}
              onPress={() => setActiveStatus(status)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? "#FFFFFF" : theme.subtext },
                ]}
              >
                {t(`suggestion.tab.${status}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={64} color={theme.subtext} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={reload}
          >
            <Text style={styles.retryText}>{t("suggestion.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.centerBox}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={64}
                  color={theme.subtext}
                />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {activeStatus === "PENDING"
                    ? t("suggestion.empty_pending")
                    : t("suggestion.empty_decided")}
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 32,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tab: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  rowIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  rowDate: {
    fontSize: 11,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
