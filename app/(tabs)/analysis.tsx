import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  PanResponder,
  Platform,
  Pressable,
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
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { Theme, ThemeMode } from "../../src/theme/tokens";
import { t } from "../../src/i18n";

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
  amount?: number;
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
  PROJECT_CONTRIBUTION: "#6366F1",
  PROJECT_REFUND: "#10B981",
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
  year: number,
  type: "MONTH" | "YEAR" = "MONTH"
): Promise<AnalyticsResponse> {
  try {
    const res = await http.post(
      "/api/v1/transactions/analytics",
      { month, year, type },
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

  const formatNum = (val: number) => {
    const formatted = val.toFixed(1);
    return formatted.endsWith(".0") ? val.toFixed(0) : formatted;
  };

  if (abs >= 1_000_000_000) return `${formatNum(value / 1_000_000_000)}${suffixB}`;
  if (abs >= 1_000_000) return `${formatNum(value / 1_000_000)}${suffixM}`;
  if (abs >= 1_000) return `${formatNum(value / 1_000)}${suffixK}`;
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
  // Styles được truyền từ component cha (đã tạo theo theme).
  styles: ReturnType<typeof createStyles>;
};

function KPICard({ cardWidth, label, value, accentColor, icon, subtext, subtextColor, styles }: KPICardProps) {
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
        <Text style={[styles.kpiSubtext, subtextColor ? { color: subtextColor } : null]} numberOfLines={1}>
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
  // Styles được truyền từ component cha (đã tạo theo theme).
  styles: ReturnType<typeof createStyles>;
};

function MonthPickerStrip({ options, selectedIndex, onSelect, styles }: MonthPickerProps) {
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

  const { theme, mode } = useThemeMode();
  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;
  const styles = useMemo(
    () => createStyles(theme, mode, accent, surface),
    [theme, mode, accent, surface]
  );

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
  const sectionInnerWidth = width - 64; // Total width inside section card
  const yAxisWidth = 60; // Fixed width for Y axis sidebar
  const scrollAreaWidth = Math.max(100, sectionInnerWidth - yAxisWidth);

  const monthOptions = useMemo(() => getPreviousTwelveMonths(isVi), [isVi]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(monthOptions.length - 1);
  const selectedMonth = monthOptions[selectedMonthIndex];

  const pieSize = Math.min(180, width * 0.42);
  const pieCanvasWidth = pieSize + 40;
  const pieCanvasHeight = pieSize + 48;
  const kpiCardWidth = (width - 40 - 10) / 2; // Exact 2 cards per row

  const [viewMode, setViewMode] = useState<"MONTH" | "YEAR">("MONTH");
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const zoomScaleRef = useRef<number>(1);
  zoomScaleRef.current = zoomScale;

  const initialPinchDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => (evt.nativeEvent.touches?.length || 0) >= 2,
      onStartShouldSetPanResponderCapture: (evt) => (evt.nativeEvent.touches?.length || 0) >= 2,
      onMoveShouldSetPanResponder: (evt) => (evt.nativeEvent.touches?.length || 0) >= 2,
      onMoveShouldSetPanResponderCapture: (evt) => (evt.nativeEvent.touches?.length || 0) >= 2,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            initialPinchDistRef.current = dist;
            initialScaleRef.current = zoomScaleRef.current;
          }
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2 && initialPinchDistRef.current && initialPinchDistRef.current > 0) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDist = Math.sqrt(dx * dx + dy * dy);
          const factor = currentDist / initialPinchDistRef.current;
          const targetScale = Math.min(2.5, Math.max(1.0, initialScaleRef.current * factor));
          setZoomScale(Number(targetScale.toFixed(2)));
        }
      },
      onPanResponderRelease: () => {
        initialPinchDistRef.current = null;
      },
      onPanResponderTerminate: () => {
        initialPinchDistRef.current = null;
      },
    })
  ).current;

  const effectiveChartWidth = Math.round(scrollAreaWidth * zoomScale);
  const barWidth = viewMode === "YEAR" ? Math.round(7 * zoomScale) : Math.round(16 * zoomScale);
  const barOffset = viewMode === "YEAR" ? Math.round(8 * zoomScale) : Math.round(20 * zoomScale);
  const domainPaddingX = viewMode === "YEAR" ? Math.round(14 * zoomScale) : Math.round(30 * zoomScale);
  const tickFontSize = viewMode === "YEAR" ? (zoomScale > 1.2 ? 10.5 : 9.5) : 11;

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [categoryProportions, setCategoryProportions] = useState<CategoryProportion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MONTH_SHORT_MAP: Record<string, string> = useMemo(
    () => ({
      Jan: "T1", Feb: "T2", Mar: "T3", Apr: "T4", May: "T5", Jun: "T6",
      Jul: "T7", Aug: "T8", Sep: "T9", Oct: "T10", Nov: "T11", Dec: "T12",
    }),
    []
  );

  const MONTH_NUMBER_MAP: Record<string, string> = useMemo(
    () => ({
      Jan: "1", Feb: "2", Mar: "3", Apr: "4", May: "5", Jun: "6",
      Jul: "7", Aug: "8", Sep: "9", Oct: "10", Nov: "11", Dec: "12",
    }),
    []
  );

  const MONTH_FULL_EN_MAP: Record<string, string> = useMemo(
    () => ({
      Jan: "January", Feb: "February", Mar: "March", Apr: "April",
      May: "May", Jun: "June", Jul: "July", Aug: "August",
      Sep: "September", Oct: "October", Nov: "November", Dec: "December",
    }),
    []
  );

  const formatXLabel = (itemWeek: string) => {
    if (viewMode === "YEAR") {
      if (isVi && MONTH_SHORT_MAP[itemWeek]) {
        return MONTH_SHORT_MAP[itemWeek];
      }
      return itemWeek;
    }
    return `W${itemWeek}`;
  };

  const formatTooltipHeader = (itemWeek: string) => {
    if (viewMode === "YEAR") {
      if (isVi) {
        const num = MONTH_NUMBER_MAP[itemWeek] || itemWeek;
        return `Tháng ${num}`;
      }
      return MONTH_FULL_EN_MAP[itemWeek] || itemWeek;
    }
    return `${isVi ? "Tuần" : "Week"} ${itemWeek}`;
  };

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

  const yDomain = useMemo<[number, number]>(
    () => [0, maxChartValue === 0 ? 1000000 : maxChartValue],
    [maxChartValue]
  );

  const dummyYData = useMemo(
    () => monthlyStats.map((item) => ({ week: item.week, value: Number(item.income) || 0 })),
    [monthlyStats]
  );

  const activeCategoryProportions = useMemo(
    () => categoryProportions.filter((c) => (Number(c.count) || 0) > 0 || (Number(c.percentage) || 0) > 0),
    [categoryProportions]
  );

  const categoryWithAmount = useMemo(() => {
    return activeCategoryProportions.map((cat, idx) => ({
      ...cat,
      color: getCategoryColor(cat.category, idx),
      estimatedExpense: cat.amount ?? (kpis.totalExpense * (cat.percentage / 100)),
    }));
  }, [activeCategoryProportions, kpis.totalExpense]);

  const fetchAnalytics = async (
    month: number,
    year: number,
    mode: "MONTH" | "YEAR" = viewMode
  ) => {
    try {
      setLoading(true);
      setError("");
      setSelectedCategory(null);
      const response = await getTransactionAnalytics(month, year, mode);
      if (!response.success) throw new Error(response.message);
      setMonthlyStats(response.data.monthlyStats || []);
      setCategoryProportions(response.data.categoryProportions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isVi ? "Có lỗi xảy ra khi tải dữ liệu" : "Failed to load analytics"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedMonth.month, selectedMonth.year, viewMode);
  }, []);

  const handleSelectMonth = (index: number) => {
    setSelectedMonthIndex(index);
    fetchAnalytics(monthOptions[index].month, monthOptions[index].year, viewMode);
  };

  const handleSwitchViewMode = (mode: "MONTH" | "YEAR") => {
    setViewMode(mode);
    setZoomScale(1);
    fetchAnalytics(selectedMonth.month, selectedMonth.year, mode);
  };

  // Chart data
  const incomeData = useMemo(
    () =>
      monthlyStats.map((item) => ({
        week: formatXLabel(item.week),
        value: Number(item.income) || 0,
        label: `${formatTooltipHeader(item.week)}\n${isVi ? "Thu" : "Inc"}: ${formatVND(Number(item.income), isVi)}`,
      })),
    [monthlyStats, isVi, viewMode]
  );

  const expenseData = useMemo(
    () =>
      monthlyStats.map((item) => ({
        week: formatXLabel(item.week),
        value: Number(item.expense) || 0,
        label: `${formatTooltipHeader(item.week)}\n${isVi ? "Chi" : "Exp"}: ${formatVND(Number(item.expense), isVi)}`,
      })),
    [monthlyStats, isVi, viewMode]
  );

  const pieData = useMemo(
    () =>
      activeCategoryProportions.map((item) => ({
        x: item.category,
        y: Number(item.percentage) || 0,
      })),
    [activeCategoryProportions]
  );

  const pieColors = useMemo(
    () => activeCategoryProportions.map((item, idx) => getCategoryColor(item.category, idx)),
    [activeCategoryProportions]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
            }
          }}
        >

        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>
            {isVi ? "Phân Tích Thống Kê" : "Financial Analytics"}
          </Text>
          <Text style={styles.pageSubtitle}>
            {viewMode === "MONTH"
              ? `${selectedMonth.label} ${isVi ? "năm" : ""} ${selectedMonth.year}`
              : `${isVi ? "Cả năm" : "Full year"} ${selectedMonth.year}`}
          </Text>
        </View>

        {/* Mode Switcher Segment (Theo Tháng / Theo Năm) */}
        <View style={styles.modeToggleRow}>
          <TouchableOpacity
            style={[styles.modeTab, viewMode === "MONTH" && styles.modeTabActive]}
            onPress={() => handleSwitchViewMode("MONTH")}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, viewMode === "MONTH" && styles.modeTabTextActive]}>
              {isVi ? "Theo Tháng" : "Monthly"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === "YEAR" && styles.modeTabActive]}
            onPress={() => handleSwitchViewMode("YEAR")}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabText, viewMode === "YEAR" && styles.modeTabTextActive]}>
              {isVi ? `Năm ${selectedMonth.year}` : `Year ${selectedMonth.year}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Picker Strip (only in MONTH mode) */}
        {viewMode === "MONTH" && (
          <MonthPickerStrip
            options={monthOptions}
            selectedIndex={selectedMonthIndex}
            onSelect={handleSelectMonth}
            styles={styles}
          />
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {/* Error */}
        {!!error && <Text style={styles.error}>{error}</Text>}

        {/* Compact KPI Cards (2x2 Grid) */}
        {!loading && monthlyStats.length > 0 && (
          <View style={styles.kpiGrid}>
            <KPICard
              cardWidth={kpiCardWidth}
              styles={styles}
              label={isVi ? "Tổng Thu" : "Total Income"}
              value={formatVND(kpis.totalIncome, isVi)}
              accentColor="#10B981"
              icon="↑"
              subtext={isVi ? (viewMode === "MONTH" ? "Trong tháng" : "Trong năm") : (viewMode === "MONTH" ? "This month" : "This year")}
            />
            <KPICard
              cardWidth={kpiCardWidth}
              styles={styles}
              label={isVi ? "Tổng Chi" : "Total Expense"}
              value={formatVND(kpis.totalExpense, isVi)}
              accentColor="#EF4444"
              icon="↓"
              subtext={isVi ? (viewMode === "MONTH" ? "Trong tháng" : "Trong năm") : (viewMode === "MONTH" ? "This month" : "This year")}
            />
            <KPICard
              cardWidth={kpiCardWidth}
              styles={styles}
              label={isVi ? "Tích Lũy" : "Net Savings"}
              value={formatVND(Math.abs(kpis.netSavings), isVi)}
              accentColor={kpis.netSavings >= 0 ? accent : "#F97316"}
              icon={kpis.netSavings >= 0 ? "✦" : "!"}
              subtext={
                kpis.netSavings >= 0
                  ? (isVi ? "Dư thừa" : "Surplus")
                  : (isVi ? "Bội chi" : "Deficit")
              }
              subtextColor={kpis.netSavings >= 0 ? accent : "#F97316"}
            />
            <KPICard
              cardWidth={kpiCardWidth}
              styles={styles}
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
                {viewMode === "MONTH"
                  ? (isVi ? "Thu Nhập vs Chi Tiêu Theo Tuần" : "Income vs Expense by Week")
                  : (isVi ? `Thu Nhập vs Chi Tiêu Các Tháng (${selectedMonth.year})` : `Income vs Expense by Month (${selectedMonth.year})`)}
              </Text>
              <Text style={styles.sectionCaption}>
                {isVi ? "Dùng 2 ngón tay để zoom • Vuốt ngang để xem" : "Pinch 2 fingers • Swipe to scroll"}
              </Text>
            </View>

            {/* Split Chart View: Sticky Y-Axis (Left) + Scrollable Bars (Right) */}
            <View style={styles.stickyChartContainer} {...panResponder.panHandlers}>
              {/* Left Fixed Y-Axis */}
              <View style={{ width: yAxisWidth, overflow: "hidden" }}>
                <VictoryChart
                  theme={VictoryTheme.material}
                  width={yAxisWidth + 10}
                  domain={{ y: yDomain }}
                  domainPadding={{ y: [0, 45] }}
                  height={275}
                  padding={{ top: 48, bottom: 40, left: 54, right: 0 }}
                >
                  <VictoryAxis
                    dependentAxis
                    tickFormat={(t) => formatVND(Number(t), isVi)}
                    style={{
                      axis: { stroke: "transparent" },
                      ticks: { stroke: "transparent" },
                      tickLabels: { fill: theme.subtext, fontSize: 10, fontWeight: "600" },
                      grid: { stroke: "transparent" },
                    }}
                  />
                  <VictoryBar
                    data={dummyYData}
                    x="week"
                    y="value"
                    style={{ data: { fill: "transparent", width: 0 } }}
                  />
                </VictoryChart>
              </View>

              {/* Right Scrollable Chart */}
              <View style={{ flex: 1 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={zoomScale > 1}
                  contentContainerStyle={zoomScale > 1 ? { paddingRight: 16 } : undefined}
                  bounces={false}
                >
                  <View style={{ width: effectiveChartWidth }}>
                    <VictoryChart
                      theme={VictoryTheme.material}
                      width={effectiveChartWidth}
                      domain={{ y: yDomain }}
                      domainPadding={{ x: domainPaddingX, y: [0, 45] }}
                      height={275}
                      padding={{ top: 48, bottom: 40, left: 10, right: 20 }}
                      animate={{ duration: 200 }}
                    >
                      <VictoryAxis
                        dependentAxis
                        tickFormat={() => ""}
                        style={{
                          axis: { stroke: "transparent" },
                          ticks: { stroke: "transparent" },
                          tickLabels: { fill: "transparent" },
                          grid: { stroke: theme.border },
                        }}
                      />
                      <VictoryAxis
                        style={{
                          axis: { stroke: theme.border },
                          tickLabels: { fill: theme.subtext, fontSize: tickFontSize, fontWeight: "600" },
                          grid: { stroke: "transparent" },
                        }}
                      />
                      <VictoryGroup offset={barOffset}>
                        <VictoryBar
                          data={incomeData}
                          x="week"
                          y="value"
                          labels={({ datum }) => datum.label}
                          cornerRadius={viewMode === "YEAR" ? { top: 3 } : { top: 5 }}
                          labelComponent={
                            <VictoryTooltip
                              constrainToVisibleArea
                              pointerLength={10}
                              dy={-4}
                              flyoutStyle={{ fill: "#111827", stroke: "#111827", rx: 6, ry: 6 }}
                              style={{ fill: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}
                            />
                          }
                          style={{ data: { fill: "#10B981", width: barWidth, strokeWidth: 0 } }}
                        />
                        <VictoryBar
                          data={expenseData}
                          x="week"
                          y="value"
                          labels={({ datum }) => datum.label}
                          cornerRadius={viewMode === "YEAR" ? { top: 3 } : { top: 5 }}
                          labelComponent={
                            <VictoryTooltip
                              constrainToVisibleArea
                              pointerLength={10}
                              dy={-4}
                              flyoutStyle={{ fill: "#111827", stroke: "#111827", rx: 6, ry: 6 }}
                              style={{ fill: "#FFFFFF", fontSize: 11.5, fontWeight: "800" }}
                            />
                          }
                          style={{ data: { fill: "#EF4444", width: barWidth, strokeWidth: 0 } }}
                        />
                      </VictoryGroup>
                    </VictoryChart>
                  </View>
                </ScrollView>
              </View>
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
                  padding={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  innerRadius={36}
                  animate={{ duration: 300 }}
                  labels={() => null}
                  colorScale={pieColors}
                  events={[
                    {
                      target: "data",
                      eventHandlers: {
                        onPressIn: () => {
                          return [
                            {
                              target: "data",
                              mutation: (props) => {
                                const catName = props.datum.x;
                                setSelectedCategory((prev) => (prev === catName ? null : catName));
                                return null;
                              },
                            },
                          ];
                        },
                      },
                    },
                  ]}
                  style={{
                    data: {
                      // Viền lát cắt: mặc định trùng màu nền card, khi chọn dùng màu chữ theme để nổi bật.
                      stroke: ({ datum }) => (datum.x === selectedCategory ? theme.text : surface),
                      strokeWidth: ({ datum }) => (datum.x === selectedCategory ? 3 : 2),
                      opacity: ({ datum }) => (selectedCategory ? (datum.x === selectedCategory ? 1 : 0.4) : 1),
                    },
                  }}
                />
              </View>

              {/* Category list with interactive tap and highlight */}
              <View style={styles.categoryList}>
                {categoryWithAmount.map((item) => {
                  const isSelected = selectedCategory === item.category;
                  const isDimmed = !!selectedCategory && !isSelected;

                  return (
                    <TouchableOpacity
                      key={item.category}
                      style={[
                        styles.categoryItem,
                        isSelected && styles.categoryItemActive,
                        isDimmed && styles.categoryItemDimmed,
                      ]}
                      onPress={() => setSelectedCategory((prev) => (prev === item.category ? null : item.category))}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: item.color },
                          isSelected && { transform: [{ scale: 1.3 }] },
                        ]}
                      />
                      <View style={styles.categoryMeta}>
                        <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]} numberOfLines={1}>
                          {t(`category.${item.category}`, { defaultValue: item.category })}
                        </Text>
                        <View style={styles.categoryBottom}>
                          <Text style={[styles.categoryPercent, { color: item.color }]}>
                            {item.percentage.toFixed(1)}%
                          </Text>
                          {item.estimatedExpense > 0 && (
                            <Text style={[styles.categoryAmount, isSelected && styles.categoryAmountActive]}>
                              ~{formatVND(item.estimatedExpense, isVi)}
                            </Text>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <View style={[styles.categoryCheck, { backgroundColor: item.color }]}>
                          <Text style={styles.categoryCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
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

        </Pressable>
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
// Factory tạo styles theo theme hiện tại (light/dark/green).
function createStyles(theme: Theme, mode: ThemeMode, accent: string, surface: string) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  container: {
    paddingBottom: 110,
    backgroundColor: theme.bg,
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
    color: theme.text,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: "600",
    marginTop: 2,
  },

  // Mode Switcher Segment
  modeToggleRow: {
    flexDirection: "row",
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    padding: 3,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.subtext,
  },
  modeTabTextActive: {
    color: accent,
    fontWeight: "800",
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
    backgroundColor: surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  stripItemActive: {
    // Ô tháng được chọn: nền tím đậm (primary) + chữ trắng cố định.
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    shadowColor: "#3629B7",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  stripMonth: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.subtext,
  },
  stripTextActive: {
    color: "#FFFFFF",
  },
  stripYear: {
    fontSize: 10,
    fontWeight: "500",
    color: theme.subtext,
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
    backgroundColor: surface,
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
    color: theme.subtext,
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
    color: theme.subtext,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.subtext,
    textAlign: "center",
  },

  // Sections
  section: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    marginHorizontal: 20,
    backgroundColor: surface,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionHeader: { marginBottom: 6, paddingHorizontal: 6 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  stickyChartContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  scaleBadge: {
    backgroundColor: theme.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "center",
  },
  scaleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: accent,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: theme.text },
  sectionCaption: { marginTop: 2, fontSize: 11, color: theme.subtext, fontWeight: "500" },

  // Chart
  chartWrap: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  legendRow: { flexDirection: "row", gap: 24, justifyContent: "center", marginTop: 2 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendText: { fontSize: 12, color: theme.subtext, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },

  // Pie
  pieSection: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  pieChart: { alignItems: "center", justifyContent: "center" },

  // Category list
  categoryList: { flex: 1, paddingLeft: 6, gap: 4 },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  categoryItemActive: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryItemDimmed: {
    opacity: 0.4,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  categoryMeta: { flex: 1 },
  categoryText: { fontSize: 12, color: theme.text, fontWeight: "700" },
  categoryTextActive: { fontSize: 12.5, color: theme.text, fontWeight: "800" },
  categoryBottom: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 },
  categoryPercent: { fontSize: 11, fontWeight: "700" },
  categoryAmount: { fontSize: 10, color: theme.subtext, fontWeight: "600" },
  // Khi được chọn: dùng màu chữ chính để đậm hơn subtext bình thường.
  categoryAmountActive: { color: theme.text, fontWeight: "700" },
  categoryCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  categoryCheckText: {
    fontSize: 9.5,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  });
}
