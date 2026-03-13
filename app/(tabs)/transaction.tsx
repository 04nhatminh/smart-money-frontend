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
import { BottomBar } from "../../src/components/BottomBar";
import { CameraModal } from "../../src/components/camera/CameraModal";
import { Receipt } from "../../src/components/camera/ReceiptPreview";
import { useTabNavigation } from "../../src/hooks/useTabNavigation";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { t } from "../../src/i18n";
import transactionApi, {
  CreateTransactionRequest,
  GetTransactionsParams,
} from "../../src/api/transaction.api";
import { FilterModal, TransactionFilter } from "../../src/components/transaction/FilterModal";
import { TransactionItem, Transaction } from "../../src/components/transaction/TransactionItem";

const parseReceiptDate = (input: string): string => {
  // Input format: "28/02/2026"
  // Expected backend format: "dd/MM/yyyy HH:mm"
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());

  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    // Format as "dd/MM/yyyy HH:mm" with 00:00 as default time
    return `${day}/${month}/${year} 00:00`;
  }

  // Fallback: return today's date
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const mapReceiptToPayload = (receipt: Receipt): CreateTransactionRequest => {
  console.log("🔄 mapReceiptToPayload called with:", receipt);
  const transactionType =
    receipt.type === "Income" ? ("INCOME" as const) : ("EXPENSE" as const);
  const payload: CreateTransactionRequest = {
    amount: receipt.amount,
    type: transactionType,
    category: receipt.category.toUpperCase(),
    description: receipt.description?.trim() || receipt.transactionName,
    date: parseReceiptDate(receipt.date),
  };
  console.log("✅ Payload mapped:", payload);
  return payload;
};

// Mock data for demonstration
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    name: "Buy items",
    category: "food",
    amount: 200000,
    type: "EXPENSE",
    date: "2026-03-14",
    verified: false,
  },
  {
    id: "2",
    name: "Salary Jan",
    category: "other",
    amount: 12000000,
    type: "INCOME",
    date: "2026-03-13",
    verified: true,
  },
  {
    id: "3",
    name: "Taxi ride",
    category: "transportation",
    amount: 150000,
    type: "EXPENSE",
    date: "2026-03-14",
    verified: true,
  },
  {
    id: "4",
    name: "Dinner",
    category: "food",
    amount: 350000,
    type: "EXPENSE",
    date: "2026-03-12",
    verified: false,
  },
  {
    id: "5",
    name: "Freelance work",
    category: "other",
    amount: 5000000,
    type: "INCOME",
    date: "2026-03-10",
    verified: true,
  },
];

interface TransactionSection {
  title: string;
  data: Transaction[];
}

export default function TransactionListScreen() {
  const { theme } = useThemeMode();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TransactionFilter>({
    type: "all",
    categories: [],
    dateRange: "all_time",
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(30);

  const navigation = useTabNavigation(() => setCameraVisible(true));

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
        const categoryMap: Record<string, string> = {
          food: "FOOD",
          transportation: "TRANSPORTATION",
          clothing: "CLOTHING",
          utilities: "UTILITIES",
          entertainment: "ENTERTAINMENT",
          health: "HEALTH",
          education: "EDUCATION",
          other: "OTHER",
        };
        params.category = categoryMap[filters.categories[0]];
      }

      // Add date range filters (skip if all_time)
      if (filters.dateRange !== "all_time") {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const formatDate = (date: Date) => {
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${day}/${month}/${year} ${hours}:${minutes}`;
        };

        if (filters.dateRange === "yesterday") {
          const yesterday = new Date(startOfDay);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayEnd = new Date(yesterday);
          yesterdayEnd.setHours(23, 59, 59, 999);
          params.startDate = formatDate(yesterday);
          params.endDate = formatDate(yesterdayEnd);
        } else if (filters.dateRange === "this_week") {
          const startOfWeek = new Date(startOfDay);
          startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
          params.startDate = formatDate(startOfWeek);
          params.endDate = formatDate(endOfDay);
        } else if (filters.dateRange === "this_month") {
          const startOfMonth = new Date(startOfDay);
          startOfMonth.setDate(1);
          params.startDate = formatDate(startOfMonth);
          params.endDate = formatDate(endOfDay);
        } else if (filters.dateRange === "custom") {
          if (filters.customStartDate) {
            params.startDate = `${filters.customStartDate} 00:00`;
          }
          if (filters.customEndDate) {
            params.endDate = `${filters.customEndDate} 23:59`;
          }
        } else if (filters.dateRange === "today") {
          // Today filter
          params.startDate = formatDate(startOfDay);
          params.endDate = formatDate(endOfDay);
        }
      }

      const result = await transactionApi.getTransactions(params);

      if (result.success && result.data) {
        // Map API response to Transaction type
        const mappedTransactions: Transaction[] = result.data.transactions.map(
          (tx) => ({
            id: tx.id,
            name: tx.description,
            category: tx.category.toLowerCase(),
            amount: tx.amount,
            type: tx.type,
            date: tx.date.split(" ")[0], // Extract date part only
            verified: true, // Assume API transactions are verified
          })
        );
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

  const handleCreateTransaction = async (receipt: Receipt) => {
    console.log("🚀 handleCreateTransaction called");
    setIsCreatingTransaction(true);

    try {
      const payload = mapReceiptToPayload(receipt);
      console.log(
        "📤 Creating transaction with payload:",
        JSON.stringify(payload, null, 2)
      );

      const result = await transactionApi.createTransaction(payload);
      console.log("📥 API Response:", result);

      if (!result.success) {
        const errorMsg = result.message || "Tao giao dich that bai";
        console.error("❌ Transaction creation failed:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("✅ Transaction created successfully:", result.data);
      Alert.alert("Success", "Transaction created successfully");
    } catch (error: any) {
      const message = error?.message || "Failed to create transaction";
      console.error("❌ Error in handleCreateTransaction:", error);
      Alert.alert("Error", message);
      throw error;
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  // Filter transactions by search query (since API already filters by date/type/category)
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return transactions;
    }
    return transactions.filter((transaction) => {
      const query = searchQuery.toLowerCase();
      return transaction.name.toLowerCase().includes(query);
    });
  }, [transactions, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sections: TransactionSection[] = [];

    const grouped: Record<string, Transaction[]> = {};

    filteredTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
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
            <TransactionItem transaction={item} onPress={() => {}} />
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
      <BottomBar active="transaction" handlers={navigation} />

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
        onCaptureBill={handleCreateTransaction}
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
