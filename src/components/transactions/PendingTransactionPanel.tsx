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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Modal from "react-native-modal";
import { ScrollView } from "react-native";
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import PendingStorage, { PendingTransaction } from "../../storage/pendingTransactionStorage";
import { pendingEventBus } from "../../storage/pendingTransactionStorage";
import PendingService from "../../services/pendingTransaction.service";

// Helper to truncate description
const truncate = (text: string, maxLength: number = 60) => {
  if (!text) return "";
  const cleaned = text.replace(/[\n\r]+/g, " ");
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + "..." : cleaned;
};

// Category and Type options (matching your backend enums)
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
  const { lang } = useLanguage();

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

  const getBorderColor = (source?: string) => {
    switch (source) {
      case "camera":
        return "#4CAF50"; // xanh lá
      case "voice":
        return "#2196F3"; // xanh dương
      case "notification":
        return "#FF9800"; // cam
      default:
        return "#3629B7"; // màu tím mặc định
    }
  };

  // Helper lấy icon (tuỳ chọn)
  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "camera": return "📷";
      case "voice": return "🎙️";
      case "notification": return "🔔";
      default: return "📄";
    }
  };

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
          <Text style={styles.title}>{t("transaction.pending_transactions")}</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {data.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("transaction.no_pending")}</Text>
              </View>
            ) : (
              data.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const borderColor = getBorderColor(item.source);
                const sourceIcon = getSourceIcon(item.source);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      { borderColor: borderColor, borderWidth: 2 } // 👈 border màu động
                    ]}
                  >
                    <View style={styles.itemRow}>
                      <Text onPress={() => toggleSelect(item.id)} style={styles.checkbox}>
                        {isSelected ? "✅" : "⬜"}
                      </Text>
                      {/* Hiển thị icon nguồn */}
                      <Text style={styles.sourceIcon}>{sourceIcon}</Text>
                      <Text
                        style={styles.itemText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {truncate(item.description, 60)}
                      </Text>
                      <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
                        <Text style={styles.editButtonText}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {selectedIds.length > 0 && (
            <TouchableOpacity
              style={[styles.approveBtn, isApproving && styles.approveBtnDisabled]}
              onPress={handleApproveSelected}
              disabled={isApproving}
            >
              {isApproving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.approveBtnText}>{t("wait.waiting")}</Text>
                </View>
              ) : (
                <Text style={styles.approveBtnText}>
                  {t("transaction.approve")} ({selectedIds.length})
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Edit Modal with Labels and Dropdowns */}
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
              {/* Amount */}
              <Text style={styles.inputLabel}>{t("transaction.amount")}</Text>
              <TextInput
                style={styles.input}
                value={editForm.amount}
                onChangeText={(text) => setEditForm({ ...editForm, amount: text })}
                keyboardType="numeric"
                placeholder="0"
              />

              {/* Category Dropdown */}
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

              {/* Type Dropdown */}
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

              {/* Description */}
              <Text style={styles.inputLabel}>{t("transaction.description")}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                multiline
                numberOfLines={3}
              />

              {/* Date */}
              <Text style={styles.inputLabel}>{t("transaction.date")}</Text>
              <TextInput
                style={styles.input}
                value={editForm.date}
                onChangeText={(text) => setEditForm({ ...editForm, date: text })}
                placeholder="YYYY-MM-DD"
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
  title: { fontWeight: "bold", color: "#3629B7", marginBottom: 10, fontSize: 16 },
  scrollContent: { paddingBottom: 8 },
  emptyContainer: { paddingVertical: 24, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#888", fontSize: 14 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  checkbox: { fontSize: 20, marginRight: 12 },
  itemText: {
    fontSize: 12,
    color: "#333",
    flex: 1,
    fontWeight: "500",
    alignSelf: "center",
    textAlign: "center",
  },
  editButton: { paddingHorizontal: 8 },
  editButtonText: { fontSize: 18, color: "#3629B7" },

  approveBtn: {
    backgroundColor: "#3629B7",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  approveBtnDisabled: { backgroundColor: "#A0A0A0", opacity: 0.7 },
  approveBtnText: { color: "white", textAlign: "center", fontSize: 14, fontWeight: "600" },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },

  // Edit modal styles
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
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333",
  },
  sourceIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#3629B7",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // borderWidth và borderColor sẽ được set dynamic trong render
  },
  editButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 12 },
  editCancelBtn: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editCancelText: { color: "#333", fontWeight: "500" },
  editSaveBtn: {
    flex: 1,
    backgroundColor: "#3629B7",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editSaveText: { color: "white", fontWeight: "500" },
});