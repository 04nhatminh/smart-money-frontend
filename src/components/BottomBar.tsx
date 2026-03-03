import React from "react";
import { View, Pressable, StyleSheet, Platform, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import { useThemeMode } from "../theme/ThemeProvider";

type TabKey = "home" | "stats" | "wallet" | "profile";

type NavigationHandlers = {
  onHome: () => void;
  onStats: () => void;
  onAdd: () => void;
  onWallet: () => void;
  onProfile: () => void;
};

type Props = {
  active?: TabKey;
  handlers?: NavigationHandlers;
  // Legacy props for backward compatibility
  onHome?: () => void;
  onStats?: () => void;
  onAdd?: () => void;
  onWallet?: () => void;
  onProfile?: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function BottomBar({
  active = "home",
  handlers,
  onHome,
  onStats,
  onAdd,
  onWallet,
  onProfile,
}: Props) {
  const { theme } = useThemeMode();

  // Use handlers if provided, otherwise fallback to individual props
  const actualHandlers = handlers || {
    onHome: onHome || (() => {}),
    onStats: onStats || (() => {}),
    onAdd: onAdd || (() => {}),
    onWallet: onWallet || (() => {}),
    onProfile: onProfile || (() => {}),
  };

  const iconColor = (key: TabKey) =>
    active === key ? '#3629B7' : '#A8A3D7'; // Active: primary purple, Inactive: light purple

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: '#FFFFFF',
            borderColor: '#F2F1F9',
          },
        ]}
      >
        <Pressable 
          style={[styles.item, active === 'home' && styles.activeItem]} 
          onPress={actualHandlers.onHome}
        >
          <Ionicons 
            name={active === 'home' ? "home" : "home-outline"} 
            size={22} 
            color={iconColor("home")} 
          />
        </Pressable>

        <Pressable 
          style={[styles.item, active === 'stats' && styles.activeItem]} 
          onPress={actualHandlers.onStats}
        >
          <Ionicons
            name={active === 'stats' ? "stats-chart" : "stats-chart-outline"}
            size={22}
            color={iconColor("stats")}
          />
        </Pressable>

        <View style={{ width: 56 }} />

        <Pressable 
          style={[styles.item, active === 'wallet' && styles.activeItem]} 
          onPress={actualHandlers.onWallet}
        >
          <Ionicons
            name={active === 'wallet' ? "wallet" : "wallet-outline"}
            size={22}
            color={iconColor("wallet")}
          />
        </Pressable>

        <Pressable 
          style={[styles.item, active === 'profile' && styles.activeItem]} 
          onPress={actualHandlers.onProfile}
        >
          <Ionicons
            name={active === 'profile' ? "person" : "person-outline"}
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
            backgroundColor: '#3629B7', // Primary purple
            borderColor: '#5655B9',
          },
        ]}
        onPress={actualHandlers.onAdd}
      >
        <Feather name="plus-square" size={24} color="white" />
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
    borderRadius: 36, // More rounded
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderWidth: 1,

    ...Platform.select({
      ios: {
        shadowColor: "#3629B7",
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 8,
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

  activeItem: {
    backgroundColor: '#F2F1F9', // Light purple background for active item
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
        shadowColor: "#3629B7",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
});