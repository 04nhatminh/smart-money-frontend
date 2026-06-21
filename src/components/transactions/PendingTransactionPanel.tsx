import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Modal from "react-native-modal";
import { ScrollView } from "react-native";
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import PendingStorage, {
  PendingTransaction,
  pendingEventBus,
  ProcessingEvent,
  ProcessingStatus
} from "../../storage/pendingTransactionStorage";
import PendingService from "../../services/pendingTransaction.service";

// Helper to format currency (VND)
const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return "0";
  return amount.toLocaleString("vi-VN") + " ₫";
};

// Source metadata for display
const SOURCE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  camera: { icon: "📷", label: "Camera", color: "#4CAF50" },
  voice: { icon: "🎙️", label: "Voice", color: "#2196F3" },
  notification: { icon: "🔔", label: "Notification", color: "#FF9800" },
  default: { icon: "📄", label: "Other", color: "#3629B7" },
};

const getSourceConfig = (source?: string) => {
  if (source && SOURCE_CONFIG[source]) return SOURCE_CONFIG[source];
  return SOURCE_CONFIG.default;
};

// Category options (same as backend)
const CATEGORIES = [
  "FOOD",
  "TRANSPORTATION",
  "CLOTHING",
  "UTILITIES",
  "ENTERTAINMENT",
  "HEALTH",
  "EDUCATION",
  "OTHER",
];

const TRANSACTION_TYPES = ["EXPENSE", "INCOME"];

export type PendingPanelRef = {
  open: () => void;
  close: () => void;
};

const PendingTransactionPanel = forwardRef<PendingPanelRef>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<PendingTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { lang } = useLanguage();

  // Processing state
  const [processingMap, setProcessingMap] = useState<Record<string, ProcessingStatus>>({});
  const [processingMessage, setProcessingMessage] = useState<Record<string, string | undefined>>({});

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PendingTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    category: CATEGORIES[0],
    type: TRANSACTION_TYPES[0],
    description: "",
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApproveSelected = async () => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      await Promise.all(selectedIds.map(id => PendingService.approve(id)));
      setSelectedIds([]);
      console.log("✅ All transactions approved");
    } catch (error) {
      console.error("❌ Error approving transactions:", error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (isDeleting || selectedIds.length === 0) return;
    Alert.alert(
      t("transaction.confirm_delete_title"),
      t("transaction.confirm_delete_message", { count: selectedIds.length }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await Promise.all(selectedIds.map(id => PendingService.reject(id)));
              setSelectedIds([]);
              console.log("✅ All transactions deleted");
            } catch (error) {
              console.error("❌ Error deleting transactions:", error);
              Alert.alert(t("common.error"), t("transaction.delete_error"));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (item: PendingTransaction) => {
    setEditingItem(item);
    setEditForm({
      amount: item.amount?.toString() ?? "",
      category: item.category ?? CATEGORIES[0],
      type: item.type ?? TRANSACTION_TYPES[0],
      description: item.description ?? "",
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
        description: editForm.description,
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

  const handleSelectAll = () => {
    if (selectedIds.length === data.length && data.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id));
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  useEffect(() => {
    const update = () => {
      const newData = PendingStorage.getAll();
      setData([...newData]);
      setSelectedIds((prev) =>
        prev.filter((id) => newData.some((t) => t.id === id))
      );
    };

    pendingEventBus.on("updated", update);
    return () => {
      pendingEventBus.off("updated", update);
    };
  }, []);

  // Listen to processing updates
  useEffect(() => {
    const handleProcessingUpdate = (event: ProcessingEvent) => {
      console.log("RECEIVED EVENT", event);
      setProcessingMap(prev => ({ ...prev, [event.pendingId]: event.status }));

      if (event.message) {
        setProcessingMessage(prev => ({ ...prev, [event.pendingId]: event.message }));
      }

      // Tự động xoá trạng thái sau 3 giây nếu hoàn thành hoặc thất bại
      if (event.status === 'completed' || event.status === 'failed') {
        setTimeout(() => {
          setProcessingMap(prev => {
            const { [event.pendingId]: _, ...rest } = prev;
            return rest;
          });
          setProcessingMessage(prev => {
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

  // Group transactions by source
  const groupBySource = () => {
    const groups: Record<string, PendingTransaction[]> = {};
    data.forEach(item => {
      const source = item.source || "default";
      if (!groups[source]) groups[source] = [];
      groups[source].push(item);
    });
    return groups;
  };

  const groupedData = groupBySource();

  // Helper to determine if an item is still processing (not completed)
  const isProcessing = (item: PendingTransaction): boolean => {
    const status = processingMap[item.id];
    return status !== undefined && status !== 'completed';
  };

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
            {data.length > 0 && (
              <TouchableOpacity onPress={handleSelectAll} style={styles.selectAllButton}>
                <Text style={styles.selectAllText}>
                  {isAllSelected ? "✅" : " ⬜"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("transaction.no_pending")}</Text>
              </View>
            ) : (
              Object.entries(groupedData).map(([source, items]) => {
                const config = getSourceConfig(source);
                return (
                  <View
                    key={source}
                    style={[
                      styles.groupContainer,
                      { borderColor: config.color, borderWidth: 2 }
                    ]}
                  >
                    <View style={[styles.groupHeader, { backgroundColor: config.color + "20" }]}>
                      <Text style={styles.groupIcon}>{config.icon}</Text>
                      <Text style={styles.groupTitle}>{config.label}</Text>
                      <Text style={styles.groupCount}>({items.length})</Text>
                    </View>

                    {items.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const processingActive = isProcessing(item);
                      const status = processingMap[item.id];
                      const message = processingMessage[item.id];

                      return (
                        <View key={item.id} style={styles.itemRow}>
                          <TouchableOpacity onPress={() => toggleSelect(item.id)} style={styles.checkbox}>
                            <Text style={styles.checkboxText}>{isSelected ? "✅" : "⬜"}</Text>
                          </TouchableOpacity>

                          {!processingActive ? (
                            // ✅ Processing finished → show normal data
                            <View style={styles.itemContent}>
                              <View style={styles.itemMain}>
                                <Text style={styles.amount}>
                                  {formatAmount(item.amount)}
                                </Text>
                                <Text style={styles.category}>
                                  {item.category || "OTHER"}
                                </Text>
                              </View>
                              {item.type && (
                                <View style={styles.typeBadge}>
                                  <Text style={styles.typeText}>
                                    {item.type === "EXPENSE" ? "⬇️" : "⬆️"} {item.type}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ) : (
                            // 🔄 Still processing → show loading badge (no amount/category/type)
                            <View style={styles.processingContainer}>
                              {status === 'failed' ? (
                                <View style={styles.failedBadge}>
                                  <Text style={styles.failedText}>❌ Failed</Text>
                                </View>
                              ) : (
                                <View style={styles.processingBadge}>
                                  <ActivityIndicator size="small" color="#3629B7" />
                                  <Text style={styles.processingText}>
                                    {status === 'uploading' && '📤 Uploading...'}
                                    {status === 'ai_submitting' && '🤖 Submitting...'}
                                    {status === 'ai_processing' && '⏳ AI processing...'}
                                    {message ? ` ${message}` : ''}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}

                          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
                            <Text style={styles.editButtonText}>✏️</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}
          </ScrollView>

          {selectedIds.length > 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.deleteBtn, isDeleting && styles.actionBtnDisabled]}
                onPress={handleDeleteSelected}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>{t("transaction.delete")} ({selectedIds.length})</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.approveBtn, isApproving && styles.actionBtnDisabled]}
                onPress={handleApproveSelected}
                disabled={isApproving}
              >
                {isApproving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>{t("transaction.approve")} ({selectedIds.length})</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Edit Modal (unchanged) */}
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
              />

              <Text style={styles.inputLabel}>{t("transaction.category")}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                  style={styles.picker}
                  dropdownIconColor="#3629B7"
                >
                  {CATEGORIES.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>{t("transaction.type")}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={editForm.type}
                  onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                  style={styles.picker}
                  dropdownIconColor="#3629B7"
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>{t("transaction.description")}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>{t("transaction.date")}</Text>
              <TextInput
                style={styles.input}
                value={editForm.date}
                onChangeText={(text) => setEditForm({ ...editForm, date: text })}
                placeholder="YYYY-MM-DD HH:MM"
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

const styles = StyleSheet.create({
  modal: { justifyContent: "flex-end", margin: 0 },
  container: {
    backgroundColor: "white",
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
  title: { fontWeight: "bold", color: "#3629B7", fontSize: 16 },
  selectAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#3629B7",
    borderRadius: 16,
  },
  selectAllText: {
    fontSize: 12,
    color: "#3629B7",
    fontWeight: "500",
  },
  scrollContent: { paddingBottom: 8 },
  emptyContainer: { paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#888", fontSize: 14 },

  groupContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
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
    borderBottomColor: "#e0e0e0",
  },
  groupIcon: { fontSize: 18, marginRight: 6 },
  groupTitle: { fontSize: 14, fontWeight: "600", color: "#333", flex: 1 },
  groupCount: { fontSize: 12, color: "#666" },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  checkbox: { marginRight: 12 },
  checkboxText: { fontSize: 18 },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  category: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  typeBadge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  typeText: { fontSize: 10, color: "#555" },
  editButton: { paddingHorizontal: 8, paddingVertical: 4 },
  editButtonText: { fontSize: 16, color: "#3629B7" },

  // Processing styles
  processingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  processingText: {
    fontSize: 11,
    color: '#3629B7',
    fontWeight: '500',
  },
  failedBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  failedText: {
    fontSize: 11,
    color: '#D32F2F',
    fontWeight: '500',
  },

  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: "#3629B7",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  approveBtnDisabled: { backgroundColor: "#A0A0A0", opacity: 0.7 },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnDisabled: { backgroundColor: "#A0A0A0", opacity: 0.7 },
  actionBtnText: { color: "white", textAlign: "center", fontSize: 14, fontWeight: "600" },

  // Edit modal styles (unchanged)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModalContainer: {
    backgroundColor: "white",
    width: "85%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
  },
  editTitle: { fontSize: 18, fontWeight: "bold", color: "#3629B7", marginBottom: 16, textAlign: "center" },
  inputLabel: { fontSize: 13, fontWeight: "500", color: "#333", marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: "#fff" },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  pickerContainer: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, backgroundColor: "#fff", marginBottom: 4 },
  picker: { height: 50, width: "100%", color: "#333" },
  editButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 12 },
  editCancelBtn: { flex: 1, backgroundColor: "#eee", padding: 12, borderRadius: 8, alignItems: "center" },
  editCancelText: { color: "#333", fontWeight: "500" },
  editSaveBtn: { flex: 1, backgroundColor: "#3629B7", padding: 12, borderRadius: 8, alignItems: "center" },
  editSaveText: { color: "white", fontWeight: "500" },
});