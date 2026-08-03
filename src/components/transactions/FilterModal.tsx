import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeMode } from "../../theme/ThemeProvider";
import { t } from "../../i18n";
import { TransactionFilter } from "../../types/transaction.types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../../constants/categories";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFilter) => void;
  initialFilters?: TransactionFilter;
}

const CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const { theme } = useThemeMode();
  const scrollRef = useRef<ScrollView>(null);
  // Modal chiem tron man hinh nen chieu cao cua no = chieu cao window. Dung so
  // px tuong minh thay vi flex:1 vi cua so Modal tren Android khong bao chieu cao
  // dung o lan layout dau -> ScrollView tran het noi dung va day footer (nut
  // Apply) ra ngoai, chi tro lai binh thuong sau mot re-render bat ky.
  const { height: windowHeight } = useWindowDimensions();
  const [filters, setFilters] = useState<TransactionFilter>(
    initialFilters || {
      type: "all",
      categories: [],
      dateRange: "all_time",
    }
  );

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    } else {
      setFilters({
        type: "all",
        categories: [],
        dateRange: "all_time",
      });
    }
  }, [initialFilters]);

  const handleTypeChange = (type: "all" | "expense" | "income") => {
    setFilters({ ...filters, type });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    setFilters({ ...filters, categories: newCategories });
  };

  const handleDateRangeChange = (
    dateRange: "all_time" | "today" | "yesterday" | "this_week" | "this_month" | "custom"
  ) => {
    setFilters({ ...filters, dateRange });
  };

  // Hai o custom range nam cuoi ScrollView. KeyboardAvoidingView chi thu nho vung
  // hien thi, nguoi dung van phai tu keo — nen chu dong cuon xuong cuoi khi focus.
  const handleDateInputFocus = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      type: "all",
      categories: [],
      dateRange: "all_time",
    });
  };

  return (
    // Modal nay chiem toan man hinh. Neu de `transparent` thi tren Android cua so
    // modal khong cap chieu cao cho SafeAreaView o lan layout dau tien -> ScrollView
    // tran dai het noi dung, footer (nut Apply) bi day ra ngoai man hinh va khong
    // scroll duoc cho toi khi co mot re-render (vd: bam vao category).
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { height: windowHeight, backgroundColor: theme.bg },
        ]}
      >
        {/* Cua so Modal cua Android khong ke thua windowSoftInputMode=adjustResize
            cua Activity, nen phai tu day noi dung len khi ban phim mo — neu khong,
            hai o nhap ngay custom range nam duoi cung se bi ban phim che. */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("transaction.filter")}
          </Text>
          <Pressable onPress={handleReset}>
            <Text style={[styles.resetButton, { color: theme.primary }]}>
              {t("common.reset") || "Reset"}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Type Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("transaction.type")}
            </Text>
            <View style={styles.buttonGroup}>
              {[
                { key: "all", label: t("transaction.all") },
                { key: "expense", label: t("transaction.expense") },
                { key: "income", label: t("transaction.income") },
              ].map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() =>
                    handleTypeChange(
                      key as "all" | "expense" | "income"
                    )
                  }
                  style={[
                    styles.filterButton,
                    filters.type === key
                      ? [styles.filterButtonActive, { backgroundColor: theme.primary }]
                      : [styles.filterButtonInactive, { borderColor: theme.border }],
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      {
                        color:
                          filters.type === key ? "#FFFFFF" : theme.text,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("transaction.category")}
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => handleCategoryToggle(category)}
                  style={[
                    styles.categoryButton,
                    filters.categories.includes(category)
                      ? [
                          styles.categoryButtonActive,
                          { backgroundColor: theme.primary },
                        ]
                      : [
                          styles.categoryButtonInactive,
                          { borderColor: theme.border },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      {
                        color:
                          filters.categories.includes(category)
                            ? "#FFFFFF"
                            : theme.text,
                      },
                    ]}
                  >
                    {t(`transaction.${category}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date Range Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("transaction.date_range")}
            </Text>
            <View style={styles.dateRangeGroup}>
              {[
                { key: "all_time", label: t("transaction.all_time") },
                { key: "today", label: t("transaction.today") },
                { key: "this_week", label: t("transaction.this_week") },
                { key: "this_month", label: t("transaction.this_month") },
                { key: "custom", label: t("transaction.custom_range") },
              ].map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() =>
                    handleDateRangeChange(
                      key as "all_time" | "today" | "yesterday" | "this_week" | "this_month" | "custom"
                    )
                  }
                  style={styles.dateRangeOption}
                >
                  <View
                    style={[
                      styles.radioButton,
                      {
                        borderColor: theme.primary,
                        backgroundColor:
                          filters.dateRange === key
                            ? theme.primary
                            : "transparent",
                      },
                    ]}
                  />
                  <Text style={[styles.dateRangeText, { color: theme.text }]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filters.dateRange === "custom" && (
              <View style={styles.customDateSection}>
                <View style={styles.dateInputGroup}>
                  <Text style={[styles.dateLabel, { color: theme.text }]}>
                    {t("transaction.from")}
                  </Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      {
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor={theme.subtext}
                    onFocus={handleDateInputFocus}
                    value={filters.customStartDate || ""}
                    onChangeText={(text) =>
                      setFilters({ ...filters, customStartDate: text })
                    }
                  />
                </View>
                <View style={styles.dateInputGroup}>
                  <Text style={[styles.dateLabel, { color: theme.text }]}>
                    {t("transaction.to")}
                  </Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      {
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor={theme.subtext}
                    onFocus={handleDateInputFocus}
                    value={filters.customEndDate || ""}
                    onChangeText={(text) =>
                      setFilters({ ...filters, customEndDate: text })
                    }
                  />
                </View>
              </View>
            )}
          </View>

          <View style={styles.spacer} />
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.bg,
              borderTopColor: theme.border,
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={[
              styles.button,
              styles.cancelButton,
              { borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>
              {t("common.cancel")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={[styles.button, styles.applyButton, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.applyButtonText}>
              {t("transaction.apply")}
            </Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  // Khong dat flex:1 o day: flex:1 keo theo flexBasis:0% se de len chieu cao px
  // tuong minh truyen vao inline, lam mat tac dung cua no.
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  resetButton: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterButtonInactive: {
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    width: "48%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  categoryButtonActive: {
    borderWidth: 0,
  },
  categoryButtonInactive: {
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dateRangeGroup: {
    gap: 12,
  },
  dateRangeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  customDateSection: {
    marginTop: 16,
    gap: 12,
  },
  dateInputGroup: {
    gap: 6,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  dateInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  applyButton: {
    borderWidth: 0,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  spacer: {
    height: 20,
  },
});
