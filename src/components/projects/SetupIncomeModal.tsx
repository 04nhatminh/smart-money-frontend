import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  View,
} from "react-native";

import { InputField } from "../InputField";
import { ButtonSave } from "../ButtonSave";

import { projectStyles as styles } from "../../styles/projectStyles";

import {
  formatNumberWithDots,
  parseCurrencyToNumber,
} from "../../utils/project";

import {
  UserIncomeApi,
} from "../../api/userIncome.api";

import { CreateIncomePayload, UserIncomeResponse } from "../../types/user.types";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function SetupIncomeModal({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const [netIncome, setNetIncome] =
    useState("");

  const [usableIncome, setUsableIncome] =
    useState("");

  const [note, setNote] = useState("");

  const [loading, setLoading] =
    useState(false);

  const handleCurrencyChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    const numeric =
      parseCurrencyToNumber(value);

    setter(
      formatNumberWithDots(numeric)
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const payload: CreateIncomePayload =
        {
          netIncome:
            parseCurrencyToNumber(
              netIncome
            ),

          usableIncome:
            parseCurrencyToNumber(
              usableIncome
            ),

          currency: "VND",

          calculationNote: note,

          autoInvestSurplus: true,
        };

      const response =
        await UserIncomeApi.create(
          payload
        );

      if (!response?.success) {
        throw new Error(
          response?.message
        );
      }

      onSuccess();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
          >
            <Text style={styles.title}>
              Setup Income
            </Text>

            <Text style={styles.name}>
              Net Income
            </Text>

            <InputField
              iconName="wallet-outline"
              placeholder="Net Income"
              value={netIncome}
              onChangeText={(value) =>
                handleCurrencyChange(
                  value,
                  setNetIncome
                )
              }
              keyboardType="numeric"
              rightText="VND"
            />

            <Text style={styles.name}>
              Usable Income
            </Text>

            <InputField
              iconName="cash-outline"
              placeholder="Usable Income"
              value={usableIncome}
              onChangeText={(value) =>
                handleCurrencyChange(
                  value,
                  setUsableIncome
                )
              }
              keyboardType="numeric"
              rightText="VND"
            />

            <Text style={styles.name}>
              Calculation Note
            </Text>

            <InputField
              iconName="document-text-outline"
              placeholder="Optional note"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 24,
              }}
            >
              <ButtonSave
                label="Cancel"
                variant="secondary"
                onPress={onClose}
              />

              <ButtonSave
                label={
                  loading
                    ? "Saving..."
                    : "Save"
                }
                onPress={handleSave}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}