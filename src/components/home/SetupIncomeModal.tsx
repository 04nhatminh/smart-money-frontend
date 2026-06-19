import React, { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, Text, View, Switch} from "react-native";

import { InputField } from "../InputField";
import { ButtonSave } from "../ButtonSave";

import { projectStyles as styles } from "../../styles/projectStyles";

import {
  formatNumberWithDots,
  parseCurrencyToNumber,
} from "../../utils/project";

import { UserIncomeApi } from "../../api/userIncome.api";

import { CreateIncomePayload, UserIncomeResponse } from "../../types/user.types";
import { useAuth } from "../../context/AuthContext";

type Props = {
  visible: boolean;
  existingIncome?: UserIncomeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function SetupIncomeModal({
  visible,
  existingIncome,
  onClose,
  onSuccess,
}: Props) {
  const { refreshUser } = useAuth();
  const [netIncome, setNetIncome] = useState("");
  const [usableIncome, setUsableIncome] = useState("");
  const [note, setNote] = useState("");
  const [autoInvestSurplus, setAutoInvestSurplus] = useState(true);
  const [loading, setLoading] = useState(false);

  const isUpdate = !!existingIncome;

  // Pre-fill form when existing income is provided
  useEffect(() => {
    if (visible) {
      if (existingIncome) {
        setNetIncome(formatNumberWithDots(existingIncome.netIncome));
        setUsableIncome(formatNumberWithDots(existingIncome.usableIncome));
        setNote(existingIncome.calculationNote || "");
      } else {
        setNetIncome("");
        setUsableIncome("");
        setNote("");
      }
    }
  }, [visible, existingIncome]);

  const handleCurrencyChange = (value: string, setter: (v: string) => void) => {
    setter(formatNumberWithDots(parseCurrencyToNumber(value)));
  };

  const handleSave = async () => {
    const net = parseCurrencyToNumber(netIncome);
    const usable = parseCurrencyToNumber(usableIncome);

    if (!net || !usable) {
      Alert.alert("Validation", "Please enter both Net Income and Usable Income.");
      return;
    }

    try {
      setLoading(true);

      const payload: CreateIncomePayload = {
        netIncome: net,
        usableIncome: usable,
        currency: "VND",
        calculationNote: note,
        autoInvestSurplus: true,
      };

      const response = isUpdate
        ? await UserIncomeApi.update(payload)
        : await UserIncomeApi.create(payload);

      if (!response?.success) {
        Alert.alert("Error", response?.message || "Failed to save income");
        return;
      }

      await refreshUser();
      onSuccess();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to save income");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Setup Income</Text>

            {isUpdate && (
              <View style={incomeStyles.infoBanner}>
                <Text style={incomeStyles.infoBannerText}>
                  Review and update your income details before proceeding.
                </Text>
              </View>
            )}

            <Text style={styles.name}>Net Income</Text>
            <InputField
              iconName="wallet-outline"
              placeholder="e.g. 15,000,000"
              value={netIncome}
              onChangeText={(v) => handleCurrencyChange(v, setNetIncome)}
              keyboardType="numeric"
              rightText="VND"
            />

            <Text style={styles.name}>Usable Income</Text>
            <InputField
              iconName="cash-outline"
              placeholder="e.g. 10,000,000"
              value={usableIncome}
              onChangeText={(value) =>
                handleCurrencyChange(value, setUsableIncome)
              }
              keyboardType="numeric"
              rightText="VND"
            />

            <Text style={styles.name}>Calculation Note</Text>

            <InputField
              iconName="document-text-outline"
              placeholder="Optional note"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.switchGroup}>
              <View style={styles.switchLabelCol}>
                <Text style={styles.switchLabel}>
                  Auto Invest Surplus
                </Text>

                <Text style={styles.switchSubLabel}>
                  Automatically use surplus income when generating saving plans and budget suggestions.
                </Text>
              </View>

              <Switch
                value={autoInvestSurplus}
                onValueChange={setAutoInvestSurplus}
                disabled={loading}
                trackColor={{
                  false: "#D1D5DB",
                  true: "#3629B7",
                }}
                thumbColor={
                  autoInvestSurplus
                    ? "#FFFFFF"
                    : "#F4F4F5"
                }
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
              <ButtonSave
                label="Back"
                variant="secondary"
                onPress={onClose}
                disabled={loading}
              />
              <ButtonSave
                label={loading ? "Saving..." : isUpdate ? "Update & Continue" : "Save & Continue"}
                onPress={handleSave}
                disabled={loading}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

import { StyleSheet } from "react-native";

const incomeStyles = StyleSheet.create({
  infoBanner: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#4B3FD6",
  },
  infoBannerText: {
    fontSize: 13,
    color: "#3730A3",
    lineHeight: 18,
  },
});
