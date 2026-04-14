import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { type Lang } from '../../i18n';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  mode: string;
  onModeToggle: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  lang,
  onLangChange,
  mode,
  onModeToggle,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} style={styles.blurContainer}>
        <View style={styles.modalOverlay}>
          <View style={styles.settingsPanel}>
            {/* Settings Header */}
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>{t('profile.settings')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#3629B7" />
              </TouchableOpacity>
            </View>

            {/* Language Section */}
            <View style={styles.settingSection}>
              <View style={styles.settingRowHeader}>
                <Ionicons name="globe-outline" size={22} color="#3629B7" />
                <Text style={styles.settingSectionTitle}>{t('profile.language')}</Text>
              </View>
              
              <View style={styles.languageButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    lang === 'en' && styles.languageButtonActive
                  ]}
                  onPress={() => onLangChange('en')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    lang === 'en' && styles.languageButtonTextActive
                  ]}>
                    {t('profile.english')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    lang === 'vi' && styles.languageButtonActive
                  ]}
                  onPress={() => onLangChange('vi')}
                >
                  <Text style={[
                    styles.languageButtonText,
                    lang === 'vi' && styles.languageButtonTextActive
                  ]}>
                    {t('profile.vietnamese')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dark Mode Section */}
            <View style={styles.settingSection}>
              <View style={styles.settingRowHeader}>
                <Ionicons name="moon-outline" size={22} color="#3629B7" />
                <Text style={styles.settingSectionTitle}>{t('profile.dark_mode')}</Text>
              </View>

              <View style={styles.darkModeToggleContainer}>
                <View style={styles.darkModeInfo}>
                  <Text style={styles.darkModeStatus}>
                    {mode === 'dark' ? t('profile.dark_mode_on') : t('profile.dark_mode_off')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    mode === 'dark' && styles.toggleSwitchActive
                  ]}
                  onPress={onModeToggle}
                >
                  <View style={[
                    styles.toggleDot,
                    mode === 'dark' && styles.toggleDotActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.settingsCloseButton}
              onPress={onClose}
            >
              <Text style={styles.settingsCloseButtonText}>{t('profile.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  settingsPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '85%',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F1F9',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3629B7',
  },
  settingSection: {
    marginBottom: 28,
  },
  settingRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  settingSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3629B7',
  },
  languageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#3629B7',
    backgroundColor: '#3629B720',
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  languageButtonTextActive: {
    color: '#3629B7',
  },
  darkModeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F1F9',
    borderRadius: 16,
  },
  darkModeInfo: {
    flex: 1,
  },
  darkModeStatus: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3629B7',
  },
  toggleSwitch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#3629B7',
  },
  toggleDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  settingsCloseButton: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#3629B7',
    borderRadius: 20,
    alignItems: 'center',
  },
  settingsCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
