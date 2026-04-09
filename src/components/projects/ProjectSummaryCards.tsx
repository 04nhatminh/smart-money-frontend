import React from "react";
import { Text, View } from "react-native";
import { projectListStyles as styles } from "../../styles/projectListStyles";
import { formatCurrencyVND } from "../../utils/project";

type Props = {
    totalSaved: number;
    totalAmount: number;
};

export default function ProjectSummaryCards({ totalSaved, totalAmount }: Props) {
    return (
        <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.savedCard]}>
                <Text style={styles.summaryLabel}>Total Saved</Text>
                <Text style={[styles.summaryValue, styles.savedValue]}>
                    {formatCurrencyVND(totalSaved)}
                </Text>
                <Text style={styles.summarySubText}>
                    by month
                </Text>
            </View>

            <View style={[styles.summaryCard, styles.amountCard]}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={[styles.summaryValue, styles.amountValue]}>
                    {formatCurrencyVND(totalAmount)}
                </Text>
                <Text style={styles.summarySubText}>
                    by month
                </Text>
            </View>
        </View>
    )
}