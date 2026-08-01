import React from "react";
import { Text, View } from "react-native";
import { useProjectListStyles } from "../../styles/projectListStyles";
import { formatCurrencyVND } from "../../utils/project";
import { t } from "../../i18n";

type Props = {
  totalSaved: number;
  totalAmount: number;
};

export default function ProjectSummaryCards({
  totalSaved,
  totalAmount,
}: Props) {
  const { styles } = useProjectListStyles();

  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, styles.savedCard]}>
        <Text style={styles.summaryLabel}>{t("project.total_saved")}</Text>
        <Text style={[styles.summaryValue, styles.savedValue]}>
          {formatCurrencyVND(totalSaved)}
        </Text>
        <Text style={styles.summarySubText}>{t("project.by_month")}</Text>
      </View>

      <View style={[styles.summaryCard, styles.amountCard]}>
        <Text style={styles.summaryLabel}>{t("project.total_amount")}</Text>
        <Text style={[styles.summaryValue, styles.amountValue]}>
          {formatCurrencyVND(totalAmount)}
        </Text>
        <Text style={styles.summarySubText}>{t("project.by_month")}</Text>
      </View>
    </View>
  );
}
