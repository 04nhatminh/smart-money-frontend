import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
  ImageBackground,
  Animated,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { UserResponse } from "../../src/types/auth.types";
import notificationService from "../../src/notification/notificationService";
import { Notification } from "../../src/types/notification.type";
import { setNotificationScreenActive } from "../../src/notification/notificationHandler";
import { registerForPushNotificationsAsync } from "../../src/notification/registerForPushNotificationsAsync";
import { NotificationListModal } from "../../src/components/notification/NotificationListModal";
import { initWebSocket } from "../../src/services/websocket";
import AppBottomBar from "../../src/components/AppBottomBar";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { TransactionRequest, Receipt, TransactionResponse } from "../../src/types/transaction.types";
import { useFocusEffect, useRouter } from "expo-router";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";
import { useAIInsight } from "../../src/hooks/useAIInsight";
import QuickFeatureSection from "../../src/components/home/QuickFeatureSection";
import CreateProjectModal from "../../src/components/projects/CreateProjectModal";
import ProjectTypeSelectionModal from "../../src/components/projects/ProjectTypeSelectionModal";
import LatestProjectsSection, { LatestProjectItem } from "../../src/components/home/LatestProjectsSection";
import InsightsPreviewSection from "../../src/components/home/InsightsPreviewSection";
import PendingSuggestionsSection from "../../src/components/home/PendingSuggestionsSection";
import FinancialSetupModal from "../../src/components/financialSetup/FinancialSetupModal";
import { ProjectAPI } from "../../src/api/project.api";
import { notificationEmitter } from "../../src/utils/notificationEmitter";
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../src/utils/dataRefreshEmitter";
import { panelRef } from "../_layout";
import { budgetAPI, BudgetItem } from "../../src/api/budget.api";
import transactionApi from "../../src/api/transaction.api";
import { CircularProgress } from "../../src/components/CircularProgress";
import { formatVND } from "../../src/utils/formatCurrency";
import { useAuth } from "../../src/context/AuthContext";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import analyticsAPI from "../../src/api/transaction_analytics.api";
import { t } from "../../src/i18n";

// Category icon mapping (giữ nguyên)
const categoryIconMap: { [key: string]: { icon: string; color: string; displayName: string } } = {
  FOOD: { icon: 'restaurant', color: '#FF9800', displayName: 'Food' },
  TRANSPORTATION: { icon: 'car', color: '#2196F3', displayName: 'Transport' },
  CLOTHING: { icon: 'shirt', color: '#E91E63', displayName: 'Clothing' },
  UTILITIES: { icon: 'flash', color: '#FFC107', displayName: 'Utilities' },
  ENTERTAINMENT: { icon: 'film', color: '#9C27B0', displayName: 'Entertainment' },
  HEALTH: { icon: 'heart', color: '#F44336', displayName: 'Health' },
  EDUCATION: { icon: 'book', color: '#3629B7', displayName: 'Education' },
  SHOPPING: { icon: 'bag', color: '#4CAF50', displayName: 'Shopping' },
  OTHER: { icon: 'ellipsis-horizontal', color: '#757575', displayName: 'Other' },
};

const creditCardImages = {
  light: require('../../assets/creditcard_light.jpg'),
  dark: require('../../assets/creditcard_dark.jpg'),
  green: require('../../assets/creditcard_green.jpg'),
};

const getTransactionCategoryInfo = (category: string) => {
  const normalized = category ? category.toUpperCase() : "OTHER";
  const map: Record<string, { icon: string; color: string; displayName: string }> = {
    FOOD: { icon: 'restaurant', color: '#FF9800', displayName: 'Food' },
    TRANSPORTATION: { icon: 'car', color: '#2196F3', displayName: 'Transport' },
    CLOTHING: { icon: 'shirt', color: '#E91E63', displayName: 'Clothing' },
    UTILITIES: { icon: 'flash', color: '#FFC107', displayName: 'Utilities' },
    ENTERTAINMENT: { icon: 'film', color: '#9C27B0', displayName: 'Entertainment' },
    HEALTH: { icon: 'heart', color: '#F44336', displayName: 'Health' },
    EDUCATION: { icon: 'book', color: '#3629B7', displayName: 'Education' },
    SHOPPING: { icon: 'bag', color: '#4CAF50', displayName: 'Shopping' },
    SALARY: { icon: 'wallet', color: '#4CAF50', displayName: 'Salary' },
    BONUS: { icon: 'cash', color: '#00E676', displayName: 'Bonus' },
    INVESTMENT: { icon: 'trending-up', color: '#00B0FF', displayName: 'Investment' },
    GIFT: { icon: 'gift', color: '#FF3D00', displayName: 'Gift' },
    OTHER: { icon: 'ellipsis-horizontal', color: '#757575', displayName: 'Other' },
  };
  return map[normalized] || map.OTHER;
};

const moodIcons = {
  
  Positive: {
    light: require('../../assets/happy_face_light.png'),
    dark: require('../../assets/happy_face_dark.png'),
    green: require('../../assets/happy_face_light.png'),
  },
  Negative: {
    light: require('../../assets/sad_face_light.png'),
    dark: require('../../assets/sad_face_dark.png'),
    green: require('../../assets/sad_face_light.png'),
  },
};

export default function HomePage() {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const HOME_REFRESH_TTL_MS = 60 * 1000;

  // Modals state
  const [cameraVisible, setCameraVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [isProjectTypeSelectionVisible, setProjectTypeSelectionVisible] = useState(false);
  const [isCreateProjectVisible, setCreateProjectVisible] = useState(false);
  const [showFinancialSetup, setShowFinancialSetup] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const { insight, loading: insightLoading, reload } = useAIInsight();
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, mode } = useThemeMode(); // Lấy theme

  // Data state
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [latestProjects, setLatestProjects] = useState<LatestProjectItem[]>([]);
  const [latestProjectsLoading, setLatestProjectsLoading] = useState(false);
  const [monthlyTotalExpense, setMonthlyTotalExpense] = useState<number>(0);
  const [monthlyTotalIncome, setMonthlyTotalIncome] = useState<number>(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const { createFromReceipt, createFromVoice } = useCreateTransaction();

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [loadingNotification, setLoadingNotification] = useState(false);

  // State để điều khiển hiển thị insights
  const [currentInsightIndex, setCurrentInsightIndex] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const lastLoadedAtRef = useRef({
    user: 0,
    projects: 0,
    budgets: 0,
    transactions: 0,
    analytics: 0,
  });

  // ==================== DYNAMIC STYLES ====================
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  const dynamicStyles = useMemo(() => {
    const { bg, card, text, subtext, border, primary, inputBg } = theme;

    return StyleSheet.create({
      safe: {
        flex: 1,
        backgroundColor: bg,
      },
      scrollView: {
        flex: 1,
        backgroundColor: bg,
      },
      container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 100,
        paddingTop: 30,
        backgroundColor: bg,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadingText: {
        fontSize: 16,
        color: text,
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 6,
      },
      avatarContainer: {
        marginLeft: 0,
      },
      avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: primary, // dùng primary từ theme, hoặc giữ cứng '#3629B7'
      },
      avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: primary, // dùng primary từ theme, hoặc giữ cứng '#3629B7'
        justifyContent: 'center',
        alignItems: 'center',
      },
      avatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
      },
      greetingContainer: {
        marginBottom: 16,
        paddingBottom: 4,
        minHeight: 80,
      },
      greeting: {
        fontSize: 18,
        fontWeight: '600',
        color: text,
        marginBottom: 4,
      },
      insightItem: {
        paddingVertical: 4,
      },
      insightText: {
        fontSize: 22,
        fontWeight: '700',
        color: text,
      },
      notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: inputBg || '#F5F5F5', // fallback
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      },
      notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#FF4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
      },
      badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
      },
      moodContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
      },
      moodImage: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
      },
      // Balance Card – GIỮ CỨNG MÀU HOME
      balanceCard: {
        borderRadius: 26,
        paddingVertical: 22,
        paddingHorizontal: 20,
        marginBottom: 18,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
      },
      balanceHeader: {
        marginBottom: 22,
      },
      balanceAmount: {
        fontSize: 34,
        fontWeight: '900',
        color: card,
        letterSpacing: -0.8,
        marginBottom: 4,
      },
      balanceLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: card,
      },
      balanceDate: {
        fontSize: 12,
        fontWeight: '500',
        color: card,
      },
      balanceSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
      },
      balanceSummaryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
      },
      summaryIconBox: {
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
      },
      summaryLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 2,
      },
      summaryAmount: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
      },
      summaryDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 12,
      },
      section: {
        marginBottom: 25,
      },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: text,
      },
      seeAllText: {
        fontSize: 14,
        color: accent,
        fontWeight: '600',
      },
      budgetsHorizontalList: {
        paddingVertical: 10,
        paddingRight: 20,
      },
      categoryItem: {
        alignItems: 'center',
        marginRight: 20,
      },
      budgetIconInner: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
      },
      categoryName: {
        fontSize: 12,
        color: subtext,
        fontWeight: '500',
        marginTop: 6,
      },
      transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: border,
      },
      transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      },
      transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: inputBg || '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      },
      transactionName: {
        fontSize: 16,
        fontWeight: '500',
        color: text,
        marginBottom: 2,
      },
      transactionDate: {
        fontSize: 12,
        color: subtext,
      },
      transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
      },
      emptyText: {
        fontSize: 14,
        color: subtext,
        textAlign: 'center',
        paddingVertical: 20,
      },
    });
  }, [theme, accent]);

  const shouldHideBottomBar =
    isProjectTypeSelectionVisible ||
    isCreateProjectVisible ||
    cameraVisible ||
    voiceVisible ||
    manualVisible ||
    showFinancialSetup ||
    showNotification;

  // Tạo mảng allInsights bao gồm greeting + các insight thực tế
  const allInsights = useMemo(() => {
    const greeting = {
      text: t("common.greeting"),
      state: "Positive",
    };

    return insight && insight.length > 0
      ? [...insight, greeting]
      : [greeting];
  }, [insight, t]);

  const shouldRefresh = (lastLoadedAt: number) => {
    return Date.now() - lastLoadedAt > HOME_REFRESH_TTL_MS;
  };

  // Effect khởi tạo khi allInsights thay đổi
  useEffect(() => {
    if (!started && allInsights.length > 0) {
      setCurrentInsightIndex(0);
      setStarted(true);
    }
  }, [allInsights, started]);

  const currentInsight =
    currentInsightIndex !== null
      ? allInsights[currentInsightIndex]
      : null;

  const moodIcon =
    currentInsight?.state === "Negative"
      ? moodIcons.Negative[mode] || moodIcons.Negative.light  // fallback
      : moodIcons.Positive[mode] || moodIcons.Positive.light;

  useEffect(() => {
    if (currentInsightIndex === null || currentInsightIndex >= allInsights.length) {
      return;
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      const nextIndex = currentInsightIndex + 1;

      if (nextIndex < allInsights.length) {
        setCurrentInsightIndex(nextIndex);
      } else {
        // Đang ở greeting -> giữ nguyên
        setCurrentInsightIndex(currentInsightIndex);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [currentInsightIndex, allInsights]);

  // Các useEffect và hàm khác giữ nguyên
  useEffect(() => {
    const init = async () => {
      await loadUserData();
      await loadBudgets();
      await loadTransactions();
      await fetchLatestProjects();
      await loadAnalyticsSummary();
    };

    init();

    const listener = (count: number) => {
      setUnreadCount(count);
    };

    notificationEmitter.on("NEW_NOTIFICATION", listener);

    const refreshListener = () => {
      loadBudgets();
      fetchLatestProjects();
      loadAnalyticsSummary();
    };
    dataRefreshEmitter.on(FINANCIAL_DATA_UPDATED, refreshListener);

    return () => {
      notificationEmitter.off("NEW_NOTIFICATION", listener);
      dataRefreshEmitter.off(FINANCIAL_DATA_UPDATED, refreshListener);
    };
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    };

    fetchUnread();
  }, []);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  const loadUserData = useCallback(async () => {
    try {
      const userData = await refreshUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      lastLoadedAtRef.current.user = Date.now();
      setLoading(false);
    }
  }, [refreshUser]);

  const openRequiredSetupModal = (currentUser: UserResponse | null | undefined) => {
    if (!currentUser) return;
    setShowFinancialSetup(!currentUser.financialSetupCompleted);
  };

  useEffect(() => {
    if (!user) return;
    openRequiredSetupModal(user);
  }, [user?.id, user?.financialSetupCompleted]);

  const handleFinancialSetupSuccess = async () => {
    setShowFinancialSetup(false);
    const latestUser = await refreshUser();
    setUser(latestUser);
  };

  useEffect(() => {
    if (!user?.id) return;
    const init = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token && user?.id) {
        await notificationService.savePushTokenToServer(token, user.id);
      }
      try {
        await initWebSocket(user.id);
      } catch (err) {
        console.error("WebSocket init failed:", err);
      }
    };
    init();
  }, [user?.id]);

  const handleToggleNotification = async () => {
    setShowNotification(true);
    setNotificationScreenActive(true);

    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);

      const unreadIds = data
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadIds.length > 0) {
        await notificationService.markAllAsRead(unreadIds);
      }

      setUnreadCount(0);
    } catch (err) {
      console.log("error:", err);
    }
  };

  const fetchLatestProjects = useCallback(async () => {
    try {
      setLatestProjectsLoading(true);
      const response = await ProjectAPI.getAll({
        status: "ACTIVE",
      });
      const list =
        response?.success && Array.isArray(response.data)
          ? response.data
          : [];
      setLatestProjects(list.slice(0, 3));
    } catch (error) {
      console.log("Fetch latest projects error:", error);
      setLatestProjects([]);
    } finally {
      lastLoadedAtRef.current.projects = Date.now();
      setLatestProjectsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const result = await transactionApi.getTransactions({ page: 0, size: 5 });
      if (result.success && result.data) {
        setTransactions(result.data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      lastLoadedAtRef.current.transactions = Date.now();
      setTransactionsLoading(false);
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    try {
      setBudgetsLoading(true);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const result = await budgetAPI.getBudgets(month, year);
      if (result.success && result.data) {
        setBudgets(result.data.items || []);
      }
    } catch (error) {
      console.error("Failed to load budgets:", error);
    } finally {
      lastLoadedAtRef.current.budgets = Date.now();
      setBudgetsLoading(false);
    }
  }, []);

  const loadAnalyticsSummary = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const result = await analyticsAPI.getTransactionAnalytics(month, year);
      if (result.success && result.data) {
        setMonthlyTotalExpense(result.data.monthlyTotalExpense || 0);
        setMonthlyTotalIncome(result.data.monthlyTotalIncome || 0);
      }
    } catch (error) {
      console.error("Failed to load analytics summary:", error);
    } finally {
      lastLoadedAtRef.current.analytics = Date.now();
      setAnalyticsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const refreshHomeWhenFocused = async () => {
        const tasks: Promise<void>[] = [];

        if (shouldRefresh(lastLoadedAtRef.current.user)) {
          tasks.push(loadUserData());
        }
        if (shouldRefresh(lastLoadedAtRef.current.projects)) {
          tasks.push(fetchLatestProjects());
        }
        if (shouldRefresh(lastLoadedAtRef.current.budgets)) {
          tasks.push(loadBudgets());
        }
        if (shouldRefresh(lastLoadedAtRef.current.transactions)) {
          tasks.push(loadTransactions());
        }
        if (shouldRefresh(lastLoadedAtRef.current.analytics)) {
          tasks.push(loadAnalyticsSummary());
        }

        if (tasks.length === 0) return;

        await Promise.all(tasks);
        if (!active) return;
      };

      void refreshHomeWhenFocused();

      return () => {
        active = false;
      };
    }, [fetchLatestProjects, loadAnalyticsSummary, loadBudgets, loadTransactions, loadUserData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await fetchLatestProjects();
    await loadBudgets();
    await loadTransactions();
    await loadAnalyticsSummary();

    try {
      const serverNotifs = await notificationService.getNotifications();
      const serverUnread = serverNotifs.filter((n) => n.read === false).length;
      setUnreadCount(serverUnread);
    } catch {
      // Non-critical
    }

    setRefreshing(false);
  };

  const handleCreateReceiptTransaction = async (receipt: Receipt) => {
    try {
      const success = await createFromReceipt(receipt);
      if (success) {
        setCameraVisible(false);
        loadBudgets();
        loadTransactions();
        loadAnalyticsSummary();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVoiceTransaction = async (transaction: TransactionRequest) => {
    const success = await createFromVoice(transaction);
    if (success) {
      setVoiceVisible(false);
      loadBudgets();
      loadTransactions();
      loadAnalyticsSummary();
    }
  };

  const renderBudgetItem = ({ item }: { item: BudgetItem }) => {
    const categoryInfo = categoryIconMap[item.category] || categoryIconMap.OTHER;
    const progressPercent = Math.min(item.progressPercent, 100);
    const progressColor =
      item.alertLevel === 'EXCEEDED' ? '#F44336' :
        item.alertLevel === 'WARNING' ? '#FF9800' :
          item.alertLevel === 'CAUTION' ? '#FFC107' :
            '#4CAF50';

    return (
      <TouchableOpacity
        style={dynamicStyles.categoryItem}
        onPress={() => router.push('/(tabs)/budgets')}
      >
        <CircularProgress
          percentage={progressPercent}
          size={60}
          strokeWidth={4}
          color={progressColor}
        >
          <View style={[dynamicStyles.budgetIconInner, { backgroundColor: categoryInfo.color + '20' }]}>
            <Ionicons name={categoryInfo.icon as any} size={24} color={categoryInfo.color} />
          </View>
        </CircularProgress>
        <Text style={dynamicStyles.categoryName} numberOfLines={1}>
          {categoryInfo.displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTransactionItem = ({ item }: { item: TransactionResponse }) => {
    const isExpense = item.type === "EXPENSE";
    const categoryInfo = getTransactionCategoryInfo(item.category);
    const formattedAmount = `${isExpense ? "-" : "+"}${formatVND(item.amount)}`;

    return (
      <View style={dynamicStyles.transactionItem}>
        <View style={dynamicStyles.transactionLeft}>
          <View style={[dynamicStyles.transactionIcon, { backgroundColor: categoryInfo.color + '15' }]}>
            <Ionicons name={categoryInfo.icon as any} size={20} color={categoryInfo.color} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={dynamicStyles.transactionName} numberOfLines={1}>
                {item.description ? item.description : categoryInfo.displayName}
              </Text>
              {item.verified && (
                <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={dynamicStyles.transactionDate}>{item.date}</Text>
          </View>
        </View>
        <Text
          style={[dynamicStyles.transactionAmount, { color: isExpense ? '#F44336' : '#4CAF50' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {formattedAmount}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safe}>
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleTransactionsListPress = () => {
    router.push("/(transactions)/list");
  };



  // ==================== RENDER ====================
  return (
    <SafeAreaView style={dynamicStyles.safe}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <ScrollView
        style={dynamicStyles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <View style={dynamicStyles.container}>
          {/* Header row */}
          <View style={dynamicStyles.headerRow}>
            <TouchableOpacity
              style={dynamicStyles.notificationBtn}
              onPress={handleToggleNotification}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
              {unreadCount > 0 && (
                <View style={dynamicStyles.notificationBadge}>
                  <Text style={dynamicStyles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={dynamicStyles.moodContainer}>
              <Image source={moodIcon} style={dynamicStyles.moodImage} />
            </View>

            <TouchableOpacity onPress={() => router.push("/profile")}>
              <View style={dynamicStyles.avatarContainer}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={dynamicStyles.avatar} />
                ) : (
                  <View style={dynamicStyles.avatarPlaceholder}>
                    <Text style={dynamicStyles.avatarText}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Greeting + Insight */}
          <View style={dynamicStyles.greetingContainer}>
            <Text style={dynamicStyles.greeting}>
              {t("common.hi")} {user?.fullName || "User"}
            </Text>

            {currentInsightIndex !== null && allInsights[currentInsightIndex] ? (
              <Animated.View
                style={[
                  dynamicStyles.insightItem,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={dynamicStyles.insightText}>
                  {allInsights[currentInsightIndex].text}
                </Text>
              </Animated.View>
            ) : (
              <Text style={dynamicStyles.insightText} />
            )}
          </View>

          {/* Balance Card - GIỮ CỨNG MÀU HOME */}
          <ImageBackground
            source={creditCardImages[mode] || creditCardImages.light}
            style={dynamicStyles.balanceCard}
            imageStyle={{ borderRadius: 26 }} // bo góc cho ảnh
            resizeMode="cover"
          >
            <View>

              <View style={dynamicStyles.balanceHeader}>
                <Text style={dynamicStyles.balanceDate}>This month</Text>
                <Text style={dynamicStyles.balanceAmount}>
                  {formatVND(monthlyTotalIncome - monthlyTotalExpense)}
                </Text>
                <Text style={dynamicStyles.balanceLabel}>Total Balance</Text>
              </View>

              <View style={dynamicStyles.balanceSummaryRow}>
                <View style={dynamicStyles.balanceSummaryItem}>
                  <View style={dynamicStyles.summaryIconBox}>
                    <Ionicons name="arrow-down" size={16} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={dynamicStyles.summaryLabel}>Income</Text>
                    <Text style={dynamicStyles.summaryAmount}>
                      {formatVND(monthlyTotalIncome)}
                    </Text>
                  </View>
                </View>

                <View style={dynamicStyles.summaryDivider} />

                <View style={dynamicStyles.balanceSummaryItem}>
                  <View style={dynamicStyles.summaryIconBox}>
                    <Ionicons name="arrow-up" size={16} color="#DC2626" />
                  </View>
                  <View>
                    <Text style={dynamicStyles.summaryLabel}>Expense</Text>
                    <Text style={dynamicStyles.summaryAmount}>
                      {formatVND(monthlyTotalExpense)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>

          {/* Quick Feature Section */}
          <QuickFeatureSection
            onOpenCreateProject={() => setProjectTypeSelectionVisible(true)}
            onOpenClassify={() => { panelRef.current?.open(); }}
          />

          {/* Pending Suggestions & Insights */}
          <PendingSuggestionsSection />
          <InsightsPreviewSection />

          {/* Latest Projects */}
          <LatestProjectsSection
            projects={latestProjects}
            loading={latestProjectsLoading}
            onAddPress={() => setProjectTypeSelectionVisible(true)}
          />

          {/* Budgets Section */}
          <View style={dynamicStyles.section}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>Budgets</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/budgets')}>
                <Text style={dynamicStyles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {budgetsLoading ? (
              <Text style={dynamicStyles.loadingText}>{t("budget.loading_budgets")}</Text>
            ) : budgets.length > 0 ? (
              <FlatList
                data={budgets}
                renderItem={renderBudgetItem}
                keyExtractor={item => item.budgetId}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={dynamicStyles.budgetsHorizontalList}
              />
            ) : (
              <Text style={dynamicStyles.emptyText}>{t("budget.no_budgets_yet")}</Text>
            )}
          </View>

          {/* Recent Transactions */}
          <View style={[dynamicStyles.section, { marginTop: 24 }]}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={handleTransactionsListPress}>
                <Text style={dynamicStyles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {transactionsLoading ? (
              <Text style={dynamicStyles.loadingText}>Loading transactions...</Text>
            ) : transactions.length > 0 ? (
              transactions.map(item => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push({
                    pathname: "/(transactions)/detail",
                    params: { id: item.id }
                  })}
                >
                  {renderTransactionItem({ item })}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={dynamicStyles.emptyText}>No transactions yet</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modals ... giữ nguyên */}
      <NotificationListModal
        visible={showNotification}
        onClose={() => {
          setNotificationScreenActive(false);
          setShowNotification(false);
        }}
        notifications={notifications}
        loading={loadingNotification}
        onResetUnread={() => setUnreadCount(0)}
      />

      {!shouldHideBottomBar && (
        <AppBottomBar
          onCameraOpen={() => setCameraVisible(true)}
          onVoiceOpen={() => setVoiceVisible(true)}
          onFormOpen={() => setManualVisible(true)}
        />
      )}

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCaptureBill={handleCreateReceiptTransaction}
      />

      <VoiceInputModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        onCaptureVoice={handleCreateVoiceTransaction}
      />

      <AddTransactionModal
        visible={manualVisible}
        onClose={() => setManualVisible(false)}
        onSaved={() => {
          loadBudgets();
          loadTransactions();
          loadAnalyticsSummary();
        }}
      />

      <ProjectTypeSelectionModal
        visible={isProjectTypeSelectionVisible}
        onClose={() => setProjectTypeSelectionVisible(false)}
        onSelectPersonal={() => setCreateProjectVisible(true)}
        onSelectGroup={() =>
          router.push({
            pathname: "/(tabs)/project",
            params: { tab: "group" },
          })
        }
      />

      <CreateProjectModal
        visible={isCreateProjectVisible}
        onClose={() => setCreateProjectVisible(false)}
        onCreated={() => {
          fetchLatestProjects();
          loadBudgets();
          loadAnalyticsSummary();
        }}
      />

      <FinancialSetupModal
        visible={showFinancialSetup}
        mode="onboarding"
        onSuccess={handleFinancialSetupSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  avatarContainer: {
    marginLeft: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3629B7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  greetingContainer: {
    marginBottom: 16,
    paddingBottom: 4,
    minHeight: 80,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  insightItem: {
    paddingVertical: 4,
  },
  insightText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111', // Màu tím đậm
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  balanceCard: {
    backgroundColor: '#3629B7',
    borderRadius: 26,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  balanceHeader: {
    marginBottom: 22,
  },
  moodContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ebfff3',
  },
  balanceDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ebfff3',
  },
  balanceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  balanceSummaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  summaryTextContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 1,
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3629B7',
    fontWeight: '600',
  },
  budgetsHorizontalList: {
    paddingVertical: 10,
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  budgetIconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 6,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
