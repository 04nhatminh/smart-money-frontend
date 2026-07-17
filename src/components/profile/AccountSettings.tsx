import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';

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
        <Ionicons name="settings-outline" size={22} color="#3629B7" />
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
                colors={['#3629B7', '#5655B9']}
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
            <Ionicons name="chevron-forward" size={20} color="#A8A3D7" />
          </TouchableOpacity>
        ))}
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
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#3629B7',
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
    borderBottomColor: '#F2F1F9',
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
    color: '#3629B7',
    fontWeight: '500',
  },
  menuTextCol: {
    flex: 1,
  },
  menuDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 2,
  },
});
