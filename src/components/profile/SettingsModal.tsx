import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { type Lang } from '../../i18n';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import { ThemeMode, themes } from '../../theme/tokens';
import { useThemeMode } from '../../theme/ThemeProvider';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  mode: ThemeMode;          // theme hiện tại
  onThemeChange: (mode: ThemeMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  lang,
  onLangChange,
  mode,
  onThemeChange,
}) => {
  const { theme } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;
  // Theme "green" có token card màu xanh đậm (dành cho accent) nên surface dùng trắng.
  const surface = mode === 'green' ? '#FFFFFF' : theme.card;

  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: surface,
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
      borderBottomColor: theme.border,
    },
    settingsTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: mode === 'dark' ? theme.text : theme.primary,
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
      color: mode === 'dark' ? theme.text : theme.primary,
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
      borderColor: theme.border,
      backgroundColor: surface,
      alignItems: 'center',
    },
    languageButtonActive: {
      borderColor: accent,
      backgroundColor: accent + '20',
    },
    languageButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.subtext,
    },
    languageButtonTextActive: {
      color: accent,
    },
    themeOptionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    themeOption: {
      alignItems: 'center',
      padding: 8,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      width: '30%',
      position: 'relative',
    },
    themeOptionSelected: {
      borderColor: accent,
      backgroundColor: accent + '15',
    },
    themePreview: {
      width: 70,
      height: 70,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    themePreviewText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    themePreviewPrimary: {
      width: 30,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
    },
    themeLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.subtext,
    },
    themeLabelSelected: {
      color: accent,
      fontWeight: '700',
    },
    themeCheck: {
      position: 'absolute',
      top: 4,
      right: 4,
    },
    settingsCloseButton: {
      marginTop: 20,
      paddingVertical: 14,
      backgroundColor: theme.primary,
      borderRadius: 20,
      alignItems: 'center',
    },
    settingsCloseButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  }), [theme, mode]);

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
            {/* Header */}
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>{t('profile.settings')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={accent} />
              </TouchableOpacity>
            </View>

            {/* Language */}
            <View style={styles.settingSection}>
              <View style={styles.settingRowHeader}>
                <Ionicons name="globe-outline" size={22} color={accent} />
                <Text style={styles.settingSectionTitle}>{t('profile.language')}</Text>
              </View>
              <View style={styles.languageButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    lang === 'en' && styles.languageButtonActive,
                  ]}
                  onPress={() => onLangChange('en')}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      lang === 'en' && styles.languageButtonTextActive,
                    ]}
                  >
                    {t('profile.english')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    lang === 'vi' && styles.languageButtonActive,
                  ]}
                  onPress={() => onLangChange('vi')}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      lang === 'vi' && styles.languageButtonTextActive,
                    ]}
                  >
                    {t('profile.vietnamese')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Theme Selector with Preview */}
            <View style={styles.settingSection}>
              <View style={styles.settingRowHeader}>
                <Ionicons name="color-palette-outline" size={22} color={accent} />
                <Text style={styles.settingSectionTitle}>{t('profile.theme')}</Text>
              </View>

              <View style={styles.themeOptionsContainer}>
                {(['light', 'dark', 'green'] as ThemeMode[]).map((themeKey) => {
                  const previewTheme = themes[themeKey];
                  const isSelected = mode === themeKey;
                  return (
                    <TouchableOpacity
                      key={themeKey}
                      style={[
                        styles.themeOption,
                        isSelected && styles.themeOptionSelected,
                      ]}
                      onPress={() => onThemeChange(themeKey)}
                    >
                      {/* Card preview mô phỏng theme */}
                      <View
                        style={[
                          styles.themePreview,
                          { backgroundColor: previewTheme.bg },
                        ]}
                      >
                        <Text style={[styles.themePreviewText, { color: previewTheme.text }]}>
                          Aa
                        </Text>
                        <View
                          style={[
                            styles.themePreviewPrimary,
                            { backgroundColor: previewTheme.primary },
                          ]}
                        />
                      </View>

                      <Text
                        style={[
                          styles.themeLabel,
                          isSelected && styles.themeLabelSelected,
                        ]}
                      >
                        {t(`profile.theme_${themeKey}`)}
                      </Text>

                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={accent}
                          style={styles.themeCheck}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Done button */}
            <TouchableOpacity style={styles.settingsCloseButton} onPress={onClose}>
              <Text style={styles.settingsCloseButtonText}>{t('profile.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};
