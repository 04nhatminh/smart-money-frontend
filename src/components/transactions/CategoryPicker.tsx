import React, { useState } from "react";
import { t } from "../../i18n";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_ICONS,
} from "../../constants/categories";

interface Props {
  type: "EXPENSE" | "INCOME";
  value: string;
  onChange: (value: string) => void;
}

export const CategoryPicker: React.FC<Props> = ({
  type,
  value,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);

  const categories =
    type === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <>
      <Pressable
        style={styles.input}
        onPress={() => setVisible(true)}
      >
        <Ionicons
          name={CATEGORY_ICONS[value] || "pricetag-outline"}
          size={18}
          color={value ? "#3629B7" : "#A8A3D7"}
        />

        <Text
          style={[
            styles.text,
            !value && styles.placeholder,
          ]}
        >
          {value ? t(`category.${value}`) : t("category.choose")}
        </Text>

        <Ionicons
          name="chevron-down-outline"
          size={18}
          color="#A8A3D7"
        />
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <View style={styles.sheet}>

            <View style={styles.handle} />

            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.item}
                  onPress={() => {
                    onChange(item);
                    setVisible(false);
                  }}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[item]}
                    size={20}
                    color="#3629B7"
                  />

                  <Text style={styles.itemText}>{t(`category.${item}`)}</Text>
                </Pressable>
              )}
            />

          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({

  input: {
    height: 46,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  text: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },

  placeholder: {
    color: "#B0B0B0",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "60%",
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#DDD",
    alignSelf: "center",
    borderRadius: 10,
    marginBottom: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  itemText: {
    fontSize: 16,
  },
});