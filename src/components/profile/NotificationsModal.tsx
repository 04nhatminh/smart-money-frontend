import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';

interface NotificationsModalProps {
  visible: boolean;
  enabled: boolean;              // ✅ state thật
  loading?: boolean;             // ✅ loading
  onClose: () => void;
  onToggle: (enabled: boolean) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  enabled,
  loading = false,
  onClose,
  onToggle,
}) => {
  React.useEffect(() => {
    console.log("[NotificationsModal] visible changed to:", visible);
  }, [visible]);

  const handleToggle = (value: boolean) => {
    if (!loading) {
      onToggle(value);
    }
  };

  const { lang } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={90} style={styles.blurContainer}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('notification.notifications')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#3629B7" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Ionicons name="notifications-outline" size={48} color="#3629B7" style={styles.icon} />

              <Text style={styles.description}>
                {t('notification.notification_description')}
              </Text>

              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>
                  {enabled ? t('notification.on') : t('notification.off')}
                </Text>

                <Switch
                  value={enabled}
                  onValueChange={handleToggle}
                  disabled={loading} // ✅ disable khi đang call API
                  trackColor={{ false: '#E0E0E0', true: '#3629B7' }}
                  thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                  ios_backgroundColor="#E0E0E0"
                />
              </View>

              {/* Loading indicator */}
              {loading && (
                <Text style={{ marginTop: 10, color: '#999' }}>
                  {t('common.loading')}
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
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
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F1F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3629B7',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  icon: {
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F2F1F9',
    borderRadius: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3629B7',
  },
});

export default NotificationsModal;