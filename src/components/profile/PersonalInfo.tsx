import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserResponse } from '../../types/auth.types';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';

interface PersonalInfoProps {
  user: UserResponse;
  formatDate: (date?: string | Date) => string;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ user, formatDate }) => {
  const { lang } = useLanguage();
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' || mode === 'purple' ? '#FFFFFF' : theme.card;

  const styles = useMemo(() => StyleSheet.create({
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
      color: mode === 'dark' ? theme.text : theme.primary,
    },
    infoCard: {
      backgroundColor: surface,
      borderRadius: 20,
      padding: 16,
      shadowColor: theme.primary,
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
      borderBottomColor: theme.border,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 16,
      color: theme.text,
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
  }), [theme, mode]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="person-outline" size={22} color={accent} />
        <Text style={styles.sectionTitle}>{t('profile.personal_information')}</Text>
      </View>

      <View style={styles.infoCard}>
        {/* Email */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="mail-outline" size={20} color={accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.email_address')}</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        {/* Phone */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="call-outline" size={20} color={accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.phone_number')}</Text>
            <Text style={styles.infoValue}>{user.phone || t('profile.not_set')}</Text>
          </View>
        </View>

        {/* Date of Birth */}
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="calendar-outline" size={20} color={accent} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>{t('profile.date_of_birth')}</Text>
            <Text style={styles.infoValue}>{formatDate(user.dateOfBirth)}</Text>
          </View>
        </View>

        {/* Account Status */}
        <View style={[styles.infoRow, styles.infoRowLast]}>
          <View style={styles.infoIcon}>
            <Ionicons name="checkmark-circle-outline" size={20} color={accent} />
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
