export type GroupProjectErrorContext =
  | "accept-invite"
  | "join-project" // creating a sub-project by joining a group project
  | "create-project" // creating the group project itself
  | "dissolve";

export function getGroupProjectErrorMessage(
  errorCode: string | undefined,
  context: GroupProjectErrorContext
): string | null {
  switch (errorCode) {
    case "PROJECT_INVITE_USER_MISMATCH":
      return "This invitation was not sent to you.";
    case "PROJECT_CURRENCY_MISMATCH":
      // Fires on accept-invite and create-sub-project. Previously the backend
      // returned PROJECT_USER_INCOME_REQUIRED here, so both codes are handled.
      return "Your income currency doesn't match the group's currency. Update your income and try again.";
    case "PROJECT_USER_INCOME_REQUIRED":
      return context === "accept-invite"
        ? "Please set up your income before accepting a group invitation."
        : "Please set up your income before joining this group project.";
    case "PROJECT_MAX_ACTIVE_REACHED":
      // Now only fires when creating a sub-project (joining). On accept-invite we
      // fall through to the generic message so stale handling doesn't mislead.
      return context === "join-project"
        ? "You've reached the maximum number of active projects. Complete or remove one before joining."
        : null;
    case "PROJECT_INVALID_NAME":
      return "Please enter a valid project name.";
    case "PROJECT_ALREADY_DISSOLVED":
      return "This group project has already been dissolved.";
    default:
      return null;
  }
}
