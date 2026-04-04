import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F2F1F9']}
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

const styles = StyleSheet.create({
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    shadowColor: '#3629B7',
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
    color: '#3629B7',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#5655B9',
    textAlign: 'center',
  },
});
