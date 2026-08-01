import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal as RNModal,
  Alert,
  PanResponder,
  Animated,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Modal from "react-native-modal";
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';
import { Theme, ThemeMode } from '../../theme/tokens';
import PendingStorage, {
  PendingTransaction,
  pendingEventBus,
  ProcessingEvent,
  ProcessingStatus
} from "../../storage/pendingTransactionStorage";
import PendingService from "../../services/pendingTransaction.service";

// Helper format
const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return "0";
  return amount.toLocaleString("vi-VN") + " ₫";
};

// Source config
const SOURCE_CONFIG: Record<string, { icon: string; labelKey: string; color: string }> = {
  camera: { icon: "📷", labelKey: "transaction.source_camera", color: "#4CAF50" },
  voice: { icon: "🎙️", labelKey: "transaction.source_voice", color: "#2196F3" },
  notification: { icon: "🔔", labelKey: "transaction.source_notification", color: "#FF9800" },
  default: { icon: "📄", labelKey: "transaction.source_other", color: "#3629B7" },
};

const getSourceConfig = (source?: string) => {
  if (source && SOURCE_CONFIG[source]) return SOURCE_CONFIG[source];
  return SOURCE_CONFIG.default;
};

const getCategoryLabel = (category?: string) => {
  const normalized = (category || "OTHER").toUpperCase();
  switch (normalized) {
    case "FOOD":
      return t("category.FOOD");
    case "TRANSPORTATION":
      return t("category.TRANSPORTATION");
    case "CLOTHING":
      return t("category.CLOTHING");
    case "UTILITIES":
      return t("category.UTILITIES");
    case "ENTERTAINMENT":
      return t("category.ENTERTAINMENT");
    case "HEALTH":
      return t("category.HEALTH");
    case "EDUCATION":
      return t("category.EDUCATION");
    case "SHOPPING":
      return t("category.SHOPPING");
    default:
      return t("category.OTHER");
  }
};

const CATEGORIES = [
  "FOOD",
  "TRANSPORTATION",
  "CLOTHING",
  "UTILITIES",
  "ENTERTAINMENT",
  "HEALTH",
  "EDUCATION",
  "SHOPPING",
  "OTHER",
];

const categoryIcons: Record<string, string> = {
  FOOD: "🍔",
  TRANSPORTATION: "🚗",
  CLOTHING: "👕",
  UTILITIES: "💡",
  ENTERTAINMENT: "🎮",
  HEALTH: "🏥",
  EDUCATION: "📚",
  OTHER: "💰",
};

const TRANSACTION_TYPES = ["EXPENSE", "INCOME"];

// ==================== DYNAMIC STYLES ====================
// Styles dung chung cho PendingTransactionPanel + SwipeableItem, build lai theo theme.
function usePendingPanelStyles() {
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dung link (sang hon primary) cho du tuong phan tren nen toi.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" co token card mau xanh dam (danh cho accent) nen surface dung trang.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;

  const styles = useMemo(
    () => createPendingPanelStyles(theme, mode, accent, surface),
    [theme, mode]
  );

  return { styles, theme, mode, accent, surface };
}

export type PendingPanelRef = {
  open: () => void;
  close: () => void;
};

// Component item có thể vuốt (dùng PanResponder)
const SwipeableItem: React.FC<{
  item: PendingTransaction;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (item: PendingTransaction) => void;
  processingMap: Record<string, ProcessingStatus>;
  processingMessage: Record<string, string | undefined>;
  processingError: Record<string, string | undefined>;
}> = ({ item, onApprove, onReject, onEdit, processingMap, processingMessage, processingError }) => {
  const { styles, accent } = usePendingPanelStyles();
  const status = processingMap[item.id] ?? item.processingStatus;
  const error = processingError[item.id] ?? item.processingError;
  const isProcessing = status !== undefined && status !== 'completed' && status !== 'failed';

  const translateX = useRef(new Animated.Value(0)).current;
  const THRESHOLD = 80;
  const MAX_SWIPE = 120;
  const ACTION_THRESHOLD = 70;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessing,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        return isHorizontal && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, gestureState) => {
        let dx = gestureState.dx;

        if (Math.abs(dx) > MAX_SWIPE) {
          dx =
            Math.sign(dx) *
            (MAX_SWIPE + (Math.abs(dx) - MAX_SWIPE) * 0.25);
        }

        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        if (dx > ACTION_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: THRESHOLD,
            stiffness: 180,
            damping: 20,
            mass: 0.7,
            useNativeDriver: true,
          }).start(() => {
            onApprove(item.id);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });
        } else if (dx < -ACTION_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -ACTION_THRESHOLD,
            stiffness: 180,
            damping: 20,
            useNativeDriver: true,
          }).start(() => {
            onReject(item.id);

            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    translateX.setValue(0);
  }, [item.id]);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === "completed") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [status]);


  const getProcessingLabel = (status?: ProcessingStatus) => {
    switch (status) {
      case "uploading":
        return t("transaction.uploading");

      case "ai_submitting":
        return t("transaction.ai_submitting");

      case "ai_processing":
        return t("transaction.ai_processing");

      case "completed":
        return t("transaction.completed");

      case "failed":
        return t("transaction.failed");

      default:
        return "";
    }
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Lớp nền chứa hai nút */}
      <View style={styles.backgroundButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => onApprove(item.id)}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>✅ {t("transaction.approve")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => onReject(item.id)}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>🗑️ {t("transaction.reject")}</Text>
        </TouchableOpacity>
      </View>

      {/* Lớp nội dung di chuyển */}
      <Animated.View
        style={[
          styles.contentContainer,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.itemContent}>
          <View style={styles.topRow}>
            {!isProcessing && (
              <Text style={styles.descriptionText}>
                {item.type === "EXPENSE"
                  ? t("transaction.expense_prefix")
                  : t("transaction.income_prefix")}{" "}
                <Text style={styles.amount}>{formatAmount(item.amount)}</Text>{" "}
                {item.type === "EXPENSE"
                  ? t("transaction.for_label")
                  : t("transaction.from_label")}{" "}
                <Text style={styles.categoryName}>
                  {getCategoryLabel(item.category)}
                </Text>
              </Text>
            )}
            {status && (
              <View
                style={[
                  styles.processingBadge,
                  status === "failed" && styles.failedBadge,
                  status === "completed" && styles.completedBadge,
                ]}
              >
                {status === "failed" ? (
                  <>
                    <Text style={styles.failedIcon}>❌</Text>
                    <Text style={styles.failedText}>
                      {error || "AI failed"}
                    </Text>
                  </>
                ) : status === "completed" ? (
                  <Animated.Text
                    style={[
                      styles.completedIcon,
                      {
                        transform: [{ scale: scaleAnim }],
                      },
                    ]}
                  >
                    {categoryIcons[item.category ?? "OTHER"] ?? "💰"}
                  </Animated.Text>
                ) : (
                  <>
                    <ActivityIndicator size="small" color={accent} />
                    <Text style={styles.processingText}>
                      {getProcessingLabel(status)}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
          {item.groupText ? (
            <Text style={styles.description} numberOfLines={2}>
              {t("transaction.description")}: {item.groupText}
            </Text>
          ) : null}
        </View>
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(item)}
            disabled={isProcessing}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <Text style={styles.swipeHint}>↔</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const PendingTransactionPanel = forwardRef<PendingPanelRef>((props, ref) => {
  const { styles, theme, accent } = usePendingPanelStyles();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<PendingTransaction[]>([]);
  const { lang } = useLanguage();

  const [processingMap, setProcessingMap] = useState<Record<string, ProcessingStatus>>({});
  const [processingMessage, setProcessingMessage] = useState<Record<string, string | undefined>>({});
  const [processingError, setProcessingError] = useState<Record<string, string | undefined>>({});
  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PendingTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    category: CATEGORIES[0],
    type: TRANSACTION_TYPES[0],
    date: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  useEffect(() => {
    const load = async () => {
      await PendingStorage.load();
      setData([...PendingStorage.getAll()]);
    };
    load();
  }, []);

  const handleApprove = async (id: string) => {
    const status = processingMap[id];
    if (status && (status === 'uploading' || status === 'ai_submitting' || status === 'ai_processing')) {
      return;
    }
    try {
      await PendingService.approve(id);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể duyệt giao dịch');
    }
  };

  const handleReject = async (id: string) => {
    const status = processingMap[id];
    if (status && (status === 'uploading' || status === 'ai_submitting' || status === 'ai_processing')) {
      return;
    }
    try {
      await PendingService.reject(id);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể từ chối giao dịch');
    }
  };

  const openEditModal = (item: PendingTransaction) => {
    setEditingItem(item);
    setEditForm({
      amount: item.amount?.toString() ?? "",
      category: item.category ?? CATEGORIES[0],
      type: item.type ?? TRANSACTION_TYPES[0],
      date: item.date ?? "",
    });
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const updates: Partial<PendingTransaction> = {
        amount: parseFloat(editForm.amount) || 0,
        category: editForm.category,
        type: editForm.type as "INCOME" | "EXPENSE",
        date: editForm.date,
      };
      await PendingService.update(editingItem.id, updates);
      setEditModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to update pending transaction", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const update = () => {
      const newData = PendingStorage.getAll();
      setData([...newData]);
    };
    pendingEventBus.on("updated", update);
    return () => {
      pendingEventBus.off("updated", update);
    };
  }, []);

  useEffect(() => {
    const handleProcessingUpdate = (event: ProcessingEvent) => {
      setProcessingMap(prev => ({
        ...prev,
        [event.pendingId]: event.status,
      }));

      if (event.message) {
        setProcessingMessage(prev => ({
          ...prev,
          [event.pendingId]: event.message,
        }));
      }

      if (event.error) {
        setProcessingError(prev => ({
          ...prev,
          [event.pendingId]: event.error,
        }));
      }

      if (event.status === "completed") {
        setTimeout(() => {
          setProcessingMap(prev => {
            const { [event.pendingId]: _, ...rest } = prev;
            return rest;
          });

          setProcessingMessage(prev => {
            const { [event.pendingId]: _, ...rest } = prev;
            return rest;
          });

          setProcessingError(prev => {
            const { [event.pendingId]: _, ...rest } = prev;
            return rest;
          });
        }, 3000);
      }
    };
    pendingEventBus.on('processing_update', handleProcessingUpdate);
    return () => {
      pendingEventBus.off('processing_update', handleProcessingUpdate);
    };
  }, []);

  const groupTransactions = () => {
    const result: Record<string, Record<string, PendingTransaction[]>> = {};
    data.forEach((item) => {
      const source = item.source || "default";
      const groupId = item.groupId || "__ungrouped__";
      if (!result[source]) result[source] = {};
      if (!result[source][groupId]) result[source][groupId] = [];
      result[source][groupId].push(item);
    });
    return result;
  };

  const groupedData = groupTransactions();

  console.log("Grouped Data:", groupedData.camera);

  return (
    <>
      <Modal
        isVisible={visible}
        onBackdropPress={() => setVisible(false)}
        style={styles.modal}
        swipeDirection="down"
        onSwipeComplete={() => setVisible(false)}
      >
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t("transaction.pending_transactions")}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("transaction.no_pending")}</Text>
              </View>
            ) : (
              Object.entries(groupedData).map(([source, groups]) => {
                const config = getSourceConfig(source);
                return (
                  <View
                    key={source}
                    style={[
                      styles.groupContainer,
                      { borderColor: config.color, borderWidth: 2 }
                    ]}
                  >
                    <View
                      style={[
                        styles.groupHeader,
                        { backgroundColor: config.color + "20" }
                      ]}
                    >
                      <Text style={styles.groupIcon}>{config.icon}</Text>
                      <Text style={styles.groupTitle}>{t(config.labelKey)}</Text>
                    </View>

                    {Object.entries(groups).map(([groupId, items]) => {
                      const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
                      return (
                        <View key={groupId} style={styles.aiGroup}>
                          <View style={styles.aiGroupHeader}>
                            <Text style={styles.aiGroupItemCount}>{t("transaction.items_count", { count: items.length })}</Text>
                            <Text style={styles.aiGroupTotalAmount}>{formatAmount(totalAmount)}</Text>
                          </View>

                          {items.map((item) => (
                            <SwipeableItem
                              key={item.id}
                              item={item}
                              onApprove={handleApprove}
                              onReject={handleReject}
                              onEdit={openEditModal}
                              processingMap={processingMap}
                              processingMessage={processingMessage}
                              processingError={processingError}
                            />
                          ))}
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Modal */}
      <RNModal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editTitle}>{t("transaction.edit_pending")}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t("transaction.amount")}</Text>
              <TextInput
                style={styles.input}
                value={editForm.amount}
                onChangeText={(text) => setEditForm({ ...editForm, amount: text })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.subtext}
              />
              <Text style={styles.inputLabel}>{t("transaction.category")}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                  style={styles.picker}
                  dropdownIconColor={accent}
                >
                  {CATEGORIES.map((cat) => (
                    <Picker.Item key={cat} label={getCategoryLabel(cat)} value={cat} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>{t("transaction.type")}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editForm.type}
                  onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                  style={styles.picker}
                  dropdownIconColor={accent}
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <Picker.Item key={type} label={type === "EXPENSE" ? t("transaction.expense") : t("transaction.income")} value={type} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.inputLabel}>{t("transaction.date")}</Text>
              <TextInput
                style={styles.input}
                value={editForm.date}
                onChangeText={(text) => setEditForm({ ...editForm, date: text })}
                placeholder={t("transaction.date_format_placeholder")}
                placeholderTextColor={theme.subtext}
              />
            </ScrollView>
            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.editCancelText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editSaveBtn, isSaving && styles.approveBtnDisabled]}
                onPress={handleEditSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.editSaveText}>{t("common.save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RNModal>
    </>
  );
});

export default PendingTransactionPanel;

const createPendingPanelStyles = (
  theme: Theme,
  mode: ThemeMode,
  accent: string,
  surface: string
) => StyleSheet.create({
  modal: { justifyContent: "flex-end", margin: 0 },
  container: {
    backgroundColor: surface,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "75%",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontWeight: "bold", color: accent, fontSize: 16 },
  scrollContent: { paddingBottom: 8 },
  emptyContainer: { paddingVertical: 24, alignItems: "center" },
  emptyText: { color: theme.subtext, fontSize: 14 },
  aiGroup: {
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  aiGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.inputBg,
  },
  aiGroupItemCount: {
    fontSize: 12,
    color: theme.subtext,
  },
  aiGroupTotalAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: accent,
    backgroundColor: accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  groupContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  groupIcon: { fontSize: 18, marginRight: 6 },
  groupTitle: { fontSize: 14, fontWeight: "600", color: theme.text, flex: 1 },

  // Item styles
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    backgroundColor: surface,
    position: "relative",
    zIndex: 1,
    minHeight: 60,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.text,
    flexShrink: 1,
  },
  completedIcon: {
    fontSize: 22,
  },
  categoryName: {
    fontWeight: '500',
    color: accent,
  },
  // Label hành động (hiển thị khi kéo)
  actionLabelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  actionLabelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  itemContentWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: surface,
    paddingHorizontal: 4,
    zIndex: 2,
  },

  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContainer: {
    backgroundColor: surface,
    width: "85%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
  },
  editTitle: { fontSize: 18, fontWeight: "bold", color: accent, marginBottom: 16, textAlign: "center" },
  inputLabel: { fontSize: 13, fontWeight: "500", color: theme.text, marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text },
  pickerContainer: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, backgroundColor: theme.inputBg, marginBottom: 4 },
  picker: { height: 50, width: "100%", color: theme.text },
  editButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 12 },
  editCancelBtn: { flex: 1, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8, alignItems: "center" },
  editCancelText: { color: theme.text, fontWeight: "500" },
  editSaveBtn: { flex: 1, backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: "center" },
  editSaveText: { color: "white", fontWeight: "500" },
  approveBtnDisabled: { backgroundColor: "#A0A0A0", opacity: 0.7 },
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    minHeight: 60,
  },

  // Lớp nền chứa hai nút, chiếm toàn bộ container
  backgroundButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },

  // Nút hành động chung
  actionButton: {
    width: 80, // bằng với ngưỡng THRESHOLD
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  approveButton: {
    backgroundColor: '#4CAF50', // màu xanh
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  rejectButton: {
    backgroundColor: '#F44336', // màu đỏ
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  // Lớp nội dung (foreground) – di chuyển theo translateX
  contentContainer: {
    backgroundColor: surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 60,
    zIndex: 2, // đảm bảo nằm trên nền
  },

  // Phần itemContent bên trong (giữ nguyên cấu trúc cũ)
  itemContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  category: {
    fontSize: 12,
    color: theme.subtext,
    backgroundColor: theme.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 6,
  },
  typeBadge: {
    backgroundColor: theme.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  typeText: { fontSize: 10, color: theme.subtext },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: accent + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
    marginLeft: 6,
  },
  processingText: {
    fontSize: 11,
    color: accent,
    fontWeight: '500',
  },

  failedBadge: {
    backgroundColor: "#FDECEC",
  },

  failedText: {
    color: "#D32F2F",
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },

  failedIcon: {
    fontSize: 12,
  },

  completedBadge: {
    backgroundColor: "#E8F5E9",
  },

  completedText: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    color: theme.subtext,
    marginTop: 4,
    flexShrink: 1,
    width: '100%',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    padding: 4,
    marginRight: 4,
  },
  editButtonText: {
    fontSize: 16,
    color: accent,
  },
  swipeHint: {
    fontSize: 12,
    color: theme.subtext,
  },
});