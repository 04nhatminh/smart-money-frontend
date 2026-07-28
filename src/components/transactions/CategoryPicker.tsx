import React, { useMemo, useState } from "react";
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
import { useThemeMode } from "../../theme/ThemeProvider";

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
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === "dark" ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === "green" || mode === "purple" ? "#FFFFFF" : theme.card;

  const styles = useMemo(() => StyleSheet.create({
    input: {
      height: 46,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },

    text: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },

    placeholder: {
      color: theme.subtext,
    },

    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "flex-end",
    },

    sheet: {
      backgroundColor: surface,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      padding: 20,
      maxHeight: "60%",
    },

    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.border,
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
      borderBottomColor: theme.border,
    },

    itemText: {
      fontSize: 16,
      color: theme.text,
    },
  }), [theme, mode]);

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
          color={value ? accent : theme.subtext}
        />

        <Text
          style={[
            styles.text,
            !value && styles.placeholder,
          ]}
        >
          {value ? t(`transaction.${value}`) : t("transaction.choose")}
        </Text>

        <Ionicons
          name="chevron-down-outline"
          size={18}
          color={theme.subtext}
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
                    color={accent}
                  />

                  <Text style={styles.itemText}>{t(`transaction.${item}`)}</Text>
                </Pressable>
              )}
            />

          </View>
        </Pressable>
      </Modal>
    </>
  );
};
