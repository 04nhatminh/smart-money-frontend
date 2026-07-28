import React, { useMemo, useState } from "react";
import { View, Pressable, StyleSheet, Platform, Dimensions, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useThemeMode } from "../theme/ThemeProvider";

type TabKey = "home" | "stats" | "transaction" | "project" | "analysis" | "assistant";

type NavigationHandlers = {
  onHome: () => void;
  onStats: () => void;
  onAdd: () => void;
  onTransaction: () => void;
  onProject: () => void;
  onAnalysis: () => void;
  onProfile: () => void;
};

type Props = {
  active?: TabKey;
  handlers?: NavigationHandlers;
  // Legacy props for backward compatibility
  onHome?: () => void;
  onStats?: () => void;
  onAdd?: () => void;
  onTransaction?: () => void;
  onProject?: () => void;
  onAnalysis?: () => void;
  onProfile?: () => void;
  // Add menu option handlers
  onAddByForm?: () => void;
  onAddByCamera?: () => void;
  onAddByVoice?: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BAR_HEIGHT = 72;
const FAB_SIZE = 56;

export function BottomBar({
  active = "home",
  handlers,
  onHome,
  onStats,
  onAdd,
  onTransaction,
  onProject,
  onAnalysis,
  onProfile,
  onAddByForm,
  onAddByCamera,
  onAddByVoice,
}: Props) {
  const { theme, mode } = useThemeMode();
  const [menuOpen, setMenuOpen] = useState(false);

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' || mode === 'purple' ? '#FFFFFF' : theme.card;

  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: surface,
      borderColor: theme.border,

      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
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
      backgroundColor: accent + '20', // Tint nhẹ của accent cho tab đang chọn
    },

    fab: {
      position: "absolute",
      bottom: BAR_HEIGHT / 2,
      left: SCREEN_WIDTH / 2 - FAB_SIZE / 2,
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      backgroundColor: theme.fabBg,
      borderColor: theme.border,

      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        },
        android: {
          elevation: 12,
        },
      }),
    },

    menuContainer: {
      position: 'absolute',
      bottom: BAR_HEIGHT / 2 - 28,
      left: SCREEN_WIDTH / 2 - 28,
      width: 56,
      height: 56,
    },

    menuOption: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },

    menuButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: accent,
      ...Platform.select({
        ios: {
          shadowColor: theme.primary,
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        android: {
          elevation: 8,
        },
      }),
    },

    menuOptionTop: {
      top: -120,
    },

    menuOptionLeft: {
      top: -90,
      left: -80,
    },

    menuOptionRight: {
      top: -90,
      right: -80,
    },
  }), [theme, mode]);

  // Use handlers if provided, otherwise fallback to individual props
  const actualHandlers = handlers || {
    onHome: onHome || (() => { }),
    onStats: onStats || (() => { }),
    onAdd: onAdd || (() => { }),
    onTransaction: onTransaction || (() => { }),
    onProject: onProject || (() => { }),
    onAnalysis: onAnalysis || (() => { }),
    onProfile: onProfile || (() => { }),
  };

  const handleAddPress = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuOptionPress = (option: 'form' | 'camera' | 'voice') => {
    setMenuOpen(false);

    switch (option) {
      case 'form':
        onAddByForm?.();
        break;
      case 'camera':
        onAddByCamera?.();
        break;
      case 'voice':
        onAddByVoice?.();
        break;
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const iconColor = (key: TabKey) =>
    active === key ? accent : theme.subtext; // Active: accent theo theme, Inactive: subtext

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.bar}>
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
          style={[styles.item, active === "transaction" && styles.activeItem]}
          onPress={actualHandlers.onTransaction}
        >
          <FontAwesome6 name="money-bill-transfer" size={24} color={iconColor("transaction")} />
        </Pressable>

        <View style={{ width: 56 }} />

        <Pressable
          style={[styles.item, active === 'analysis' && styles.activeItem]}
          onPress={actualHandlers.onAnalysis}
        >
          <Ionicons
            name={active === 'analysis' ? "stats-chart" : "stats-chart-outline"}
            size={22}
            color={iconColor("analysis")}
          />
        </Pressable>

        <Pressable
          style={[styles.item, active === 'assistant' && styles.activeItem]}
          onPress={actualHandlers.onProfile}
        >
          <Ionicons
            name={
              active === 'assistant'
                ? 'logo-ionitron'
                : 'logo-ionitron'
            }
            size={22}
            color={iconColor("assistant")}
          />
        </Pressable>
      </View>

      <Pressable
        style={styles.fab}
        onPress={handleAddPress}
      >
        <Feather name="plus" size={28} color={theme.fabIcon} />
      </Pressable>

      {/* Menu options - appear in circular arrangement - RENDER LAST FOR TOP Z-ORDER */}
      {menuOpen && (
        <View pointerEvents="box-none" style={styles.menuContainer}>
          {/* Form option - top */}
          <Pressable
            style={[styles.menuOption, styles.menuOptionTop]}
            onPress={() => handleMenuOptionPress('form')}
          >
            <View style={styles.menuButton}>
              <Ionicons name="document-text-outline" size={20} color={accent} />
            </View>
          </Pressable>

          {/* Camera option - left */}
          <Pressable
            style={[styles.menuOption, styles.menuOptionLeft]}
            onPress={() => handleMenuOptionPress('camera')}
          >
            <View style={styles.menuButton}>
              <Ionicons name="camera-outline" size={20} color={accent} />
            </View>
          </Pressable>

          {/* Voice option - right */}
          <Pressable
            style={[styles.menuOption, styles.menuOptionRight]}
            onPress={() => handleMenuOptionPress('voice')}
          >
            <View style={styles.menuButton}>
              <MaterialCommunityIcons name="microphone-outline" size={20} color={accent} />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
