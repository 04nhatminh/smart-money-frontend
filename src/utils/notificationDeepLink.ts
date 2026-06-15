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
  } catch (err) {
    console.warn("resolveDeepLink failed for:", deepLink, err);
  }

  // Unknown scheme or malformed link: don't crash, land on home.
  router.replace("/(tabs)");
  return false;
}
