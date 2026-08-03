// Backend gui `content` dang "notification.some.key|arg|..." voi so luong arg
// tuy tung key; chuoi khong co tien to "notification." la cau da duoc server
// dien giai san, tra ve nguyen van.
//
// Truoc day logic nay bi chep thanh hai ban — mot trong NotificationListModal
// (danh sach) va mot trong notificationHandler (luc gui push). Ban trong
// notificationHandler thieu nhieu key nen push hien "[missing "{{category}}"
// value]" con danh sach thi dung. Giu DUY NHAT mot ban o day.
import { t } from ".";

export function localizeNotificationContent(content: string): string {
  if (!content.startsWith("notification.")) {
    return content;
  }

  const [key, ...args] = content.split("|");
  let params: Record<string, string> = {};

  switch (key) {
    // Category-argument keys: the arg is a Category enum to localize.
    case "notification.suggestion.raise_budget":
    case "notification.suggestion.create_budget":
    case "notification.suggestion.set_category_limit":
    case "notification.suggestion.reduce_budget":
    case "notification.suggestion.reallocate_budget":
    case "notification.insight.large_transaction":
    case "notification.insight.duplicate_charge":
      params = {
        category: t(`category.${args[0]}`, { defaultValue: args[0] }),
      };
      break;
    // Project-name-argument keys: the arg is the project name itself, not an enum.
    case "notification.suggestion.contribute_to_project":
    case "notification.suggestion.increase_contribution":
    case "notification.insight.project_milestone":
    case "notification.settlement.project_completed":
    case "notification.settlement.project_frozen":
    case "notification.settlement.project_expired":
    case "notification.group.project_started":
    case "notification.group.project_completed":
    case "notification.group.project_expired":
    case "notification.group.sponsorship_failed":
      params = { projectName: args[0] };
      break;
    case "notification.group.invited":
      params = { groupName: args[0] };
      break;
    case "notification.group.member_dropped":
      params = { username: args[0], projectName: args[1] };
      break;
    // Sponsorship amounts: proposed and original monthly shares (VND).
    case "notification.group.sponsorship_survey":
    case "notification.group.sponsorship_new_round": {
      const fmt = (raw: string) => {
        const n = Number(raw);
        return Number.isFinite(n) ? new Intl.NumberFormat("en-US").format(n) : raw;
      };
      params = { proposed: fmt(args[0]), original: fmt(args[1]) };
      break;
    }
    // The arg is the subscription's raw description.
    case "notification.suggestion.review_subscription":
      params = { description: args[0] };
      break;
    case "notification.digest.weekly":
      params = { count: args[0] };
      break;
    case "notification.notification_done": {
      const amount = Number(args[1]);
      params = {
        type: t(args[0]),
        amount: Number.isFinite(amount)
          ? new Intl.NumberFormat("en-US").format(amount)
          : args[1],
        category: t(`category.${args[2]}`, { defaultValue: args[2] }),
      };
      break;
    }
    default:
      break;
  }

  // Unknown keys fall back to the raw content rather than a "[missing]" marker.
  return t(key, { ...params, defaultValue: content });
}
