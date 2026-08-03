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
  Easing,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

// O nhap so tien: giu state la chuoi chi gom chu so, chi chen dau "." khi hien
// thi. Nho vay parseFloat luc luu van dung, khong phai bo dau phan cach.
const digitsOnly = (value: string) => value.replace(/\D/g, "");

const formatAmountInput = (rawDigits: string) => {
  const digits = digitsOnly(rawDigits);
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
};

// Source config — dung dung bo icon cua menu Add Transaction (BottomBar.tsx) de
// nguoi dung nhan ra ngay giao dich nay den tu luong nhap nao.
type SourceConfig = {
  icon: string;
  family: "ionicons" | "material-community";
  labelKey: string;
  color: string;
};

const SOURCE_CONFIG: Record<string, SourceConfig> = {
  camera: {
    icon: "camera-outline",
    family: "ionicons",
    labelKey: "transaction.source_camera",
    color: "#4CAF50",
  },
  voice: {
    icon: "microphone-outline",
    family: "material-community",
    labelKey: "transaction.source_voice",
    color: "#2196F3",
  },
  notification: {
    icon: "notifications-outline",
    family: "ionicons",
    labelKey: "transaction.source_notification",
    color: "#FF9800",
  },
  default: {
    icon: "document-text-outline",
    family: "ionicons",
    labelKey: "transaction.source_other",
    color: "#3629B7",
  },
};

const getSourceConfig = (source?: string) => {
  if (source && SOURCE_CONFIG[source]) return SOURCE_CONFIG[source];
  return SOURCE_CONFIG.default;
};

const SourceIcon: React.FC<{ config: SourceConfig; size?: number }> = ({
  config,
  size = 26,
}) =>
  config.family === "material-community" ? (
    <MaterialCommunityIcons name={config.icon as any} size={size} color={config.color} />
  ) : (
    <Ionicons name={config.icon as any} size={size} color={config.color} />
  );

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

// Be rong khoang lo ra khi vuot roi nha tay giua chung (ban cu la 80px).
const ACTION_WIDTH = 120;

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
  const { styles, accent, theme } = usePendingPanelStyles();
  const status = processingMap[item.id] ?? item.processingStatus;
  const error = processingError[item.id] ?? item.processingError;
  const isProcessing = status !== undefined && status !== 'completed' && status !== 'failed';

  const { width: screenWidth } = useWindowDimensions();
  // Do be ngang that cua dong de vuot duoc tron ca thanh; screenWidth chi la
  // gia tri tam thoi cho lan render dau tien.
  const [rowWidth, setRowWidth] = useState(screenWidth);

  const translateX = useRef(new Animated.Value(0)).current;

  // Ben nao dang mo -> chi ben do nhan cham, ben con lai (opacity 0) phai
  // pointerEvents="none" keo no nam de len va nuot mat cham cua nguoi dung.
  const [openSide, setOpenSide] = useState<null | "approve" | "reject">(null);

  // PanResponder chi duoc tao dung mot lan, nen moi gia tri thay doi theo thoi
  // gian phai doc qua ref — neu doc truc tiep se dinh gia tri cua lan render dau.
  const isProcessingRef = useRef(isProcessing);
  isProcessingRef.current = isProcessing;
  const rowWidthRef = useRef(rowWidth);
  rowWidthRef.current = rowWidth;
  const actionsRef = useRef({ onApprove, onReject });
  actionsRef.current = { onApprove, onReject };

  // Vuot qua nguong -> day not ca thanh ra khoi man hinh roi moi chay hanh dong.
  const commit = (direction: 1 | -1) => {
    setOpenSide(null);
    Animated.timing(translateX, {
      toValue: direction * rowWidthRef.current,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (direction === 1) actionsRef.current.onApprove(item.id);
      else actionsRef.current.onReject(item.id);

      // Thanh cong thi item bi go khoi danh sach nen khong ai thay gi. Neu that
      // bai (loi mang...) thi item van con, tra no ve cho cu.
      setTimeout(() => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          speed: 16,
          bounciness: 0,
        }).start();
      }, 450);
    });
  };

  // Nha tay giua chung -> dung lai o vi tri lo han nut, de nguoi dung bam xac
  // nhan (hanh vi cu, chi khac la khoang lo rong hon: 80px -> ACTION_WIDTH).
  const openTo = (direction: 1 | -1) => {
    setOpenSide(direction === 1 ? "approve" : "reject");
    Animated.spring(translateX, {
      toValue: direction * ACTION_WIDTH,
      useNativeDriver: true,
      speed: 16,
      bounciness: 4,
    }).start();
  };

  const springBack = () => {
    setOpenSide(null);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      // PHAI gianh responder ngay tu luc cham (giong ban goc). Neu de false va
      // trong cho onMoveShouldSetPanResponder thi gesture khong bao gio toi tay:
      // container cua modal / ScrollView doc da giu mat responder tu truoc.
      // Viec nay khong lam hong nut Edit: negotiation luc cham di tu view sau
      // nhat len tren, nen TouchableOpacity (nam duoi overlay trong cay) van
      // duoc hoi truoc va thang.
      onStartShouldSetPanResponder: () => !isProcessingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isProcessingRef.current) return false;
        const { dx, dy } = gestureState;
        // Nguong thap + he so 1.2 de bat gesture som, khong phai vuot that thang
        // moi an — nhung van du chat de ScrollView doc ben ngoai cuon binh thuong.
        return Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 4;
      },
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, gestureState) => {
        // Bam theo ngon tay tren toan bo be ngang, khong chan lai o 120px nua.
        const max = rowWidthRef.current;
        translateX.setValue(Math.max(-max, Math.min(max, gestureState.dx)));
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        // Keo qua nua dong -> chay luon; chi qua nua khoang lo -> dung lai cho nut.
        const commitDistance = rowWidthRef.current * 0.5;
        const isFling = Math.abs(vx) > 0.8 && Math.abs(dx) > ACTION_WIDTH;

        if (dx >= commitDistance || (isFling && vx > 0)) commit(1);
        else if (dx <= -commitDistance || (isFling && vx < 0)) commit(-1);
        else if (dx > ACTION_WIDTH * 0.5) openTo(1);
        else if (dx < -ACTION_WIDTH * 0.5) openTo(-1);
        else springBack();
      },
      onPanResponderTerminate: springBack,
    })
  ).current;

  useEffect(() => {
    translateX.setValue(0);
  }, [item.id]);

  // Nen mau chi hien dan theo huong vuot, icon phong to khi keo cang.
  const approveOpacity = translateX.interpolate({
    inputRange: [0, 24],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const rejectOpacity = translateX.interpolate({
    inputRange: [-24, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const approveScale = translateX.interpolate({
    inputRange: [0, 110],
    outputRange: [0.75, 1],
    extrapolate: "clamp",
  });
  const rejectScale = translateX.interpolate({
    inputRange: [-110, 0],
    outputRange: [1, 0.75],
    extrapolate: "clamp",
  });

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
    <View
      style={styles.swipeContainer}
      onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
    >
      {/* Lop nen: hai mang mau phu kin ca dong, chong len nhau, chi mang ung voi
          huong dang vuot moi hien ra — nho vay keo het thanh van thay mot mang
          mau lien thay vi ho mot nua. Nut ben trong van bam duoc nhu ban cu. */}
      <View style={styles.swipeBackdrop}>
        <Animated.View
          style={[styles.swipeLayer, styles.approveLayer, { opacity: approveOpacity }]}
          pointerEvents={openSide === "approve" ? "auto" : "none"}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onApprove(item.id)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[styles.actionButtonInner, { transform: [{ scale: approveScale }] }]}
            >
              <Ionicons name="checkmark-circle" size={26} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t("transaction.approve")}</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[styles.swipeLayer, styles.rejectLayer, { opacity: rejectOpacity }]}
          pointerEvents={openSide === "reject" ? "auto" : "none"}
        >
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReject(item.id)}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[styles.actionButtonInner, { transform: [{ scale: rejectScale }] }]}
            >
              <Ionicons name="trash" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t("transaction.reject")}</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Lớp nội dung di chuyển */}
      <Animated.View
        style={[
          styles.contentContainer,
          { transform: [{ translateX }] },
        ]}
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

        {/* Lop trong suot phu kin dong, giu toan bo gesture vuot. Truoc day
            panHandlers gan o contentContainer va phai trong cho cham tren <Text>
            bubble len — thuc te khong bubble, nen chi keo duoc o khoang trong
            ben phai. Overlay nay la touch target duy nhat cua vung chu nen khong
            con phu thuoc vao view nao nuot touch nua.
            Dat TRUOC rightActions: con render sau se nam tren, nho vay nut Edit
            van bam duoc trong pham vi cua no. */}
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="box-only"
          {...panResponder.panHandlers}
        />

        <View style={styles.rightActions}>
          {/* Approve / Reject nam o lop nen, lo ra khi vuot trai - phai. */}
          {!isProcessing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(item)}
              activeOpacity={0.7}
              hitSlop={6}
            >
              <Ionicons name="pencil" size={24} color={accent} />
            </TouchableOpacity>
          )}
          <Ionicons
            name="swap-horizontal"
            size={15}
            color={theme.subtext}
            style={styles.swipeHintIcon}
          />
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
    description: "",
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
      amount: digitsOnly(item.amount?.toString() ?? ""),
      category: item.category ?? CATEGORIES[0],
      type: item.type ?? TRANSACTION_TYPES[0],
      date: item.date ?? "",
      // groupText la truong luu description (do AI tra ve).
      description: item.groupText ?? "",
    });
    setEditModalVisible(true);
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const isIncome = editForm.type === "INCOME";
      const updates: Partial<PendingTransaction> = {
        amount: parseFloat(editForm.amount) || 0,
        // Khoan thu khong co o chon danh muc, nen dung "OTHER" thay vi giu lai
        // danh muc chi tieu cu (vd van con "FOOD" sau khi doi sang INCOME).
        category: isIncome ? "OTHER" : editForm.category,
        type: editForm.type as "INCOME" | "EXPENSE",
        date: editForm.date,
        groupText: editForm.description.trim(),
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
        // swipeDirection lam react-native-modal gan PanResponder len container,
        // va PanResponder do `onStartShouldSetPanResponder: () => true`. No chi
        // thang khi khong con nao gianh truoc — negotiation luc cham di tu view
        // sau nhat len tren, ma PanResponder cua tung dong cung tra ve true o
        // onStart, nen dong van vuot trai/phai duoc. Vuot xuong de dong chi an
        // khi bat dau tu vung ngoai dong (tieu de, khoang trong).
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
                      <View style={styles.groupIcon}>
                        <SourceIcon config={config} />
                      </View>
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
                value={formatAmountInput(editForm.amount)}
                onChangeText={(text) =>
                  setEditForm({ ...editForm, amount: digitsOnly(text) })
                }
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.subtext}
              />
              {/* Type dat truoc Category: danh sach CATEGORIES chi gom cac muc
                  chi tieu, khong ap dung cho khoan thu — nen chon loai truoc,
                  roi o Category moi an/hien theo. */}
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

              {editForm.type !== "INCOME" && (
                <>
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
                </>
              )}
              <Text style={styles.inputLabel}>{t("transaction.description")}</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                placeholder={t("transaction.description")}
                placeholderTextColor={theme.subtext}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />

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
  groupIcon: { marginRight: 8, alignItems: 'center', justifyContent: 'center' },
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
    fontSize: 15,
    lineHeight: 21,
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
  descriptionInput: { minHeight: 64, paddingTop: 10 },
  pickerContainer: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, backgroundColor: theme.inputBg, marginBottom: 4 },
  picker: { height: 50, width: "100%", color: theme.text },
  editButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 12 },
  editCancelBtn: { flex: 1, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8, alignItems: "center" },
  editCancelText: { color: theme.text, fontWeight: "500" },
  editSaveBtn: { flex: 1, backgroundColor: theme.primary, padding: 12, borderRadius: 8, alignItems: "center" },
  editSaveText: { color: "white", fontWeight: "500" },
  approveBtnDisabled: { backgroundColor: "#A0A0A0", opacity: 0.7 },
  // Dong cao han de vung vuot rong, de trung ngon tay hon.
  swipeContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: surface,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
    minHeight: 88,
  },

  // Lop nen phia sau noi dung: hai mang mau chong len nhau, moi mang phu kin ca
  // dong. Chi mang ung voi huong dang vuot duoc lam hien (opacity) nen khi keo
  // het thanh van la mot mang mau lien, khong bi ho nua ben.
  swipeBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  swipeLayer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  approveLayer: {
    backgroundColor: '#16A34A',
    justifyContent: 'flex-start',
  },
  rejectLayer: {
    backgroundColor: '#DC2626',
    justifyContent: 'flex-end',
  },
  // Vung bam nam gon trong khoang lo ra khi nha tay giua chung.
  actionButton: {
    width: ACTION_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  actionButtonInner: {
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Lớp nội dung (foreground) – di chuyển theo translateX
  contentContainer: {
    backgroundColor: surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 88,
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
    fontSize: 17,
    fontWeight: '700',
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
    fontSize: 14,
    lineHeight: 19,
    color: theme.subtext,
    marginTop: 6,
    flexShrink: 1,
    width: '100%',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 6,
  },
  // Icon tran, khong vong tron nen — vung cham van rong de de bam.
  editButton: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeHintIcon: {
    marginLeft: 2,
    opacity: 0.5,
  },
});