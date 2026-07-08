import { router } from "expo-router";
import * as Linking from "expo-linking";

/**
 * Single source of truth for turning a notification deep link into in-app
 * navigation. Used by every entry point that can carry a deep link:
 *   - notification list/center row tap
 *   - push (FCM/local) notification tap
 *   - WebSocket live notification (routed through the OS banner tap)
 *
 * Supported links:
 *   - smartmoney://group-invite?token=...  -> accept-invite flow
 *   - /group-projects/{id}                 -> group project detail screen
 *   - app://suggestions/{id}               -> suggestion yes/no card
 *   - app://suggestions                    -> suggestions inbox (daily roll-up)
 *   - app://insights                       -> insights feed (weekly digest)
 *   - app://transactions                   -> transactions list (anomaly/recap)
 *   - app://projects/{id}                  -> project detail (milestone ping)
 *   - app://budgets                        -> budgets screen (GOOD_MONTH ping)
 *
 * Unknown / unparseable / missing links fall back to the notification center
 * (home tab) instead of crashing. Older notifications predate the deepLink
 * column and will be null, so null is treated as "no navigation".
 *
 * @returns true if the link was recognized and navigation happened.
 */
export function resolveDeepLink(deepLink?: string | null): boolean {
  if (!deepLink) {
    // null / undefined: older notification with no link, do nothing.
    return false;
  }

  try {
    // smartmoney://group-invite?token=... -> accept-invite flow
    if (deepLink.startsWith("smartmoney://group-invite")) {
      const parsed = Linking.parse(deepLink);
      const token = parsed.queryParams?.token as string | undefined;
      if (token) {
        router.replace({ pathname: "/accept-invite", params: { token } });
        return true;
      }
    }
    // /group-projects/{id} (relative path) -> group project detail
    else if (deepLink.startsWith("/group-projects/")) {
      const groupProjectId = deepLink.split("/").filter(Boolean)[1];
      if (groupProjectId) {
        router.replace(`/group-project/${groupProjectId}` as any);
        return true;
      }
    }
    // app://suggestions/{id} -> the yes/no card for that suggestion.
    // (Not split("/")-indexed like above: "app:" keeps its own segment, so the
    // id would land at a different index — strip the prefix instead.)
    else if (deepLink.startsWith("app://suggestions/")) {
      const suggestionId = deepLink.replace("app://suggestions/", "");
      if (suggestionId) {
        router.push(`/suggestions/${suggestionId}` as any);
        return true;
      }
    }
    // app://suggestions (no id) -> inbox; the daily roll-up ping lands here.
    else if (deepLink === "app://suggestions") {
      router.push("/suggestions" as any);
      return true;
    }
    // app://insights -> insights feed; carried by the weekly digest.
    else if (deepLink === "app://insights") {
      router.push("/insights" as any);
      return true;
    }
    // app://transactions -> transactions list (per-transaction anomaly pings
    // and the monthly recap: income drop / cashflow negative).
    else if (deepLink === "app://transactions") {
      router.push("/(transactions)/list" as any);
      return true;
    }
    // app://budgets -> budgets screen (GOOD_MONTH celebration).
    else if (deepLink === "app://budgets") {
      router.push("/(tabs)/budgets" as any);
      return true;
    }
    // app://projects/{id} -> that project's detail (milestone celebration).
    else if (deepLink.startsWith("app://projects/")) {
      const projectId = deepLink.replace("app://projects/", "");
      if (projectId) {
        router.push(`/(tabs)/project/${projectId}` as any);
        return true;
      }
    }
  } catch (err) {
    console.warn("resolveDeepLink failed for:", deepLink, err);
  }

  // Unknown scheme or malformed link: don't crash, land on home.
  router.replace("/(tabs)");
  return false;
}
