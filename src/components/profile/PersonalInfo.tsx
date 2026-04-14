import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserResponse } from '../../types/auth.types';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';

interface PersonalInfoProps {
  user: UserResponse;
  formatDate: (date?: string | Date) => string;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ user, formatDate }) => {
  const { lang } = useLanguage();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="person-outline" size={22} color="#3629B7" />
        <Text style={styles.sectionTitle}>{t('profile.personal_information')}</Text>
      </View>

      <View style={styles.infoCard}>
        {/* Email */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="mail-outline" size={20} color="#3629B7" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.email_address')}</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {/* Phone */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="call-outline" size={20} color="#3629B7" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.phone_number')}</Text>
            <Text style={styles.infoValue}>{user.phone || t('profile.not_set')}</Text>
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="calendar-outline" size={20} color="#3629B7" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.date_of_birth')}</Text>
            <Text style={styles.infoValue}>{formatDate(user.dateOfBirth)}</Text>
          </View>
        </View>

        {/* Account Status */}
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <View style={styles.infoIcon}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#3629B7" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.account_status')}</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: user.active ? '#4CD964' : '#FF3B30' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: user.active ? '#4CD964' : '#FF3B30' }
              ]}>
                {user.active ? t('profile.active') : t('profile.inactive')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3629B7',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F1F9',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F1F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#A8A3D7',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#3629B7',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
