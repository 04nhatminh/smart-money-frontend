import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';

interface ResetPasswordFormProps {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  error: string | null;
  loading: boolean;
  onResetPassword: () => void;
  countdownSeconds?: number;
  onResendCode?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  loading,
  onResetPassword,
  countdownSeconds = 600, // 10 phút mặc định
  onResendCode
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [isCountdownActive, setIsCountdownActive] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Countdown timer
  useEffect(() => {
    if (!isCountdownActive || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setIsCountdownActive(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isCountdownActive, timeLeft]);

  // Validate password
  const validatePassword = (text: string) => {
    setPassword(text);
    
    if (text.length < 6) {
      setPasswordError(t('auth.password_min_length', { min: 6 }));
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(text)) {
      setPasswordError(t('auth.password_complexity'));
    } else {
      setPasswordError('');
    }
  };

  // Validate confirm password
  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    
    if (text !== password) {
      setConfirmPasswordError(t('auth.passwords_not_match'));
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleResetPassword = () => {
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.passwords_not_match'));
      return;
    }
    
    if (passwordError) {
      return;
    }
    
    onResetPassword();
    if(error === t('auth.reset_token_expired')) {
        setIsCountdownActive(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResendCode = () => {
    if (onResendCode && !isCountdownActive) {
      setTimeLeft(countdownSeconds);
      setIsCountdownActive(true);
      onResendCode();
    }
  };

  return (
    <View style={styles.container}>
      {/* Countdown Timer */}
      <View style={styles.countdownContainer}>
        <Ionicons name="time-outline" size={20} color="#4E71FF" />
        <Text style={styles.countdownText}>
          {t('auth.code_expires_in', {minutes: formatTime(timeLeft)})}
        </Text>
      </View>

      {/* Password Field */}
      <View style={styles.field}>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
          <TextInput
            placeholder={t('common.new_password')}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={validatePassword}
            autoCapitalize="none"
          />
          <Pressable 
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.visibilityIcon}
          >
            <Ionicons 
              name={passwordVisible ? "eye-off-outline" : "eye-outline"} 
              size={18} 
              color="#6B7280" 
            />
          </Pressable>
        </View>
        {passwordError ? (
          <Text style={styles.validationError}>{passwordError}</Text>
        ) : (
          <Text style={styles.helperText}>
            {t('auth.password_hint')}
          </Text>
        )}
      </View>

      {/* Confirm Password Field */}
      <View style={styles.field}>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color="#6B7280" />
          <TextInput
            placeholder={t('common.confirm_password')}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            secureTextEntry={!confirmPasswordVisible}
            value={confirmPassword}
            onChangeText={validateConfirmPassword}
            autoCapitalize="none"
          />
          <Pressable 
            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            style={styles.visibilityIcon}
          >
            <Ionicons 
              name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"} 
              size={18} 
              color="#6B7280" 
            />
          </Pressable>
        </View>
        {confirmPasswordError && (
          <Text style={styles.validationError}>{confirmPasswordError}</Text>
        )}
      </View>

      {/* Requirements List */}
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>{t('auth.password_requirements')}:</Text>
        <View style={styles.requirementItem}>
          <Ionicons 
            name={password.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={password.length >= 6 ? "#10B981" : "#9CA3AF"} 
          />
          <Text style={styles.requirementText}>
            {t('auth.min_length', { length: 6 })}
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <Ionicons 
            name={/(?=.*[a-z])(?=.*[A-Z])/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={/(?=.*[a-z])(?=.*[A-Z])/.test(password) ? "#10B981" : "#9CA3AF"} 
          />
          <Text style={styles.requirementText}>
            {t('auth.uppercase_lowercase')}
          </Text>
        </View>
        <View style={styles.requirementItem}>
          <Ionicons 
            name={/(?=.*\d)/.test(password) ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={/(?=.*\d)/.test(password) ? "#10B981" : "#9CA3AF"} 
          />
          <Text style={styles.requirementText}>
            {t('auth.at_least_one_number')}
          </Text>
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Reset Password Button */}
      <Pressable
        style={({ pressed }) => [
          styles.resetBtn,
          pressed && styles.resetBtnPressed,
          loading && styles.disabledBtn,
          (!password || !confirmPassword || passwordError || confirmPasswordError) && styles.disabledBtn
        ]}
        onPress={handleResetPassword}
        disabled={loading || !password || !confirmPassword || !!passwordError || !!confirmPasswordError}
      >
        <Text style={styles.resetBtnText}>
          {loading ? t('common.loading') : t('auth.reset_password')}
        </Text>
      </Pressable>

      {/* Resend Code Button */}
      {onResendCode && (
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            {t('auth.didnt_receive_code')}
          </Text>
          <Pressable
            onPress={handleResendCode}
            disabled={isCountdownActive}
            style={({ pressed }) => [
              styles.resendBtn,
              pressed && styles.resendBtnPressed,
              isCountdownActive && styles.resendBtnDisabled
            ]}
          >
            <Text style={[
              styles.resendBtnText,
              isCountdownActive && styles.resendBtnTextDisabled
            ]}>
              {t('auth.resend_code')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countdownText: {
    color: '#4E71FF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  field: {
    marginBottom: 16,
  },
  inputRow: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 4,
  },
  validationError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  resetBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4E71FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4E71FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resetBtnPressed: {
    backgroundColor: '#3A56D4',
    transform: [{ scale: 0.98 }],
  },
  disabledBtn: {
    opacity: 0.5,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendBtn: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  resendBtnPressed: {
    backgroundColor: '#F3F4F6',
  },
  resendBtnDisabled: {
    opacity: 0.5,
  },
  resendBtnText: {
    color: '#4E71FF',
    fontWeight: '600',
    fontSize: 14,
  },
  resendBtnTextDisabled: {
    color: '#9CA3AF',
  },
});