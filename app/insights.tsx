import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import InsightCard from "../src/components/insights/InsightCard";
import { useInsights } from "../src/hooks/useInsights";
import { t } from "../src/i18n";
import { useLanguage } from "../src/i18n/LanguageProvider";
import { useThemeMode } from "../src/theme/ThemeProvider";
import { formatPeriod } from "../src/utils/insightFormat";

/**
 * Adaptive-engine insights feed. Read-only "what's happening this month";
 * the server orders items by the user's focusMode + severity — render as given.
 */
export default function InsightsScreen() {
  const { theme } = useThemeMode();
  useLanguage(); // re-render on EN/VI switch (plain t() is not reactive)

  // Dev-only demo control: analyze a past month via ?asOf (hidden long-press).
  const [demoMonth, setDemoMonth] = useState<{ year: number; month: number } | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const asOf = useMemo(() => {
    if (!demoMonth) return undefined;
    const mm = String(demoMonth.month).padStart(2, "0");
    return `${demoMonth.year}-${mm}-15`;
  }, [demoMonth]);

  const { insights, loading, error, reload } = useInsights(asOf);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  const openDemoPicker = useCallback(() => {
    if (!__DEV__) return;
    const now = new Date();
    setDemoMonth(
      (prev) => prev ?? { year: now.getFullYear(), month: now.getMonth() + 1 }
    );
    setPickerVisible(true);
  }, []);

  const stepDemoMonth = (delta: number) => {
    setDemoMonth((prev) => {
      if (!prev) return prev;
      const idx = prev.year * 12 + (prev.month - 1) + delta;
      return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
    });
  };

  const demoPeriodLabel = demoMonth
    ? formatPeriod(`${demoMonth.year}-${String(demoMonth.month).padStart(2, "0")}`)
    : "";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Pressable onLongPress={openDemoPicker} delayLongPress={600}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("insights.title")}
          </Text>
        </Pressable>

        <View style={styles.backBtn} />
      </View>

      {asOf ? (
        <View style={[styles.demoChip, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.demoChipText, { color: theme.subtext }]}>
            {t("insights.viewing_month", { month: demoPeriodLabel })}
          </Text>
          <TouchableOpacity
            onPress={() => setDemoMonth(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? (
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={64} color={theme.subtext} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {t("insights.error")}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primary }]}
            onPress={reload}
          >
            <Text style={styles.retryText}>{t("insights.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={insights}
          keyExtractor={(item, index) => `${item.type}-${item.category ?? "all"}-${index}`}
          renderItem={({ item }) => <InsightCard insight={item} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.centerBox}>
                <Ionicons name="sparkles-outline" size={64} color={theme.subtext} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  {t("insights.empty_title")}
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
                  {t("insights.empty_subtitle")}
                </Text>
              </View>
            )
          }
        />
      )}

      {__DEV__ && (
        <Modal
          visible={pickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pickerCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>
                asOf (dev)
              </Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity onPress={() => stepDemoMonth(-1)} style={styles.stepBtn}>
                  <Ionicons name="chevron-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.pickerMonth, { color: theme.text }]}>
                  {demoPeriodLabel}
                </Text>
                <TouchableOpacity onPress={() => stepDemoMonth(1)} style={styles.stepBtn}>
                  <Ionicons name="chevron-forward" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.pickerActions}>
                <TouchableOpacity
                  onPress={() => {
                    setDemoMonth(null);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerActionText, { color: theme.subtext }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPickerVisible(false)}>
                  <Text style={[styles.pickerActionText, { color: theme.primary }]}>
                    Apply
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  demoChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  separator: {
    height: 12,
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
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerCard: {
    width: "75%",
    borderRadius: 16,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  stepBtn: {
    padding: 8,
  },
  pickerMonth: {
    fontSize: 16,
    fontWeight: "600",
  },
  pickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 8,
  },
  pickerActionText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
