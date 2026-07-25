import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UserResponse } from '../../types/auth.types';
import { InputField } from '../InputField';
import { t } from '../../i18n';
import authService from '../../auth/authService';
import { formatDateToDDMMYYYY } from '../../utils/dateFormatter';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';
import {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import {parseDDMMYYYYHHMM } from '../../utils/dateFormatter';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: UserResponse;
  onSuccess: (updatedUser: UserResponse) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  user,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const initialDate =
  typeof user.dateOfBirth === "string"
    ? parseDDMMYYYYHHMM(user.dateOfBirth)
    : user.dateOfBirth ?? null;
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { lang } = useLanguage();
  const { theme, mode } = useThemeMode();

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
    modalContent: {
      backgroundColor: surface,
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
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: mode === 'dark' ? theme.text : theme.primary,
    },
    form: {
      maxHeight: '70%',
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: mode === 'dark' ? theme.text : theme.primary,
      marginBottom: 8,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: theme.inputBg,
      gap: 12,
    },
    dateButtonText: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
    },
    datePickerDoneButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.primary,
      borderRadius: 12,
      alignItems: 'center',
      marginVertical: 10,
    },
    datePickerDoneButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 24,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: theme.inputBg,
      borderWidth: 2,
      borderColor: accent,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: accent,
    },
    saveButton: {
      backgroundColor: theme.primary,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  }), [theme, mode]);

  useEffect(() => {
    if (visible) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setDateOfBirth(initialDate);
    }
  }, [visible, user]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const openPicker = () => {
    DateTimePickerAndroid.open({
      value: dateOfBirth ?? new Date(),
      mode: "date",
      maximumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === "set" && selectedDate) {
          setDateOfBirth(selectedDate);
        }
      },
    });
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('common.full_name') + ' ' + t('profile.required'));
      return;
    }

    try {
      setLoading(true);
      const dob = dateOfBirth
        ? formatDateToDDMMYYYY(dateOfBirth)
        : undefined;
      console.log('Submitting update with DOB:', dob);
      const updateData = {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dob
      };

      const response = await authService.updateProfile(updateData);
      if (response.success && response.data) {
        onSuccess(response.data);
        Alert.alert(t('common.name_app'), t('profile.profile_updated'));
        onClose();
      } else {
        Alert.alert(t('common.error'), response.message);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert(t('common.error'), t('profile.update_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={90} style={styles.blurContainer}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('profile.edit_profile')}</Text>
              <TouchableOpacity onPress={onClose} disabled={loading}>
                <Ionicons name="close" size={28} color={accent} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('common.full_name')}</Text>
                <InputField
                  placeholder={t('common.full_name')}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('profile.phone_number')}</Text>
                <InputField
                  placeholder={t('profile.phone_number')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* Date of Birth */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>{t('profile.date_of_birth')}</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      openPicker();
                    } else {
                      setShowDatePicker(true);
                    }
                  }}
                  disabled={loading}
                >
                  <Ionicons name="calendar-outline" size={20} color={accent} />
                  <Text style={styles.dateButtonText}>
                    {dateOfBirth
                      ? dateOfBirth.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      : t('profile.select_date')}
                  </Text>
                </TouchableOpacity>
              </View>



              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneButtonText}>{t('profile.done')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth || new Date()}
                  mode="date"
                  display={Platform.OS === 'android'
                    ? 'calendar'
                    : 'spinner'} 
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}

            {/* Action Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('profile.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};
