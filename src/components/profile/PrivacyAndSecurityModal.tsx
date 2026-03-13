import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';

interface PrivacyAndSecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyAndSecurityModal: React.FC<PrivacyAndSecurityModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={90} style={styles.blurContainer}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Header với tiêu đề và nút đóng */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('privacy.privacy_security')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#3629B7" />
              </TouchableOpacity>
            </View>

            {/* Nội dung mô tả */}
            <View style={styles.content}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#3629B7" style={styles.icon} />
              <Text style={styles.description}>
                {t('privacy.privacy_description')}
              </Text>
              <Text style={styles.description}>
                {t('security.security_description')}
              </Text>
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
    marginBottom: 12,
  },
});

export default PrivacyAndSecurityModal;