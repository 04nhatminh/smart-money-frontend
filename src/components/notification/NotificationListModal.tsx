import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  ImageBackground ,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notification } from "../../types/notification.type";
import { t } from '../../i18n';
import { LinearGradient } from "expo-linear-gradient";
import { resolveDeepLink } from "../../utils/notificationDeepLink";

type Props = {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading?: boolean;
  onResetUnread?: () => void; 
};

export const NotificationListModal: React.FC<Props> = ({
  visible,
  onClose,
  notifications,
  loading = false,
  onResetUnread
}) => {
  const [visibleCount, setVisibleCount] = React.useState(20);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const sortedNotifications = React.useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  const visibleNotifications = React.useMemo(() => {
    return sortedNotifications.slice(0, visibleCount);
  }, [sortedNotifications, visibleCount]);

  React.useEffect(() => {
    if (visible) {
      setVisibleCount(20); 
      onResetUnread?.();   
    }
  }, [visible]);

  // Backend `content` is "notification.some.key|arg|..." with a per-key arg
  // count; anything without the "notification." prefix is a server-narrated
  // sentence and is rendered verbatim.
  function localizeContent(content: string): string {
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
        params = { projectName: args[0] };
        break;
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

  // Transaction receipts keep their category image; suggestion/digest pings
  // get a glyph (their args carry no category enum to map).
  function resolveIcon(content: string): { image?: any; glyph?: string } {
    const [key, ...args] = content.split("|");

    if (key === "notification.notification_done") {
      return { image: categoryIcons[args[2]] || categoryIcons.OTHER };
    }
    // Celebratory pings: milestone crossed / clean month.
    if (
      key === "notification.insight.project_milestone" ||
      key === "notification.insight.good_month"
    ) {
      return { glyph: "trophy-outline" };
    }
    if (
      key.startsWith("notification.suggestion.") ||
      key.startsWith("notification.digest.") ||
      key.startsWith("notification.insight.")
    ) {
      return { glyph: "bulb-outline" };
    }
    return { glyph: "notifications-outline" };
  }

  const AnimatedItem = ({ children, index }: any) => {
    const translateY = React.useRef(new Animated.Value(20)).current;
    const opacity = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          delay: index * 60, // 👈 stagger
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay: index * 60,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={{
          transform: [{ translateY }],
          opacity,
        }}
      >
        {children}
      </Animated.View>
    );
  };

  const categoryIcons: Record<string, any> = {
    FOOD: require("../../../assets/categories/food.png"),
    TRANSPORTATION: require("../../../assets/categories/transport.png"),
    CLOTHING: require("../../../assets/categories/clothing.png"),
    UTILITIES: require("../../../assets/categories/utilities.png"),
    ENTERTAINMENT: require("../../../assets/categories/entertainment.png"),
    HEALTH: require("../../../assets/categories/health.png"),
    EDUCATION: require("../../../assets/categories/education.png"),
    OTHER: require("../../../assets/categories/other.png"),
  };

  const HEADER_HEIGHT = 120; // chỉnh theo UI thật của bạn

  const handlePressItem = (item: Notification) => {
    // Only navigate when the backend supplied a deep link. Older notifications
    // have deepLink == null and stay non-navigating.
    if (!item.deepLink) return;
    onClose();
    resolveDeepLink(item.deepLink);
  };

  const renderItem = ({ item, index }: { item: Notification; index: number }) => {
    const tappable = !!item.deepLink;
    const unread = item.read === false;
    const icon = resolveIcon(item.content);

    return (
      <AnimatedItem index={index}>
        <TouchableOpacity
          style={styles.item}
          activeOpacity={tappable ? 0.7 : 1}
          disabled={!tappable}
          onPress={() => handlePressItem(item)}
        >
          <LinearGradient
            colors={["#A8A3D7", "#3629B7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientBar}
          />

          <View style={styles.contentWrapper}>
            <Text style={[styles.content, unread && styles.contentUnread]}>
              {localizeContent(item.content)}
            </Text>

            <View style={styles.bottomRow}>
              <View style={styles.timeRow}>
                {unread && <View style={styles.unreadDot} />}
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
              {tappable && (
                <Ionicons name="chevron-forward" size={16} color="#3629B7" />
              )}
            </View>
          </View>

          <View style={styles.iconWrapper}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                {icon.image ? (
                  <Image
                    source={icon.image}
                    style={styles.icon}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name={icon.glyph as any}
                    size={28}
                    color="#3629B7"
                  />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedItem>
    );
  };

  return (
        <Modal
        visible={visible}
        animationType="fade"
        transparent={false}
        onRequestClose={onClose} // QUAN TRỌNG cho Android
        >

      <ImageBackground
        source={require("../../../assets/notification.jpg")} // 👈 chỉnh path đúng
        style={{ flex: 1, position: "absolute", width: "100%", height: "100%", opacity: 0.36 }}
        resizeMode="cover"
      ></ImageBackground>

        <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {/* Left placeholder để cân giữa */}
          <View style={{ width: 40 }} />

          <View style={styles.titleContainer}>
            <LinearGradient
              colors={["#5A4FCF", "#3629B7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBox}
            >
              <Text style={styles.title}>
                {t("notification.notifications")}
              </Text>
            </LinearGradient>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3629B7" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>{t("notification.no_notifications")}</Text>
          </View>
        ) : (
          <FlatList
            data={visibleNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListHeaderComponent={<View style={{ height: HEADER_HEIGHT }} />}
            onEndReached={() => {
              if (isLoadingMore) return;
              if (visibleCount >= sortedNotifications.length) return;

              setIsLoadingMore(true);

              setTimeout(() => {
                setVisibleCount((prev) => prev + 20);
                setIsLoadingMore(false);
              }, 300); // giả lập delay cho mượt
            }}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.4}

            ListFooterComponent={
              visibleCount < sortedNotifications.length ? (
                <LinearGradient
                  colors={["transparent", "rgba(54, 41, 183, 0.15)", "rgba(54, 41, 183, 0.3)"]}
                  style={styles.loadingGradient}
                >
                  <ActivityIndicator size="small" color="#3629B7" />
                </LinearGradient>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 999,
    elevation: 10,
    paddingHorizontal: 10,
    backgroundColor: "transparent",
  },

  header: {
    position: "absolute",
    top: 40, // hoặc 0 + paddingTop SafeArea
    left: 0,
    right: 0,
    zIndex: 1000,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,

    backgroundColor: "transparent", // 👈 nên có để đỡ bị xuyên nền
  },

  titleContainer: {
    alignItems: "center",
    justifyContent: "center",

    // glow outer
    shadowColor: "#6C63FF",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },

    elevation: 12,
  },

  gradientBox: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,

    // inner shadow nhẹ
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  title: {
    color: "#EAE9FF",
    fontSize: 15,
    fontWeight: "600",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#A8A3D7",
    justifyContent: "center",
    alignItems: "center",
  },


  empty: {
    fontSize: 14,
    color: "#999",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },


  item: {
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,

    borderWidth: 1,
    borderColor: "#E0E0E0",

    // shadow mềm
    shadowColor: "#3629B7",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    elevation: 3,
    overflow: "hidden", // 👈 để gradient không tràn
  },

  gradientBar: {
    width: 5,
  },

  contentWrapper: {
    flex: 1,
    padding: 14,
  },

  content: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
    lineHeight: 20,
  },

  contentUnread: {
    fontWeight: "700",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3629B7",
  },

  bottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#333",
  },

  time: {
    fontSize: 12,
    color: "#A8A3D7",
  },

  loadingGradient: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    height: 80
  },

  loadMoreBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#A8A3D7",
    alignItems: "center",
  },

  loadMoreText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#A8A3D7",
    borderTopLeftRadius: 36,
    borderBottomLeftRadius: 36,
  },

  // vòng ngoài (viền tím)
  iconOuter: {
    width: 50,
    height: 50,
    borderRadius: 23,
    backgroundColor: "#3629B7",
    justifyContent: "center",
    alignItems: "center",
  },

  // vòng trong (nền trắng)
  iconInner: {
    width: 50,
    height: 50,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  // icon
  icon: {
    width: 36,
    height: 36,
  },
});