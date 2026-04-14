import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../InputField';
import authService from '../../auth/authService';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';

type Step = 'confirm' | 'otp' | 'reset';

interface ResetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>('confirm');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();
  // Load user email when modal becomes visible
  useEffect(() => {
    if (visible) {
      const loadUser = async () => {
        const user = await authService.getCurrentUser();
        if (user?.email) {
          setEmail(user.email);
        }
      };
      loadUser();
      // Reset state to confirm step
      setStep('confirm');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible]);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('profile.email_required'));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword({ email });
      if (response.success) {
        setStep('otp');
      } else {
        Alert.alert(t('common.error'), response.message || t('profile.send_otp_failed'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.send_otp_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert(t('common.error'), t('profile.otp_required'));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyResetPassword({ email, otp });
      if (response.success) {
        setStep('reset');
      } else {
        Alert.alert(t('common.error'), response.message || t('profile.verify_otp_failed'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.verify_otp_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('profile.password_required'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('profile.password_mismatch'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profile.password_min_length'));
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({ email, newPassword });
      if (response.success) {
        Alert.alert(t('common.name_app'), t('profile.password_changed'));
        onSuccess?.();
        onClose();
      } else {
        Alert.alert(t('common.error'), response.message || t('profile.reset_password_failed'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.reset_password_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') setStep('confirm');
    else if (step === 'reset') setStep('otp');
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const renderConfirmStep = () => (
    <>
      <View style={styles.content}>
        <Ionicons name="lock-closed-outline" size={48} color="#3629B7" style={styles.icon} />
        <Text style={styles.message}>
          {t('profile.confirm_password_change', { email })}
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>{t('profile.agree')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderOtpStep = () => (
    <>
      <View style={styles.header}>
        {step !== 'confirm' && (
          <TouchableOpacity onPress={handleBack} disabled={loading}>
            <Ionicons name="arrow-back" size={24} color="#3629B7" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t('profile.verify_otp')}</Text>
        <TouchableOpacity onPress={handleClose} disabled={loading}>
          <Ionicons name="close" size={28} color="#3629B7" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('profile.enter_otp')}</Text>
          <InputField
            placeholder={t('profile.otp')}
            value={otp}
            onChangeText={setOtp}
            editable={!loading}
          />
          <Text style={styles.hint}>
            {t('profile.otp_sent_to', { email })}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>{t('profile.verify')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderResetStep = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color="#3629B7" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.reset_password')}</Text>
        <TouchableOpacity onPress={handleClose} disabled={loading}>
          <Ionicons name="close" size={28} color="#3629B7" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('profile.new_password')}</Text>
          <InputField
            placeholder={t('profile.new_password')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('profile.confirm_password')}</Text>
          <InputField
            placeholder={t('profile.confirm_password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>{t('profile.reset')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <BlurView intensity={90} style={styles.blurContainer}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {step === 'confirm' && renderConfirmStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'reset' && renderResetStep()}
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
    maxHeight: '90%',
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
    paddingVertical: 32,
  },
  icon: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    maxHeight: '60%',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3629B7',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#F2F1F9',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F1F9',
    borderWidth: 2,
    borderColor: '#3629B7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3629B7',
  },
  confirmButton: {
    backgroundColor: '#3629B7',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});