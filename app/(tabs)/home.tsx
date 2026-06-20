import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl,
  Alert
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { notificationStorage } from "../../src/storage/notificationStorage";
import { UserResponse } from "../../src/types/auth.types";
import notificationService from "../../src/notification/notificationService";
import { Notification } from "../../src/types/notification.type";
import { setNotificationScreenActive } from "../../src/notification/notificationHandler";
import { registerForPushNotificationsAsync } from "../../src/notification/registerForPushNotificationsAsync";
import { NotificationListModal } from "../../src/components/notification/NotificationListModal";
import { initWebSocket, disconnectWebSocket } from "../../src/services/websocket";
import AppBottomBar from "../../src/components/AppBottomBar";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import AIInsightList from "../../src/components/assistant/AIInsightList";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { TransactionRequest, Receipt, TransactionResponse } from "../../src/types/transaction.types";
import { useRouter } from "expo-router";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";
import { useAIInsight } from "../../src/hooks/useAIInsight";
import QuickFeatureSection from "../../src/components/home/QuickFeatureSection";
import CreateProjectModal from "../../src/components/projects/CreateProjectModal";
import LatestProjectsSection, { LatestProjectItem } from "../../src/components/home/LatestProjectsSection";
import SetupIncomeModal from "../../src/components/home/SetupIncomeModal";
import SetupFinancialProfileModal from "../../src/components/home/SetupFinancialProfileModal";
import { ProjectAPI } from "../../src/api/project.api";
import { notificationEmitter } from "../../src/utils/notificationEmitter";
import { panelRef } from "../_layout";
import { budgetAPI, BudgetItem } from "../../src/api/budget.api";
import transactionApi from "../../src/api/transaction.api";
import { CircularProgress } from "../../src/components/CircularProgress";
import { formatVND } from "../../src/utils/formatCurrency";
import { useAuth } from "../../src/context/AuthContext";
import { BudgetAllocationApi } from "../../src/api/budgetAllocation.api";
import { GenerateBudgetAllocationPayload } from "../../src/types/budget_allocation.types";
import analyticsAPI from "../../src/api/transaction_analytics.api";

// Category icon mapping
const categoryIconMap: { [key: string]: { icon: string; color: string; displayName: string } } = {
  FOOD: { icon: 'restaurant', color: '#FF9800', displayName: 'Food' },
  TRANSPORTATION: { icon: 'car', color: '#2196F3', displayName: 'Transport' },
  CLOTHING: { icon: 'shirt', color: '#E91E63', displayName: 'Clothing' },
  UTILITIES: { icon: 'flash', color: '#FFC107', displayName: 'Utilities' },
  ENTERTAINMENT: { icon: 'film', color: '#9C27B0', displayName: 'Entertainment' },
  HEALTH: { icon: 'heart', color: '#F44336', displayName: 'Health' },
  EDUCATION: { icon: 'book', color: '#3629B7', displayName: 'Education' },
  SHOPPING: { icon: 'bag', color: '#4CAF50', displayName: 'Shopping' },
  OTHER: { icon: 'more', color: '#757575', displayName: 'Other' },
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

export default function HomePage() {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [cameraVisible, setCameraVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [isCreateProjectVisible, setCreateProjectVisible] = useState(false);
  const [showSetupIncome, setShowSetupIncome] = useState(false);
  const [showSetupFinancial, setShowSetupFinancial] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const { insight, loading: insightLoading, reload } = useAIInsight();
  const [unreadCount, setUnreadCount] = useState(0);

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


  useEffect(() => {
    const init = async () => {
      await loadUserData();
      await loadBudgets();
      await loadTransactions();
      await fetchLatestProjects();
      await loadAnalyticsSummary();

      const saved = await notificationStorage.getUnreadCount();
      setUnreadCount(saved);
    };

    init();

    // realtime listener
    const listener = (count: number) => {
      setUnreadCount(count);
    };

    notificationEmitter.on("NEW_NOTIFICATION", listener);

    return () => {
      notificationEmitter.off("NEW_NOTIFICATION", listener);
    };
  }, []);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  const loadUserData = async () => {
    try {
      const userData = await refreshUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openRequiredSetupModal = (currentUser: UserResponse | null | undefined) => {
    setShowSetupIncome(false);
    setShowSetupFinancial(false);

    if (!currentUser) return;
    if (currentUser.onboardingCompleted) return;

    if (!currentUser.incomeSetupCompleted) {
      setShowSetupIncome(true);
      return;
    }

    if (!currentUser.financialSetupCompleted) {
      setShowSetupFinancial(true);
    }
  };

  useEffect(() => {
    if (!user) return;

    openRequiredSetupModal(user);
  }, [
    user?.id,
    user?.incomeSetupCompleted,
    user?.financialSetupCompleted,
    user?.onboardingCompleted,
  ]);

  const handleIncomeSetupSuccess = async () => {
    setShowSetupIncome(false);

    const latestUser = await refreshUser();
    setUser(latestUser);

    if (latestUser && !latestUser.financialSetupCompleted) {
      setShowSetupFinancial(true);
    }
  };

  const handleFinancialSetupSubmit = async (
    payload: GenerateBudgetAllocationPayload
  ) => {
    try {
      const response = await BudgetAllocationApi.createUserFinancialProfile(payload);

      if (!response.success) {
        Alert.alert("Error", response.message || "Failed to create financial profile");
        return;
      }

      setShowSetupFinancial(false);
      const latestUser = await refreshUser();
      setUser(latestUser);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create financial profile");
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const init = async () => {
      const token = await registerForPushNotificationsAsync();
      console.log("🔥 PUSH TOKEN:", token);

      if (token && user?.id) {
        await notificationService.savePushTokenToServer(token, user.id);
      }

      await initWebSocket(user.id);
    };

    init().catch((err) => console.error("❌ WebSocket init failed:", err));

    return () => {
      isMounted = false;
      // ❌ DO NOT disconnect here if the app is still utilizing WS globally
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    try {
      setLoadingNotification(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.log("Load notification error:", err);
    } finally {
      setLoadingNotification(false);
    }
  };

  const handleToggleNotification = async () => {
    setShowNotification(true);
    setNotificationScreenActive(true);
    setUnreadCount(0);
    await notificationStorage.setUnreadCount(0);
    await loadNotifications();
  };

  const fetchLatestProjects = async () => {
    try {
      setLatestProjectsLoading(true);
      const response = await ProjectAPI.getAll();
      const list = (response.success && Array.isArray(response.data)) ? response.data : [];
      const latest = list.slice(0, 3);
      setLatestProjects(latest);
    } catch (error) {
      console.log('Fetch latest projects error:', error);
    } finally {
      setLatestProjectsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const result = await transactionApi.getTransactions({ page: 0, size: 5 });
      if (result.success && result.data) {
        setTransactions(result.data.transactions || []);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadBudgets = async () => {
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
      setBudgetsLoading(false);
    }
  };

  const loadAnalyticsSummary = async () => {
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
      setAnalyticsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await fetchLatestProjects();
    await loadBudgets();
    await loadTransactions();
    await loadAnalyticsSummary();
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
        style={styles.categoryItem}
        onPress={() => router.push('/(tabs)/budgets')}
      >
        <CircularProgress
          percentage={progressPercent}
          size={60}
          strokeWidth={4}
          color={progressColor}
        >
          <View style={[styles.budgetIconInner, { width: 44, height: 44, borderRadius: 22, backgroundColor: categoryInfo.color + '20' }]}>
            <Ionicons name={categoryInfo.icon as any} size={24} color={categoryInfo.color} />
          </View>
        </CircularProgress>

        <Text style={styles.categoryName} numberOfLines={1}>
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
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: categoryInfo.color + '15' }]}>
            <Ionicons name={categoryInfo.icon as any} size={20} color={categoryInfo.color} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.transactionName} numberOfLines={1}>
                {item.description ? item.description : categoryInfo.displayName}
              </Text>
              {item.verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color="#10B981"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: isExpense ? '#F44336' : '#4CAF50' }]}>
          {formattedAmount}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleTransactionsListPress = () => {
    router.push("/(transactions)/list");
  };

  console.log("Insight: ", insight);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3629B7']}
            tintColor="#3629B7"
          />
        }
      >
        <View style={styles.container}>
          {/* Header with Avatar and Greeting */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <TouchableOpacity
                onPress={() => router.push("/profile")}
              >
                <View style={styles.avatarContainer}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {user?.fullName?.charAt(0) || 'U'}
                      </Text>
                    </View>
                  )}
                </View>

              </TouchableOpacity>

              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={handleToggleNotification}
            >
              <Ionicons name="notifications-outline" size={24} color="#333" />

              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : (
              <Ionicons name="options-outline" size={20} color="#999" />
            )}
          </View>

          {/* Balance Card - Combined Detail Format */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceDate}>This month</Text>
              <Text style={styles.balanceAmount}>{formatVND(monthlyTotalIncome - monthlyTotalExpense)}</Text>
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>

            <View style={styles.balanceSummaryRow}>
              <View style={styles.balanceSummaryItem}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="arrow-down" size={16} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Income</Text>
                  <Text style={styles.summaryAmount}>{formatVND(monthlyTotalIncome)}</Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.balanceSummaryItem}>
                <View style={styles.summaryIconBox}>
                  <Ionicons name="arrow-up" size={16} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>Expense</Text>
                  <Text style={styles.summaryAmount}>{formatVND(monthlyTotalExpense)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Feature Section */}
          <QuickFeatureSection
            onOpenCreateProject={() => setCreateProjectVisible(true)}
            onOpenClassify={() => { panelRef.current?.open(); }}
          />

          {/* Latest Projects */}
          <LatestProjectsSection
            projects={latestProjects}
            loading={latestProjectsLoading}
            onAddPress={() => setCreateProjectVisible(true)}
          />

          {/* Budgets Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Budgets</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/budgets')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {budgetsLoading ? (
              <Text style={styles.loadingText}>Loading budgets...</Text>
            ) : budgets.length > 0 ? (
              <FlatList
                data={budgets}
                renderItem={renderBudgetItem}
                keyExtractor={item => item.budgetId}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.budgetsHorizontalList}
              />
            ) : (
              <Text style={styles.emptyText}>No budgets yet</Text>
            )}
          </View>

          {/* Recent Transactions */}
          <View style={[styles.section, { marginTop: 24 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={handleTransactionsListPress}>
                <Text style={styles.seeAllText}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {transactionsLoading ? (
              <Text style={styles.loadingText}>Loading transactions...</Text>
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
              <Text style={styles.emptyText}>No transactions yet</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {insight.length > 0 && (
        <AIInsightList insights={insight || []} />
      )}

      <NotificationListModal
        visible={showNotification}
        onClose={() => {
          setNotificationScreenActive(false);
          setShowNotification(false);
        }}
        notifications={notifications}
        loading={loadingNotification}
        onResetUnread={() => {
          setUnreadCount(0);
          notificationStorage.setUnreadCount(0);
        }}
      />

      <AppBottomBar
        onCameraOpen={() => setCameraVisible(true)}
        onVoiceOpen={() => setVoiceVisible(true)}
        onFormOpen={() => setManualVisible(true)}
      />

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

      <CreateProjectModal
        visible={isCreateProjectVisible}
        onClose={() => setCreateProjectVisible(false)}
      />

      <SetupIncomeModal
        visible={showSetupIncome}
        onClose={() => setShowSetupIncome(false)}
        onSuccess={handleIncomeSetupSuccess}
      />

      <SetupFinancialProfileModal
        visible={showSetupFinancial}
        onClose={() => setShowSetupFinancial(false)}
        onSubmit={handleFinancialSetupSubmit}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 16
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
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
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
