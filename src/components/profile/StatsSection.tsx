import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatCard } from './StatCard';
import { UserResponse } from '../../types/auth.types';
import { t } from '../../i18n';

const { width } = Dimensions.get('window');

interface StatsSectionProps {
  user: UserResponse;
  coin: number;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ user, coin }) => {
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
        iconColor="#3629B7"
        backgroundColor="#3629B720"
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
