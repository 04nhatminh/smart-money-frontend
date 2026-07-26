import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatCard } from './StatCard';
import { UserResponse } from '../../types/auth.types';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

interface StatsSectionProps {
  user: UserResponse;
  coin: number;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ user, coin }) => {
  const { lang } = useLanguage();
  const { theme, mode } = useThemeMode();
  const roleAccent = mode === 'dark' ? theme.link : theme.primary;
  return (
    <View style={styles.statsSection}>
      <StatCard
        icon="logo-bitcoin"
        iconColor="#FFD700"
        backgroundColor="#FFD70020"
        value={coin}
        label={t('profile.total_coins')}
      />

      <StatCard
        icon="star"
        iconColor="#4CD964"
        backgroundColor="#4CD96420"
        value={(user.rate || 0).toFixed(1)}
        label={t('profile.average_rating')}
      />

      <StatCard
        icon="shield-checkmark"
        iconColor={roleAccent}
        backgroundColor={roleAccent + '20'}
        value={user.role}
        label={t('profile.user_role')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
  },
});
