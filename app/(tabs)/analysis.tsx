import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryPie,
  VictoryStack,
  VictoryTheme,
  VictoryTooltip,
} from "victory-native";

import { http } from "../../src/api/http";
import { tokenStorage } from "../../src/storage/tokenStorage";
import AppBottomBar from "../../src/components/AppBottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { VoiceInputModal } from "../../src/components/transactions/voice/VoiceInputModal";
import { AddTransactionModal } from "../../src/components/transactions/AddTransactionModal";
import { TransactionRequest, Receipt } from "../../src/types/transaction.types";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";


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
  month: number;
  year: number;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CATEGORY_COLORS = [
  "#2563EB",
  "#F97316",
  "#16A34A",
  "#9333EA",
  "#0891B2",
  "#E11D48",
  "#F59E0B",
  "#64748B",
];

async function getAuthHeader() {
  const token = await tokenStorage.getAccessToken();

  if (!token) {
    throw new Error("No token found");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function getTransactionAnalytics(
  month: number,
  year: number
): Promise<AnalyticsResponse> {
  try {
    const headers = await getAuthHeader();

    const res = await http.post(
      "/api/v1/transactions/analytics",
      {
        month,
        year,
      },
      {
        headers: {
          ...headers,
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
      data: {
        monthlyStats: [],
        categoryProportions: [],
      },
    };
  }
}

function getPreviousThreeMonths(): MonthOption[] {
  const now = new Date();

  return [3, 2, 1].map((offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);

    return {
      label: MONTH_NAMES[date.getMonth()],
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  });
}

export default function AnalyticsScreen() {
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

  const chartWidth = width - 88;
  const pieSize = Math.min(210, width * 0.52);

  const monthOptions = useMemo(() => getPreviousThreeMonths(), []);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(2);
  const selectedMonth = monthOptions[selectedMonthIndex];

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [categoryProportions, setCategoryProportions] = useState<
    CategoryProportion[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async (month: number, year: number) => {
    try {
      setLoading(true);
      setError("");

      const response = await getTransactionAnalytics(month, year);

      if (!response.success) {
        throw new Error(response.message);
      }

      setMonthlyStats(response.data.monthlyStats);
      setCategoryProportions(response.data.categoryProportions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedMonth.month, selectedMonth.year);
  }, []);

  const handleChangeMonth = (direction: "prev" | "next") => {
    const nextIndex =
      direction === "prev" ? selectedMonthIndex - 1 : selectedMonthIndex + 1;

    if (nextIndex < 0 || nextIndex >= monthOptions.length) {
      return;
    }

    const nextMonth = monthOptions[nextIndex];

    setSelectedMonthIndex(nextIndex);
    fetchAnalytics(nextMonth.month, nextMonth.year);
  };

  const incomeData = useMemo(
    () =>
      monthlyStats.map((item) => ({
        week: `Week ${item.week}`,
        value: Number(item.income) || 0,
        label: `Week ${item.week}\nIncome: ${item.income}`,
      })),
    [monthlyStats]
  );

  const expenseData = useMemo(
    () =>
      monthlyStats.map((item) => ({
        week: `Week ${item.week}`,
        value: Number(item.expense) || 0,
        label: `Week ${item.week}\nExpense: ${item.expense}`,
      })),
    [monthlyStats]
  );

  const pieData = useMemo(
    () =>
      categoryProportions.map((item) => ({
        x: item.category,
        y: Number(item.count) || 0,
        label: `${item.category}\n${item.count} (${item.percentage.toFixed(
          1
        )}%)`,
      })),
    [categoryProportions]
  );

  const canGoPrev = selectedMonthIndex > 0;
  const canGoNext = selectedMonthIndex < monthOptions.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.monthSlider}>
          <TouchableOpacity
            style={styles.navButton}
            disabled={!canGoPrev}
            onPress={() => handleChangeMonth("prev")}
          >
            <Text style={[styles.navIcon, !canGoPrev && styles.navIconDisabled]}>
              ‹
            </Text>
          </TouchableOpacity>

          <View style={styles.monthCenter}>
            <Text style={styles.monthTitle}>{selectedMonth.label}</Text>
            <Text style={styles.monthSubTitle}>{selectedMonth.year}</Text>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            disabled={!canGoNext}
            onPress={() => handleChangeMonth("next")}
          >
            <Text style={[styles.navIcon, !canGoNext && styles.navIconDisabled]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        {!loading && monthlyStats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Income / Expense by Week</Text>
              <Text style={styles.sectionCaption}>
                Tap a column to view details
              </Text>
            </View>

            <View style={styles.chartWrap}>
              <VictoryChart
                theme={VictoryTheme.material}
                width={chartWidth}
                domainPadding={{ x: 26 }}
                height={300}
                padding={{ top: 24, bottom: 52, left: 44, right: 4 }}
                animate={{ duration: 500 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: "#E5E7EB" },
                    tickLabels: { fill: "#64748B", fontSize: 11 },
                    grid: { stroke: "transparent" },
                  }}
                />

                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "#64748B", fontSize: 11 },
                    grid: { stroke: "#EEF2F7" },
                  }}
                />

                <VictoryStack>
                  <VictoryBar
                    data={incomeData}
                    x="week"
                    y="value"
                    labels={({ datum }) => datum.label}
                    labelComponent={
                      <VictoryTooltip
                        flyoutStyle={{
                          fill: "#111827",
                          stroke: "#111827",
                        }}
                        style={{
                          fill: "#FFFFFF",
                          fontSize: 12,
                        }}
                      />
                    }
                    style={{
                      data: {
                        fill: "#22C55E",
                        width: 24,
                        strokeWidth: 0,
                      },
                    }}
                  />

                  <VictoryBar
                    data={expenseData}
                    x="week"
                    y="value"
                    labels={({ datum }) => datum.label}
                    cornerRadius={{ top: 4 }}
                    labelComponent={
                      <VictoryTooltip
                        flyoutStyle={{
                          fill: "#111827",
                          stroke: "#111827",
                        }}
                        style={{
                          fill: "#FFFFFF",
                          fontSize: 12,
                        }}
                      />
                    }
                    style={{
                      data: {
                        fill: "#EF4444",
                        width: 24,
                        strokeWidth: 0,
                      },
                    }}
                  />
                </VictoryStack>
              </VictoryChart>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: "#22C55E" }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: "#EF4444" }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
            </View>
          </View>
        )}

        {!loading && pieData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Proportions</Text>
              <Text style={styles.sectionCaption}>
                Tap a slice to view category data
              </Text>
            </View>

            <View style={styles.pieSection}>
              <View
                style={[
                  styles.pieChart,
                  {
                    width: pieSize,
                    height: pieSize,
                  },
                ]}
              >
                <VictoryPie
                  data={pieData}
                  width={pieSize}
                  height={pieSize}
                  padding={18}
                  innerRadius={42}
                  animate={{ duration: 500 }}
                  labels={({ datum }) => datum.label}
                  colorScale={CATEGORY_COLORS}
                  labelComponent={
                    <VictoryTooltip
                      flyoutStyle={{
                        fill: "#FFFFFF",
                        stroke: "#D0D5DD",
                      }}
                      style={{
                        fill: "#111827",
                        fontSize: 12,
                      }}
                    />
                  }
                  style={{
                    data: {
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                    },
                  }}
                />
              </View>

              <View style={styles.categoryList}>
                {categoryProportions.map((item, index) => (
                  <View key={item.category} style={styles.categoryItem}>
                    <View
                      style={[
                        styles.categoryDot,
                        {
                          backgroundColor:
                            CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                        },
                      ]}
                    />

                    <View style={styles.categoryMeta}>
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {item.category}
                      </Text>
                      <Text style={styles.categoryPercent}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: "#F8FAFC",
  },

  monthSlider: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  monthCenter: {
    alignItems: "center",
  },

  monthTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1F2937",
  },

  monthSubTitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },

  navButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  navIcon: {
    fontSize: 42,
    lineHeight: 46,
    color: "#475569",
    fontWeight: "300",
  },

  navIconDisabled: {
    color: "#CBD5E1",
  },

  loadingBox: {
    paddingVertical: 36,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },

  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  sectionCaption: {
    marginTop: 4,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },

  chartWrap: {
    alignItems: "flex-start",
    overflow: "hidden",
  },

  legendRow: {
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
    marginTop: -4,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 7,
  },

  pieSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  pieChart: {
    alignItems: "center",
    justifyContent: "center",
  },

  categoryList: {
    flex: 1,
    paddingLeft: 10,
    gap: 12,
  },

  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 8,
  },

  categoryMeta: {
    flex: 1,
  },

  categoryText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "700",
  },

  categoryPercent: {
    marginTop: 2,
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  error: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    fontWeight: "600",
  },
});
