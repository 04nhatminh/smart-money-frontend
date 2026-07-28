import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';

interface ProfileActionsProps {
  userId?: string;
  onLogout: () => void;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({ userId, onLogout }) => {
  const { lang } = useLanguage();
  const { theme, mode } = useThemeMode();

  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' || mode === 'purple' ? '#FFFFFF' : theme.card;

  const styles = useMemo(() => StyleSheet.create({
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surface,
      marginHorizontal: 20,
      marginTop: 10,
      paddingVertical: 16,
      borderRadius: 30,
      borderWidth: 1.5,
      borderColor: '#FF3B30',
      gap: 10,
      shadowColor: '#FF3B30',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    logoutButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FF3B30',
    },
    versionContainer: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    versionText: {
      fontSize: 12,
      color: theme.subtext,
      marginBottom: 4,
    },
  }), [theme, mode]);

  return (
    <>
      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
        <Text style={styles.logoutButtonText}>{t('profile.sign_out')}</Text>
      </TouchableOpacity>

      {/* Version Info */}
      <View style={styles.versionContainer}>
        {userId && (
          <Text style={styles.versionText}>
            {t('profile.user_id')}: {userId.slice(0, 8)}...{userId.slice(-4)}
          </Text>
        )}
        <Text style={styles.versionText}>{t('profile.version')}</Text>
      </View>
    </>
  );
};
