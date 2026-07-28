import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';

interface MenuItem {
  icon: string;
  label: string;
  description?: string;
  onPress?: () => void;
}

interface AccountSettingsProps {
  menuItems?: MenuItem[];
  onEditProfile?: () => void;
  onResetPassword?: () => void;
  onNotifications?: () => void;
  onPrivacy?: () => void;
  onFinancialSetup?: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  menuItems,
  onEditProfile,
  onResetPassword,
  onNotifications,
  onPrivacy,
  onFinancialSetup,
}) => {
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
    menuCard: {
      backgroundColor: surface,
      borderRadius: 20,
      padding: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    menuItemLast: {
      borderBottomWidth: 0,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    menuIconGradient: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuText: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '500',
    },
    menuTextCol: {
      flex: 1,
    },
    menuDesc: {
      fontSize: 12,
      color: theme.subtext,
      lineHeight: 17,
      marginTop: 2,
    },
  }), [theme, mode]);

  const DEFAULT_MENU_ITEMS: MenuItem[] = [
    { icon: 'create-outline', label: t('profile.edit_profile'), onPress: onEditProfile },
    {
      icon: 'wallet-outline',
      label: t("financialSetup.card_title"),
      description:  t("financialSetup.empty_desc"),
      onPress: onFinancialSetup,
    },
    { icon: 'key-outline', label: t('profile.change_password'), onPress: onResetPassword },
    { icon: 'notifications-outline', label: t('profile.notifications'), onPress: onNotifications },
    { icon: 'shield-outline', label: t('profile.privacy_security'), onPress: onPrivacy },
  ];

  const items = menuItems || DEFAULT_MENU_ITEMS;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="settings-outline" size={22} color={accent} />
        <Text style={styles.sectionTitle}>{t('profile.account_settings')}</Text>
      </View>

      <View style={styles.menuCard}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.menuItemLast
            ]}
            onPress={() => {
              console.log("[AccountSettings] Press:", item.label);
              item.onPress?.();
            }}
          >
            <View style={styles.menuLeft}>
              <LinearGradient
                colors={[theme.primary, theme.link]}
                style={styles.menuIconGradient}
              >
                <Ionicons name={item.icon as any} size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuText}>{item.label}</Text>
                {!!item.description && (
                  <Text style={styles.menuDesc}>{item.description}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
