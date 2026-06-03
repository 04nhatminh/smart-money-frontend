import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { budgetAPI, BudgetItem } from "../../src/api/budget.api";
import { CircularProgress } from "../../src/components/CircularProgress";
import { formatVND } from "../../src/utils/formatCurrency";
import AppBottomBar from "../../src/components/AppBottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";
import { Receipt } from "../../src/types/transaction.types";

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

export default function BudgetListPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for Quick Action Modals
  const [cameraVisible, setCameraVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);

  const { createFromReceipt, createFromVoice } = useCreateTransaction();

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  };

  const handleCreateReceiptTransaction = async (receipt: Receipt) => {
    const success = await createFromReceipt(receipt);
    if (success) setCameraVisible(false);
  };

  const handleCreateVoiceTransaction = async (transaction: any) => {
    const success = await createFromVoice(transaction);
    if (success) setVoiceVisible(false);
  };

  const getAlertLevelStyle = (alertLevel: string) => {
    switch (alertLevel) {
      case 'EXCEEDED':
        return { color: '#F44336', bgColor: '#FFEBEE' };
      case 'WARNING':
        return { color: '#FF9800', bgColor: '#FFF3E0' };
      case 'CAUTION':
        return { color: '#FFC107', bgColor: '#FFFDE7' };
      default:
        return { color: '#4CAF50', bgColor: '#E8F5E9' };
    }
  };

  const renderBudgetCard = (item: BudgetItem) => {
    const categoryInfo = categoryIconMap[item.category] || categoryIconMap.OTHER;
    const progressPercent = Math.min(item.progressPercent, 100);
    const alertStyle = getAlertLevelStyle(item.alertLevel);
    const progressColor =
      item.alertLevel === 'EXCEEDED' ? '#F44336' :
      item.alertLevel === 'WARNING' ? '#FF9800' :
      item.alertLevel === 'CAUTION' ? '#FFC107' :
      '#4CAF50';

    return (
      <View key={item.budgetId} style={styles.budgetCard}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryInfo}>
            <CircularProgress
              percentage={progressPercent}
              size={80}
              strokeWidth={5}
              color={progressColor}
            >
              <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
                <Ionicons name={categoryInfo.icon as any} size={32} color={categoryInfo.color} />
              </View>
            </CircularProgress>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>{categoryInfo.displayName}</Text>
              <Text style={[styles.alertBadge, { backgroundColor: alertStyle.bgColor, color: alertStyle.color }]}>
                {item.alertLevel}
              </Text>
            </View>
          </View>
          <View style={styles.amountInfo}>
            <Text style={styles.remainingAmount}>{formatVND(item.remaining)}</Text>
            <Text style={styles.remainingLabel}>Còn lại</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Đã tiêu</Text>
              <Text style={styles.statValue}>{formatVND(item.spent)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Giới hạn</Text>
              <Text style={styles.statValue}>{formatVND(item.amountLimit)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Còn lại</Text>
              <Text style={[styles.statValue, { color: item.remaining >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatVND(item.remaining)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Sticky Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Budgets</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3629B7" />
        </View>
        <AppBottomBar
          onCameraOpen={() => setCameraVisible(true)}
          onVoiceOpen={() => setVoiceVisible(true)}
          onFormOpen={() => setManualVisible(true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budgets</Text>
        <View style={{ width: 40 }} />
      </View>

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
        <View style={styles.content}>
          {budgets.length > 0 ? (
            <>
              {budgets.map((budget) => renderBudgetCard(budget))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>No budgets yet</Text>
              <Text style={styles.emptySubText}>Create your first budget to get started</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* App Bottom Bar */}
      <AppBottomBar
        onCameraOpen={() => setCameraVisible(true)}
        onVoiceOpen={() => setVoiceVisible(true)}
        onFormOpen={() => setManualVisible(true)}
      />

      {/* Modals for App Bottom Bar Quick Actions */}
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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 100, // extra spacing so last item isn't covered by BottomBar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryDetails: {
    flex: 1,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  alertBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  remainingLabel: {
    fontSize: 12,
    color: '#999',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

