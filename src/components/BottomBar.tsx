import React from "react";
import { View, Pressable, StyleSheet, Platform, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../theme/ThemeProvider";

type TabKey = "home" | "stats" | "wallet" | "profile";

type Props = {
  active?: TabKey;
  onHome?: () => void;
  onStats?: () => void;
  onAdd?: () => void;
  onWallet?: () => void;
  onProfile?: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function BottomBar({
  active = "home",
  onHome,
  onStats,
  onAdd,
  onWallet,
  onProfile,
}: Props) {
  const { theme } = useThemeMode();

  const iconColor = (key: TabKey) =>
    active === key ? theme.primary : theme.subtext;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Pressable style={styles.item} onPress={onHome}>
          <Ionicons name="home-outline" size={22} color={iconColor("home")} />
        </Pressable>

        <Pressable style={styles.item} onPress={onStats}>
          <Ionicons
            name="stats-chart-outline"
            size={22}
            color={iconColor("stats")}
          />
        </Pressable>

        <View style={{ width: 56 }} />

        <Pressable style={styles.item} onPress={onWallet}>
          <Ionicons
            name="wallet-outline"
            size={22}
            color={iconColor("wallet")}
          />
        </Pressable>

        <Pressable style={styles.item} onPress={onProfile}>
          <Ionicons
            name="person-outline"
            size={22}
            color={iconColor("profile")}
          />
        </Pressable>
      </View>

      <Pressable
        style={[
          styles.fab,
          {
            left: SCREEN_WIDTH / 2 - FAB_SIZE / 2,
            backgroundColor: theme.fabBg,
            borderColor: theme.border,
          },
        ]}
        onPress={onAdd}
      >
        <Ionicons name="scan-outline" size={22} color={theme.fabIcon} />
      </Pressable>
    </View>
  );
}

const BAR_HEIGHT = 72;
const FAB_SIZE = 56;

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: "center",
  },

  bar: {
    width: "92%",
    height: BAR_HEIGHT,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderWidth: 1,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 6,
      },
    }),
  },

  item: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  fab: {
    position: "absolute",
    bottom: BAR_HEIGHT / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 10,
      },
    }),
  },
});