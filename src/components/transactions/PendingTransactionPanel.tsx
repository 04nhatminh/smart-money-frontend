import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";
import PendingService from "../../services/pendingTransaction.service";
import { ScrollView } from "react-native";
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import PendingStorage, { PendingTransaction } from "../../storage/pendingTransactionStorage"; 
import { pendingEventBus } from "../../storage/pendingTransactionStorage";

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
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };
  
  const handleApproveSelected = async () => {
    if (isApproving) return; // Prevent duplicate clicks
    
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
    <Modal
      isVisible={visible}
      onBackdropPress={() => setVisible(false)}
      style={styles.modal}
      swipeDirection="down"
      onSwipeComplete={() => setVisible(false)}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{t("transaction.pending_transactions")}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {data.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t("transaction.no_pending")}
              </Text>
            </View>
          ) : (
            data.map((item) => {
              const isSelected = selectedIds.includes(item.id);

              return (
                <View key={item.id} style={styles.itemRow}>
                  <Text
                    onPress={() => toggleSelect(item.id)}
                    style={styles.checkbox}
                  >
                    {isSelected ? "✅" : "⬜"}
                  </Text>

                  <Text style={styles.itemText}>
                    {item.description}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      {selectedIds.length > 0 && (
        <TouchableOpacity
          style={[
            styles.approveBtn,
            isApproving && styles.approveBtnDisabled,
          ]}
          onPress={handleApproveSelected}
          disabled={isApproving}
        >
          {isApproving ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.approveBtnText}>
                {t("wait.waiting")}
              </Text>
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
  );
});

export default PendingTransactionPanel;

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "white",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "75%",
  },
  title: {
    fontWeight: "bold",
    color: "#3629B7",
    marginBottom: 10,
    fontSize: 16,
  },
  item: {
    marginBottom: 10,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: "#888",
    fontSize: 14,
  },
  itemText: {
    fontSize: 14,
    color: "#333",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  checkbox: {
    fontSize: 18,
    marginRight: 12,
  },
  approveBtn: {
    backgroundColor: "#3629B7",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  approveBtnDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
  approveBtnText: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});