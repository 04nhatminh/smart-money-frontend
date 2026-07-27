import React, { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { InputField } from "../InputField";
import { ButtonSave } from "../ButtonSave";
import ConfirmExitModal from "../ConfirmExitModal";
import SuccessModal from "../SuccessModal";
import { budgetAPI, BudgetItem } from "../../api/budget.api";
import { dataRefreshEmitter, FINANCIAL_DATA_UPDATED } from "../../utils/dataRefreshEmitter";
import { t } from "../../i18n";
import { useThemeMode } from "../../theme/ThemeProvider";

interface EditBudgetModalProps {
    visible: boolean;
    budget: BudgetItem;
    onClose: () => void;
    onUpdated?: (updated: BudgetItem) => void;
}

export default function EditBudgetModal({
    visible,
    budget,
    onClose,
    onUpdated,
}: EditBudgetModalProps) {
    const { theme, mode } = useThemeMode();

    // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
    const accent = mode === "dark" ? theme.link : theme.primary;
    // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
    const surface = mode === "green" ? "#FFFFFF" : theme.card;

    const styles = useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            paddingHorizontal: 20,
        },
        container: {
            backgroundColor: surface,
            borderRadius: 20,
            padding: 20,
        },
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        title: {
            fontSize: 18,
            fontWeight: "700",
            color: theme.text,
        },
        desc: {
            fontSize: 13,
            color: theme.subtext,
            marginBottom: 16,
        },
        label: {
            fontSize: 13,
            fontWeight: "600",
            color: theme.text,
            marginBottom: 6,
        },
        buttonRow: {
            flexDirection: "row",
            gap: 12,
            marginTop: 8,
        },
    }), [theme, mode]);

    const [amountLimit, setAmountLimit] = useState(String(budget.amountLimit));
    const [error, setError] = useState<string | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [updatedBudget, setUpdatedBudget] = useState<BudgetItem | null>(null);

    useEffect(() => {
        if (visible) {
            setAmountLimit(String(budget.amountLimit));
            setError(undefined);
            setShowConfirm(false);
            setShowSuccess(false);
        }
    }, [visible, budget.amountLimit]);

    const validate = () => {
        if (!amountLimit.trim()) {
            setError(t("budget.amount_limit_required"));
            return false;
        }
        const value = Number(amountLimit);
        if (isNaN(value) || value <= 0) {
            setError(t("budget.amount_limit_invalid"));
            return false;
        }
        return true;
    };

    const handleSavePress = () => {
        if (!validate()) return;
        setShowConfirm(true);
    };

    const handleConfirmUpdate = async () => {
        setShowConfirm(false);
        try {
            setSaving(true);
            const res = await budgetAPI.updateBudget(budget.budgetId, {
                amountLimit: Number(amountLimit),
            });

            if (res.success && res.data) {
                dataRefreshEmitter.emit(FINANCIAL_DATA_UPDATED);
                setUpdatedBudget(res.data);
                setShowSuccess(true);
            } else {
                Alert.alert(t("common.error"), res.message || t("budget.update_failed"));
            }
        } catch (err) {
            console.error("Failed to update budget:", err);
            Alert.alert(t("common.error"), t("budget.update_failed"));
        } finally {
            setSaving(false);
        }
    };

    const handleSuccessDone = () => {
        setShowSuccess(false);
        if (updatedBudget) onUpdated?.(updatedBudget);
        onClose();
    };

    return (
        <>
            <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{t("budget.edit_budget")}</Text>
                            <Pressable onPress={onClose} hitSlop={10}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </Pressable>
                        </View>

                        <Text style={styles.desc}>{t("budget.edit_budget_desc")}</Text>

                        <Text style={styles.label}>{t("budget.amount_limit")}</Text>
                        <InputField
                            iconName="cash-outline"
                            placeholder={t("budget.amount_limit")}
                            value={amountLimit}
                            onChangeText={(text) => {
                                setAmountLimit(text);
                                setError(undefined);
                            }}
                            keyboardType="numeric"
                            rightText="VND"
                            error={error}
                        />

                        <View style={styles.buttonRow}>
                            <ButtonSave
                                label={t("common.cancel")}
                                variant="secondary"
                                onPress={onClose}
                                disabled={saving}
                            />
                            <ButtonSave
                                label={t("common.save")}
                                variant="primary"
                                onPress={handleSavePress}
                                loading={saving}
                                loadingText={t("common.saving")}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <ConfirmExitModal
                visible={showConfirm}
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleConfirmUpdate}
                title={t("budget.confirm_update_title")}
                description={t("budget.confirm_update_desc")}
                cancelText={t("common.cancel")}
                confirmText={t("common.update")}
                confirmVariant="primary"
            />

            <SuccessModal
                visible={showSuccess}
                onDone={handleSuccessDone}
                title={t("budget.update_success")}
                description={t("budget.update_success_desc")}
            />
        </>
    );
}

