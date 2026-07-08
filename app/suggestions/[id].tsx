import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ButtonSave } from "../../src/components/ButtonSave";
import SuccessModal from "../../src/components/SuccessModal";
import { ProjectAPI } from "../../src/api/project.api";
import { SuggestionApi } from "../../src/api/suggestion.api";
import { t } from "../../src/i18n";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { Suggestion } from "../../src/types/suggestion.types";
import {
  formatPeriod,
  localizeInsight,
  severityStyle,
} from "../../src/utils/insightFormat";
import {
  PROJECT_NAME_TYPES,
  SUGGESTION_TYPE_ICONS,
  askSentence,
  statusChipStyle,
  suggestionTitle,
} from "../../src/utils/suggestionFormat";
import { formatVND } from "../../src/utils/formatCurrency";

/**
 * The suggestion card — the ONLY surface where a yes/no decision is made
 * (push banners never carry buttons). Reached from the inbox or a
 * notification deep link (app://suggestions/{id}).
 *
 * There is no by-id GET: we fetch the PENDING list and filter, falling back
 * to the decided statuses for links that outlived the decision.
 */
export default function SuggestionCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, mode } = useThemeMode();
  useLanguage(); // re-render on EN/VI switch
  const isDark = mode === "dark";

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [respondingAccept, setRespondingAccept] = useState<boolean | null>(null);
  const [respondError, setRespondError] = useState<string | null>(null);
  const [successKind, setSuccessKind] = useState<"accepted" | "dismissed" | null>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/suggestions" as any);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      const pending = await SuggestionApi.getSuggestions("PENDING");
      let found = pending.data?.find((s) => s.id === id) ?? null;

      if (!found) {
        // Deep links can target already-decided suggestions.
        const rest = await Promise.all([
          SuggestionApi.getSuggestions("ACCEPTED"),
          SuggestionApi.getSuggestions("DISMISSED"),
          SuggestionApi.getSuggestions("EXPIRED"),
        ]);
        found =
          rest.flatMap((r) => r.data ?? []).find((s) => s.id === id) ?? null;
      }

      if (cancelled) return;
      setSuggestion(found);
      setNotFound(!found);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Project-backed asks carry only projectId — fetch the name for the ask.
  useEffect(() => {
    let cancelled = false;
    const projectId = suggestion?.payload.proposedAction?.projectId;

    if (
      suggestion &&
      PROJECT_NAME_TYPES.includes(suggestion.type) &&
      projectId
    ) {
      ProjectAPI.getById(projectId).then((res) => {
        if (!cancelled && res.success && res.data?.name) {
          setProjectName(res.data.name);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [suggestion]);

  const respond = async (accept: boolean) => {
    if (!suggestion || respondingAccept !== null) return;

    setRespondingAccept(accept);
    setRespondError(null);

    const res = await SuggestionApi.respond(suggestion.id, accept);
    setRespondingAccept(null);

    if (res.success) {
      // CREATE_PROJECT is navigate-only: the server ran nothing, it just marked
      // the suggestion ACCEPTED. Route to the create-project form pre-filled with
      // the proposedAction seeds (target amount + deadline; the implied monthly
      // saving matches the capped monthlySaving). Every field stays editable and
      // the project name is left blank. Decline falls through to the normal
      // dismissal confirmation below.
      if (accept && suggestion.type === "CREATE_PROJECT") {
        const action = suggestion.payload.proposedAction;
        router.replace({
          pathname: "/(tabs)/project",
          params: {
            create: "1",
            ...(action?.resolvedValue != null
              ? { amount: String(action.resolvedValue) }
              : {}),
            ...(action?.deadline ? { deadline: action.deadline } : {}),
          },
        } as any);
        return;
      }
      // Idempotent endpoint: an already-decided suggestion comes back with its
      // current state — treat any success as decided. Only trust res.data when
      // it's a real suggestion object; otherwise synthesize the decided state.
      const decided: Suggestion =
        res.data && (res.data as Suggestion).id
          ? (res.data as Suggestion)
          : ({
              ...suggestion,
              status: accept ? "ACCEPTED" : "DISMISSED",
            } as Suggestion);
      setSuggestion(decided);
      // Key the confirmation off the user's own choice — never off the returned
      // payload's status, whose shape/casing can't be relied on.
      setSuccessKind(accept ? "accepted" : "dismissed");
    } else {
      setRespondError(res.message || t("suggestion.respond_error"));
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (notFound || !suggestion) {
      return (
        <View style={styles.centerBox}>
          <Ionicons name="help-circle-outline" size={64} color={theme.subtext} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {t("suggestion.not_found_title")}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
            {t("suggestion.not_found_subtitle")}
          </Text>
          <TouchableOpacity
            style={[styles.inboxBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.replace("/suggestions" as any)}
          >
            <Text style={styles.inboxBtnText}>{t("suggestion.go_to_inbox")}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const snapshot = suggestion.payload.insightSnapshot;
    const action = suggestion.payload.proposedAction;
    const sev = severityStyle(snapshot.severity, isDark);
    const chip = statusChipStyle(suggestion.status, isDark);
    const isPending = suggestion.status === "PENDING";
    const waitingForProjectName =
      PROJECT_NAME_TYPES.includes(suggestion.type) && projectName === null;
    const adjustments = action?.budgetAdjustments ?? [];

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.typeIconBox, { backgroundColor: chip.bg }]}>
          <Ionicons
            name={SUGGESTION_TYPE_ICONS[suggestion.type] as any}
            size={30}
            color={chip.color}
          />
        </View>

        <Text style={[styles.typeTitle, { color: theme.subtext }]}>
          {suggestionTitle(suggestion.type)}
        </Text>

        <Text style={[styles.ask, { color: theme.text }]}>
          {askSentence(suggestion, projectName)}
        </Text>

        {(suggestion.type === "CREATE_BUDGET" ||
          suggestion.type === "SET_CATEGORY_LIMIT") &&
        action?.month &&
        action?.year ? (
          <Text style={[styles.periodCaption, { color: theme.subtext }]}>
            {formatPeriod(
              `${action.year}-${String(action.month).padStart(2, "0")}`
            )}
          </Text>
        ) : null}

        {!isPending && (
          <View style={[styles.statusBanner, { backgroundColor: chip.bg }]}>
            <Text style={[styles.statusBannerText, { color: chip.color }]}>
              {t(`suggestion.status.${suggestion.status}`)}
            </Text>
            {suggestion.decidedAt ? (
              <Text style={[styles.statusBannerDate, { color: chip.color }]}>
                {t("suggestion.decided_at", {
                  date: new Date(suggestion.decidedAt).toLocaleString(),
                })}
              </Text>
            ) : null}
          </View>
        )}

        <View
          style={[
            styles.whyCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.whyHeader}>
            <Text style={[styles.whyTitle, { color: theme.subtext }]}>
              {t("suggestion.why_title")}
            </Text>
            <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
              <Text style={[styles.severityText, { color: sev.color }]}>
                {t(`severity.${snapshot.severity}`)}
              </Text>
            </View>
          </View>
          <Text style={[styles.whyText, { color: theme.text }]}>
            {localizeInsight(snapshot)}
          </Text>
          <Text style={[styles.whyPeriod, { color: theme.subtext }]}>
            {formatPeriod(snapshot.period)}
          </Text>
        </View>

        {adjustments.length > 0 ? (
          <View
            style={[
              styles.adjustCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.adjustTitle, { color: theme.subtext }]}>
              {t("suggestion.adjustments_title")}
            </Text>
            {adjustments.map((adj) => (
              <View key={adj.budgetId} style={styles.adjustRow}>
                <Text
                  style={[styles.adjustCategory, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {t(`category.${adj.category}`, { defaultValue: adj.category })}
                </Text>
                <View style={styles.adjustValues}>
                  <Text style={[styles.adjustFrom, { color: theme.subtext }]}>
                    {formatVND(adj.currentLimit)}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={13}
                    color={theme.subtext}
                  />
                  <Text style={[styles.adjustTo, { color: theme.text }]}>
                    {formatVND(adj.newLimit)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {respondError ? (
          <Text style={styles.errorText}>{respondError}</Text>
        ) : null}

        {isPending && (
          <View style={styles.actions}>
            <ButtonSave
              label={t("suggestion.action.no")}
              variant="secondary"
              disabled={respondingAccept !== null}
              loading={respondingAccept === false}
              loadingText={t("suggestion.action.no")}
              onPress={() => respond(false)}
            />
            <ButtonSave
              label={t("suggestion.action.yes")}
              variant="primary"
              disabled={respondingAccept !== null || waitingForProjectName}
              loading={respondingAccept === true}
              loadingText={t("suggestion.action.yes")}
              onPress={() => respond(true)}
            />
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>
          {t("suggestion.card_title")}
        </Text>

        <View style={styles.backBtn} />
      </View>

      {renderBody()}

      <SuccessModal
        visible={successKind !== null}
        title={
          successKind === "accepted"
            ? t("suggestion.accepted_done")
            : t("suggestion.dismissed_done")
        }
        description=""
        onDone={() => {
          setSuccessKind(null);
          goBack();
        }}
      />
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
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  typeIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  typeTitle: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ask: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    textAlign: "center",
  },
  periodCaption: {
    marginTop: 6,
    fontSize: 13,
  },
  statusBanner: {
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    alignSelf: "stretch",
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusBannerDate: {
    marginTop: 2,
    fontSize: 12,
  },
  whyCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignSelf: "stretch",
  },
  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  whyTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  whyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  whyPeriod: {
    marginTop: 8,
    fontSize: 11,
  },
  adjustCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignSelf: "stretch",
  },
  adjustTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  adjustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  adjustCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  adjustValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adjustFrom: {
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  adjustTo: {
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 16,
    color: "#F44336",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    alignSelf: "stretch",
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
    textAlign: "center",
  },
  inboxBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  inboxBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
