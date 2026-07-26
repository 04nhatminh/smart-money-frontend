import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';

interface StatCardProps {
  icon: string;
  iconColor: string;
  backgroundColor: string;
  value: string | number;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  backgroundColor,
  value,
  label,
}) => {
  const { lang } = useLanguage();
  const { theme, mode } = useThemeMode();

  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface
  // của thẻ thống kê dùng trắng cho dễ đọc.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;
  const styles = useMemo(() => StyleSheet.create({
    statsCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 16,
      marginHorizontal: 4,
      borderRadius: 16,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    statIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: mode === 'dark' ? theme.text : theme.primary,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: theme.subtext,
      textAlign: 'center',
    },
  }), [theme, mode]);

  return (
    <LinearGradient
      colors={[surface, theme.inputBg]}
      style={styles.statsCard}
    >
      <View style={[styles.statIcon, { backgroundColor }]}>
        <Ionicons name={icon as any} size={28} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
};
