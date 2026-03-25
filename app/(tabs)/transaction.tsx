import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  Pressable,
  ScrollView,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppBottomBar from "../../src/components/AppBottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import { TransactionDetailModal } from "../../src/components/transactions/TransactionDetailModal";
import { EditTransactionModal } from "../../src/components/transactions/EditTransactionModal";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { t } from "../../src/i18n";
import transactionApi from "../../src/api/transaction.api";
import {
  TransactionRequest,
  GetTransactionsParams,
  Receipt
} from "../../src/types/transaction.types";
import { FilterModal } from "../../src/components/transactions/FilterModal";
import { TransactionItem } from "../../src/components/transactions/TransactionItem";
import { TransactionFilter, TransactionResponse } from "../../src/types/transaction.types";
import { CATEGORY_ENUM_MAP } from "../../src/constants/categories";
import { formatDateTime, parseDDMMYYYYHHMM } from "../../src/utils/dateFormatter";

interface TransactionSection {
  title: string;
  data: TransactionResponse[];
}

export default function TransactionListScreen() {
  const { theme } = useThemeMode();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TransactionFilter>({
    type: "all",
    categories: [],
    dateRange: "all_time",
  });
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(30);

  const { createFromReceipt, createFromVoice } = useCreateTransaction();

  // Fetch transactions whenever filters change
  useEffect(() => {
    fetchTransactions();
  }, [filters, currentPage]);

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const params: GetTransactionsParams = {
        page: currentPage,
        size: pageSize,
      };

      // Add type filter
      if (filters.type !== "all") {
        params.type = filters.type === "expense" ? "EXPENSE" : "INCOME";
      }

      // Add category filter (convert first category if exists)
      if (filters.categories.length > 0) {
        params.category = CATEGORY_ENUM_MAP[filters.categories[0]];
      }

      // Add date range filters (skip if all_time)
      if (filters.dateRange !== "all_time") {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // const formatDate = (date: Date) => {
        //   const day = String(date.getDate()).padStart(2, "0");
        //   const month = String(date.getMonth() + 1).padStart(2, "0");
        //   const year = date.getFullYear();
        //   const hours = String(date.getHours()).padStart(2, "0");
        //   const minutes = String(date.getMinutes()).padStart(2, "0");
        //   return `${day}/${month}/${year} ${hours}:${minutes}`;
        // };

        if (filters.dateRange === "yesterday") {
          const yesterday = new Date(startOfDay);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayEnd = new Date(yesterday);
          yesterdayEnd.setHours(23, 59, 59, 999);
          params.startDate = formatDateTime(yesterday);
          params.endDate = formatDateTime(yesterdayEnd);
        } else if (filters.dateRange === "this_week") {
          const startOfWeek = new Date(startOfDay);
          startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
          params.startDate = formatDateTime(startOfWeek);
          params.endDate = formatDateTime(endOfDay);
        } else if (filters.dateRange === "this_month") {
          const startOfMonth = new Date(startOfDay);
          startOfMonth.setDate(1);
          params.startDate = formatDateTime(startOfMonth);
          params.endDate = formatDateTime(endOfDay);
        } else if (filters.dateRange === "custom") {
          if (filters.customStartDate) {
            params.startDate = `${filters.customStartDate} 00:00`;
          }
          if (filters.customEndDate) {
            params.endDate = `${filters.customEndDate} 23:59`;
          }
        } else if (filters.dateRange === "today") {
          // Today filter
          params.startDate = formatDateTime(startOfDay);
          params.endDate = formatDateTime(endOfDay);
        }
      }

      const result = await transactionApi.getTransactions(params);

      console.log("📥 API Response for getTransactions:", result);

      if (result.success && result.data) {
        const apiTransactions = result.data.transactions || [];

        // Map API response to Transaction type
        const mappedTransactions = apiTransactions.map((item) => ({
          id: item.id,
          amount: item.amount,
          type: item.type,
          category: item.category,
          description: item.description,
          date: item.date,
        }));
        console.log("✅ Mapped transactions:", mappedTransactions);
        setTransactions(mappedTransactions);
      } else {
        console.error("Failed to fetch transactions:", result.message);
        Alert.alert("Error", result.message || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert("Error", "Failed to fetch transactions");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  console.log("📥 Fetched transactions:", transactions);

  const handleCreateReceiptTransaction = async (receipt: Receipt) => {
    try {
      await createFromReceipt(receipt);
      setCameraVisible(false);
    }
    catch (error) {
      console.error("Error creating transaction from receipt:", error);
    }
  };

  const handleCreateVoiceTransaction = async (transaction: TransactionRequest) => {
    try {
      await createFromVoice(transaction);
      setVoiceVisible(false);
    }
    catch (error) {
      console.error("Error creating transaction from voice:", error);
    }
  };

  // Filter transactions by search query (since API already filters by date/type/category)
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return transactions;
    }
    return transactions.filter((transaction) => {
      const query = searchQuery.toLowerCase();
      console.log(transaction.description);
      return transaction.description?.toLowerCase().includes(query);
    });
  }, [transactions, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sections: TransactionSection[] = [];

    const grouped: Record<string, TransactionResponse[]> = {};

    filteredTransactions.forEach((transaction) => {
      const transactionDate = parseDDMMYYYYHHMM(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);

      let key = "other";

      if (transactionDate.getTime() === today.getTime()) {
        key = "today";
      } else if (transactionDate.getTime() === yesterday.getTime()) {
        key = "yesterday";
      } else {
        const daysAgo = Math.floor(
          (today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysAgo <= 7) {
          key = "this_week";
        } else if (daysAgo <= 30) {
          key = "this_month";
        } else {
          key = transactionDate.toLocaleDateString();
        }
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(transaction);
    });

    // Build sections in order
    const order = ["today", "yesterday", "this_week", "this_month"];
    order.forEach((key) => {
      if (grouped[key]) {
        sections.push({
          title:
            key === "today"
              ? t("transaction.today")
              : key === "yesterday"
                ? t("transaction.yesterday")
                : key === "this_week"
                  ? t("transaction.this_week")
                  : t("transaction.this_month"),
          data: grouped[key],
        });
      }
    });

    // Add remaining dates
    Object.keys(grouped).forEach((key) => {
      if (!order.includes(key)) {
        sections.push({
          title: key,
          data: grouped[key],
        });
      }
    });

    return sections;
  }, [filteredTransactions]);

  const handleApplyFilters = (newFilters: TransactionFilter) => {
    setFilters(newFilters);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("transaction.transactions")}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={theme.subtext}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder={t("transaction.search_transactions")}
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={[
              styles.filterButton,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons name="funnel" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Transactions List */}
      {isLoadingTransactions ? (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.bg },
          ]}
        >
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            {t("camera.loading")}
          </Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.bg }]}>
          <Ionicons
            name="wallet-outline"
            size={64}
            color={theme.subtext}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {t("transaction.no_transactions")}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupedTransactions}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => {
                setSelectedTransactionId(item.id);
                setDetailVisible(true);
              }}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={[
                styles.sectionHeader,
                { color: theme.subtext, backgroundColor: theme.bg },
              ]}
            >
              {title}
            </Text>
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Bar */}
      <AppBottomBar
        onCameraOpen={() => setCameraVisible(true)}
        onVoiceOpen={() => setVoiceVisible(true)}
        onFormOpen={() => setManualVisible(true)}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />

      {/* Camera Modal */}
      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCaptureBill={handleCreateReceiptTransaction}
      />

      {/* Voice Modal */}
      <VoiceInputModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        onCaptureVoice={handleCreateVoiceTransaction}
      />

      {/* Manual Entry Modal */}
      <AddTransactionModal
        visible={manualVisible}
        onClose={() => setManualVisible(false)}
      />
      <TransactionDetailModal
        visible={detailVisible}
        transactionId={selectedTransactionId}
        onClose={() => {
          setDetailVisible(false);
          setSelectedTransactionId(null);
        }}
        onEdit={(transaction) => {
          setDetailVisible(false);
          setEditVisible(true);
          setSelectedTransactionId(transaction.id);
          console.log("edit transaction", transaction.id);
        }}
        onDeleted={() => {
          setDetailVisible(false);
          setSelectedTransactionId(null);
        }}
      />

      <EditTransactionModal
        visible={editVisible}
        transactionId={selectedTransactionId}
        onClose={() => {
          setEditVisible(false);
        }}
        onSaved={() => {
          setEditVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
});
