import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  StatusBar,
} from "react-native";

import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryPie,
  VictoryTheme,
  VictoryTooltip,
} from "victory-native";

import { http } from "../../src/api/http";
import AppBottomBar from "../../src/components/AppBottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import { TransactionRequest, Receipt } from "../../src/types/transaction.types";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";
import { useLanguage } from "../../src/i18n/LanguageProvider";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────
type MonthlyStat = {
  week: string;
  income: number;
  expense: number;
};

type CategoryProportion = {
  category: string;
  count: number;
  percentage: number;
};

type AnalyticsResponseData = {
  monthlyStats: MonthlyStat[];
  categoryProportions: CategoryProportion[];
};

type AnalyticsResponse = {
  data: AnalyticsResponseData;
  message: string;
  success: boolean;
};

type MonthOption = {
  label: string;
  shortLabel: string;
  month: number;
  year: number;
};

// ─────────────────────────────────────────────────
// Category Color Mapping (matching Budget page)
// ─────────────────────────────────────────────────
const CATEGORY_COLOR_MAP: Record<string, string> = {
  FOOD: "#FF9800",
  TRANSPORTATION: "#2196F3",
  CLOTHING: "#E91E63",
  UTILITIES: "#FFC107",
  ENTERTAINMENT: "#9C27B0",
  HEALTH: "#F44336",
  EDUCATION: "#3629B7",
  SHOPPING: "#4CAF50",
  SALARY: "#4CAF50",
  BONUS: "#00E676",
  INVESTMENT: "#00B0FF",
  GIFT: "#FF3D00",
  OTHER: "#757575",
};

const FALLBACK_COLORS = [
  "#3629B7", "#6D6ACF", "#A5A3F5", "#10B981",
  "#F59E0B", "#EC4899", "#06B6D4", "#EF4444",
];

function getCategoryColor(categoryName: string, index: number): string {
  const key = (categoryName || "").toUpperCase().trim();
  if (CATEGORY_COLOR_MAP[key]) {
    return CATEGORY_COLOR_MAP[key];
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// ─────────────────────────────────────────────────
// Language Labels & Month Names
// ─────────────────────────────────────────────────
const MONTH_NAMES_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

const MONTH_SHORTS_VI = [
  "T1", "T2", "T3", "T4", "T5", "T6",
  "T7", "T8", "T9", "T10", "T11", "T12",
];

const MONTH_SHORTS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────
async function getTransactionAnalytics(
  month: number,
  year: number
): Promise<AnalyticsResponse> {
  try {
    const res = await http.post(
      "/api/v1/transactions/analytics",
      { month, year },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    return {
      success: res.data.success,
      message: res.data.message,
      data: res.data.data,
    };
  } catch (error: any) {
    console.error("ANALYTICS ERROR:", error);
    return error.response?.data || {
      success: false,
      message: error.message || "Fetch analytics failed",
      data: { monthlyStats: [], categoryProportions: [] },
    };
  }
}

function getPreviousTwelveMonths(isVi: boolean): MonthOption[] {
  const now = new Date();
  const names = isVi ? MONTH_NAMES_VI : MONTH_NAMES_EN;
  const shorts = isVi ? MONTH_SHORTS_VI : MONTH_SHORTS_EN;

  return Array.from({ length: 12 }, (_, i) => {
    const offset = 11 - i;
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const m = date.getMonth();
    return {
      label: names[m],
      shortLabel: shorts[m],
      month: m + 1,
      year: date.getFullYear(),
    };
  });
}

function formatVND(value: number, isVi: boolean): string {
  if (!value || value === 0) return "0";
  const abs = Math.abs(value);
  const suffixB = isVi ? "Tỷ" : "B";
  const suffixM = isVi ? "tr" : "M";
  const suffixK = isVi ? "k" : "K";

  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}${suffixB}`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}${suffixM}`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}${suffixK}`;
  return `${value}`;
}

// ─────────────────────────────────────────────────
// Compact KPI Card Component
// ─────────────────────────────────────────────────
type KPICardProps = {
  cardWidth: number;
  label: string;
  value: string;
  accentColor: string;
  icon: string;
  subtext?: string;
  subtextColor?: string;
};

function KPICard({ cardWidth, label, value, accentColor, icon, subtext, subtextColor }: KPICardProps) {
  return (
    <View style={[styles.kpiCard, { width: cardWidth, borderLeftColor: accentColor }]}>
      <View style={styles.kpiTop}>
        <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
        <View style={[styles.kpiIconBox, { backgroundColor: accentColor + "22" }]}>
          <Text style={[styles.kpiIcon, { color: accentColor }]}>{icon}</Text>
        </View>
      </View>
      <Text style={[styles.kpiValue, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {!!subtext && (
        <Text style={[styles.kpiSubtext, { color: subtextColor ?? "#94A3B8" }]} numberOfLines={1}>
          {subtext}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────
// Month Picker Strip
// ─────────────────────────────────────────────────
type MonthPickerProps = {
  options: MonthOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

function MonthPickerStrip({ options, selectedIndex, onSelect }: MonthPickerProps) {
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: Math.max(0, selectedIndex - 2) * 64,
        animated: false,
      });
    }, 100);
  }, [selectedIndex]);

  return (
    <View style={styles.stripWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
      >
        {options.map((opt, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <TouchableOpacity
              key={`${opt.month}-${opt.year}`}
              style={[styles.stripItem, isSelected && styles.stripItemActive]}
              onPress={() => onSelect(idx)}
              activeOpacity={0.75}
            >
              <Text style={[styles.stripMonth, isSelected && styles.stripTextActive]}>
                {opt.shortLabel}
              </Text>
              <Text style={[styles.stripYear, isSelected && styles.stripYearActive]}>
                {opt.year}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { lang } = useLanguage();
  const isVi = lang === "vi";

  const [cameraVisible, setCameraVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const { createFromReceipt, createFromVoice } = useCreateTransaction();

  const handleCreateReceiptTransaction = async (receipt: Receipt) => {
    try {
      await createFromReceipt(receipt);
      setCameraVisible(false);
    } catch (err) {
      console.error(err);
    }
  };
  const handleCreateVoiceTransaction = async (transaction: TransactionRequest) => {
    const success = await createFromVoice(transaction);
    if (success) setVoiceVisible(false);
  };

  const { width } = useWindowDimensions();
  const chartWidth = width - 64; // Account for section margin (40) and padding (24)
  const pieSize = Math.min(180, width * 0.42);
  const pieCanvasWidth = pieSize + 40;
  const pieCanvasHeight = pieSize + 48;
  const kpiCardWidth = (width - 40 - 10) / 2; // Exact 2 cards per row

  const monthOptions = useMemo(() => getPreviousTwelveMonths(isVi), [isVi]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(monthOptions.length - 1);
  const selectedMonth = monthOptions[selectedMonthIndex];

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [categoryProportions, setCategoryProportions] = useState<CategoryProportion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── KPI derived values ──
  const kpis = useMemo(() => {
    const totalIncome = monthlyStats.reduce((s, m) => s + (Number(m.income) || 0), 0);
    const totalExpense = monthlyStats.reduce((s, m) => s + (Number(m.expense) || 0), 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, netSavings, savingsRate };
  }, [monthlyStats]);

  // Max value in chart for scaling & 0-data fix
  const maxChartValue = useMemo(() => {
    const vals = monthlyStats.flatMap(m => [Number(m.income) || 0, Number(m.expense) || 0]);
    return Math.max(...vals, 0);
  }, [monthlyStats]);

  const categoryWithAmount = useMemo(() => {
    return categoryProportions.map((cat, idx) => ({
      ...cat,
      color: getCategoryColor(cat.category, idx),
      estimatedExpense: kpis.totalExpense * (cat.percentage / 100),
    }));
  }, [categoryProportions, kpis.totalExpense]);

  const fetchAnalytics = async (month: number, year: number) => {
    try {
      setLoading(true);
      setError("");
      const response = await getTransactionAnalytics(month, year);
      if (!response.success) throw new Error(response.message);
      setMonthlyStats(response.data.monthlyStats);
      setCategoryProportions(response.data.categoryProportions);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isVi ? "Có lỗi xảy ra khi tải dữ liệu" : "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedMonth.month, selectedMonth.year);
  }, []);

  const handleSelectMonth = (index: number) => {
    setSelectedMonthIndex(index);
    fetchAnalytics(monthOptions[index].month, monthOptions[index].year);
  };

  // Chart data
  const incomeData = useMemo(
    () =>
      monthlyStats.map((item) => ({
        week: `W${item.week}`,
        value: Number(item.income) || 0,
        label: `${isVi ? "Tuần" : "Week"} ${item.week}\n${isVi ? "Thu" : "Inc"}: ${formatVND(Number(item.income), isVi)}`,
      })),
    [monthlyStats, isVi]
  );

  const expenseData = useMemo(
    () =>
      monthlyStats.map((item) => ({
        week: `W${item.week}`,
        value: Number(item.expense) || 0,
        label: `${isVi ? "Tuần" : "Week"} ${item.week}\n${isVi ? "Chi" : "Exp"}: ${formatVND(Number(item.expense), isVi)}`,
      })),
    [monthlyStats, isVi]
  );

  const pieData = useMemo(
    () =>
      categoryProportions.map((item) => ({
        x: item.category,
        y: Number(item.count) || 0,
        label: `${item.category}\n${item.count} ${isVi ? "GD" : "tx"} (${item.percentage.toFixed(1)}%)`,
      })),
    [categoryProportions, isVi]
  );

  const pieColors = useMemo(
    () => categoryProportions.map((item, idx) => getCategoryColor(item.category, idx)),
    [categoryProportions]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {isVi ? "Phân Tích Thống Kê" : "Financial Analytics"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {selectedMonth.label} {isVi ? "năm" : ""} {selectedMonth.year}
          </Text>
        </View>

        {/* Month Picker Strip */}
        <MonthPickerStrip
          options={monthOptions}
          selectedIndex={selectedMonthIndex}
          onSelect={handleSelectMonth}
        />

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3629B7" />
          </View>
        )}

        {/* Error */}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* Compact KPI Cards (2x2 Grid) */}
        {!loading && monthlyStats.length > 0 && (
          <View style={styles.kpiGrid}>
            <KPICard
              cardWidth={kpiCardWidth}
              label={isVi ? "Tổng Thu" : "Total Income"}
              value={formatVND(kpis.totalIncome, isVi)}
              accentColor="#10B981"
              icon="↑"
              subtext={isVi ? "Trong tháng" : "This month"}
            />
            <KPICard
              cardWidth={kpiCardWidth}
              label={isVi ? "Tổng Chi" : "Total Expense"}
              value={formatVND(kpis.totalExpense, isVi)}
              accentColor="#EF4444"
              icon="↓"
              subtext={isVi ? "Trong tháng" : "This month"}
            />
            <KPICard
              cardWidth={kpiCardWidth}
              label={isVi ? "Tích Lũy" : "Net Savings"}
              value={formatVND(Math.abs(kpis.netSavings), isVi)}
              accentColor={kpis.netSavings >= 0 ? "#3629B7" : "#F97316"}
              icon={kpis.netSavings >= 0 ? "✦" : "!"}
              subtext={
                kpis.netSavings >= 0
                  ? (isVi ? "Dư thừa" : "Surplus")
                  : (isVi ? "Bội chi" : "Deficit")
              }
              subtextColor={kpis.netSavings >= 0 ? "#3629B7" : "#F97316"}
            />
            <KPICard
              cardWidth={kpiCardWidth}
              label={isVi ? "Tỷ Lệ Tiết Kiệm" : "Savings Rate"}
              value={`${kpis.savingsRate.toFixed(1)}%`}
              accentColor={kpis.savingsRate >= 20 ? "#6D6ACF" : "#F59E0B"}
              icon="◎"
              subtext={
                kpis.savingsRate >= 20
                  ? (isVi ? "Tốt" : "Healthy")
                  : kpis.savingsRate >= 0
                  ? (isVi ? "Cần cải thiện" : "Needs work")
                  : (isVi ? "Bội chi" : "Deficit")
              }
              subtextColor={kpis.savingsRate >= 20 ? "#6D6ACF" : "#B45309"}
            />
          </View>
        )}

        {/* Grouped Bar Chart */}
        {!loading && monthlyStats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isVi ? "Thu Nhập vs Chi Tiêu Theo Tuần" : "Income vs Expense by Week"}
              </Text>
              <Text style={styles.sectionCaption}>
                {isVi ? "Chạm vào cột để xem chi tiết" : "Tap a column to view details"}
              </Text>
            </View>

            <View style={styles.chartWrap}>
              <VictoryChart
                theme={VictoryTheme.material}
                width={chartWidth}
                domainPadding={{ x: 35, y: [0, 45] }}
                domain={maxChartValue === 0 ? { y: [0, 1000000] } : undefined}
                height={275}
                padding={{ top: 48, bottom: 40, left: 52, right: 20 }}
                animate={{ duration: 500 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: "#E5E7EB" },
                    tickLabels: { fill: "#64748B", fontSize: 11, fontWeight: "600" },
                    grid: { stroke: "transparent" },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => formatVND(Number(t), isVi)}
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "#64748B", fontSize: 10 },
                    grid: { stroke: "#EEF2F7" },
                  }}
                />
                <VictoryGroup offset={20}>
                  <VictoryBar
                    data={incomeData}
                    x="week"
                    y="value"
                    labels={({ datum }) => datum.label}
                    cornerRadius={{ top: 5 }}
                    labelComponent={
                      <VictoryTooltip
                        constrainToVisibleArea
                        pointerLength={10}
                        dy={-4}
                        flyoutStyle={{ fill: "#111827", stroke: "#111827", rx: 6, ry: 6 }}
                        style={{ fill: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}
                      />
                    }
                    style={{ data: { fill: "#10B981", width: 16, strokeWidth: 0 } }}
                  />
                  <VictoryBar
                    data={expenseData}
                    x="week"
                    y="value"
                    labels={({ datum }) => datum.label}
                    cornerRadius={{ top: 5 }}
                    labelComponent={
                      <VictoryTooltip
                        constrainToVisibleArea
                        pointerLength={10}
                        dy={-4}
                        flyoutStyle={{ fill: "#111827", stroke: "#111827", rx: 6, ry: 6 }}
                        style={{ fill: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}
                      />
                    }
                    style={{ data: { fill: "#EF4444", width: 16, strokeWidth: 0 } }}
                  />
                </VictoryGroup>
              </VictoryChart>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
                <Text style={styles.legendText}>{isVi ? "Thu nhập" : "Income"}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                <Text style={styles.legendText}>{isVi ? "Chi tiêu" : "Expense"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Pie Chart: Spending by Category */}
        {!loading && pieData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isVi ? "Tỷ Trọng Chi Tiêu Danh Mục" : "Spending by Category"}
              </Text>
              <Text style={styles.sectionCaption}>
                {isVi ? "Chạm vào từng phần để xem chi tiết" : "Tap a slice to view details"}
              </Text>
            </View>

            <View style={styles.pieSection}>
              <View style={[styles.pieChart, { width: pieCanvasWidth, height: pieCanvasHeight }]}>
                <VictoryPie
                  data={pieData}
                  width={pieCanvasWidth}
                  height={pieCanvasHeight}
                  padding={{ top: 32, bottom: 16, left: 20, right: 20 }}
                  innerRadius={36}
                  animate={{ duration: 500 }}
                  labels={({ datum }) => datum.label}
                  colorScale={pieColors}
                  labelComponent={
                    <VictoryTooltip
                      constrainToVisibleArea
                      pointerLength={8}
                      flyoutStyle={{ fill: "#111827", stroke: "#111827", rx: 6, ry: 6 }}
                      style={{ fill: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}
                    />
                  }
                  style={{ data: { stroke: "#FFFFFF", strokeWidth: 2 } }}
                />
              </View>

              {/* Category list with Budget-matched colors */}
              <View style={styles.categoryList}>
                {categoryWithAmount.map((item) => (
                  <View key={item.category} style={styles.categoryItem}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <View style={styles.categoryMeta}>
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {item.category}
                      </Text>
                      <View style={styles.categoryBottom}>
                        <Text style={[styles.categoryPercent, { color: item.color }]}>
                          {item.percentage.toFixed(1)}%
                        </Text>
                        {item.estimatedExpense > 0 && (
                          <Text style={styles.categoryAmount}>
                            ~{formatVND(item.estimatedExpense, isVi)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && monthlyStats.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>
              {isVi ? "Chưa có dữ liệu tháng này" : "No data for this month"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isVi
                ? "Hãy thêm giao dịch để xem thống kê chi tiết"
                : "Add transactions to see detailed analysis"}
            </Text>
          </View>
        )}

      </ScrollView>

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
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    paddingBottom: 110,
    backgroundColor: "#F8F9FA",
  },

  // Header
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },

  // Month picker strip
  stripWrapper: {
    marginBottom: 14,
  },
  stripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stripItem: {
    width: 56,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stripItemActive: {
    backgroundColor: "#3629B7",
    borderColor: "#3629B7",
    shadowColor: "#3629B7",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  stripMonth: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  stripTextActive: {
    color: "#FFFFFF",
  },
  stripYear: {
    fontSize: 10,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 1,
  },
  stripYearActive: {
    color: "rgba(255,255,255,0.75)",
  },

  // Compact 2x2 KPI Grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  kpiCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 3.5,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 1,
  },
  kpiIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  kpiIcon: {
    fontSize: 11,
    fontWeight: "800",
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  kpiSubtext: {
    fontSize: 9.5,
    fontWeight: "600",
    marginTop: 1,
  },

  // Loading & error
  loadingBox: { paddingVertical: 36, paddingHorizontal: 20 },
  error: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    fontWeight: "600",
    marginHorizontal: 20,
  },

  // Sections
  section: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionHeader: { marginBottom: 6, paddingHorizontal: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  sectionCaption: { marginTop: 2, fontSize: 11, color: "#94A3B8", fontWeight: "500" },

  // Chart
  chartWrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  legendRow: { flexDirection: "row", gap: 24, justifyContent: "center", marginTop: 2 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },

  // Pie
  pieSection: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  pieChart: { alignItems: "center", justifyContent: "center" },

  // Category list
  categoryList: { flex: 1, paddingLeft: 8, gap: 8 },
  categoryItem: { flexDirection: "row", alignItems: "flex-start" },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8, marginTop: 3 },
  categoryMeta: { flex: 1 },
  categoryText: { fontSize: 12, color: "#334155", fontWeight: "700" },
  categoryBottom: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 },
  categoryPercent: { fontSize: 11, fontWeight: "700" },
  categoryAmount: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3629B7",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
});
