import { StyleSheet } from "react-native";
import type { Theme } from "../theme/tokens";

export const makeAuthStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },

    bg: {
      flex: 1,
      backgroundColor: theme.bg,
      padding: 18,
      justifyContent: "center",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
    },

    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },

    title: { fontSize: 18, fontWeight: "700", color: theme.text },
    subtitle: { marginTop: 4, fontSize: 12.5, color: theme.subtext },

    field: { marginTop: 14 },
    label: { fontSize: 12, fontWeight: "600", color: theme.text, marginBottom: 8 },

    inputRow: {
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    input: { flex: 1, color: theme.text, fontSize: 14 },

    primaryBtn: {
      marginTop: 16,
      height: 44,
      borderRadius: 10,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

    dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
    divider: { flex: 1, height: 1, backgroundColor: theme.border },
    dividerText: {
      marginHorizontal: 8,
      fontSize: 12,
      color: theme.subtext,
      fontWeight: "600",
    },

    socialBtn: {
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    socialText: { fontSize: 14, fontWeight: "600", color: theme.text },

    footerRow: {
      marginTop: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    linkLeft: { color: theme.link, fontSize: 12.5, fontWeight: "600" },
    linkRight: { color: theme.primary, fontSize: 12.5, fontWeight: "700" },

    bottomLinkWrap: { marginTop: 14, alignItems: "center" },
    bottomText: { fontSize: 12.5, color: theme.link, fontWeight: "600" },
    bottomLink: { fontWeight: "800" },

    bottomControls: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "flex-end",
      marginBottom: 12,
      marginRight: 18,
    },
  });
