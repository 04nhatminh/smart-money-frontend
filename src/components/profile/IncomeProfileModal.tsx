import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { InputField } from '../InputField';
import { t } from '../../i18n';
import { UserIncomeApi } from '../../api/userIncome.api';
import { UserIncomeResponse } from '../../types/user.types';

interface IncomeProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (income: UserIncomeResponse) => void;
}

export const IncomeProfileModal: React.FC<IncomeProfileModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [netIncome, setNetIncome] = useState('');
  const [usableIncome, setUsableIncome] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [autoInvestSurplus, setAutoInvestSurplus] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const fetchIncomeProfile = async () => {
    try {
      setFetching(true);
      const res = await UserIncomeApi.getMe();
      if (res.success && res.data) {
        setNetIncome(res.data.netIncome.toString());
        setUsableIncome(res.data.usableIncome.toString());
        setCurrency(res.data.currency || 'VND');
        setAutoInvestSurplus(res.data.autoInvestSurplus || false);
        setIsUpdate(true);
      } else {
        setIsUpdate(false);
      }
    } catch (err) {
      console.log('Error fetching user income:', err);
      setIsUpdate(false);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchIncomeProfile();
    }
  }, [visible]);

  const handleSave = async () => {
    const net = parseFloat(netIncome.replace(/[^\d.]/g, ''));
    const usable = parseFloat(usableIncome.replace(/[^\d.]/g, ''));

    if (isNaN(net) || net <= 0) {
      Alert.alert(t('common.error'), t('profile.net_income_positive'));
      return;
    }

    if (isNaN(usable) || usable <= 0) {
      Alert.alert(t('common.error'), t('profile.usable_income_positive'));
      return;
    }

    if (usable > net) {
      Alert.alert(t('common.error'), t('profile.usable_exceed_net'));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        netIncome: net,
        usableIncome: usable,
        currency,
        autoInvestSurplus,
        calculationNote: 'Updated from frontend app',
      };

      let response;
      if (isUpdate) {
        response = await UserIncomeApi.update(payload);
      } else {
        response = await UserIncomeApi.create(payload);
      }

      if (response.success && response.data) {
        onSuccess?.(response.data);
        Alert.alert(t('common.name_app'), t('profile.income_saved'));
        onClose();
      } else {
        Alert.alert(t('common.error'), response.message);
      }
    } catch (error) {
      console.error('Save income profile error:', error);
      Alert.alert(t('common.error'), t('profile.income_save_failed'));
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
              <Text style={styles.title}>{t('profile.income_profile')}</Text>
              <TouchableOpacity onPress={onClose} disabled={loading || fetching}>
                <Ionicons name="close" size={28} color="#3629B7" />
              </TouchableOpacity>
            </View>

            {fetching ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#3629B7" />
                <Text style={styles.loadingText}>{t('profile.fetching_profile')}</Text>
              </View>
            ) : (
              <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                {/* Net Income */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('profile.net_income')}</Text>
                  <InputField
                    placeholder={t('profile.enter_net_income')}
                    value={netIncome}
                    onChangeText={setNetIncome}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>

                {/* Usable Income */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('profile.usable_income')}</Text>
                  <InputField
                    placeholder={t('profile.enter_usable_income')}
                    value={usableIncome}
                    onChangeText={setUsableIncome}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                </View>

                {/* Currency Selection */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('profile.currency')}</Text>
                  <View style={styles.currencyRow}>
                    {['VND', 'USD'].map((curr) => (
                      <TouchableOpacity
                        key={curr}
                        style={[
                          styles.currencyTab,
                          currency === curr && styles.currencyTabActive,
                        ]}
                        onPress={() => setCurrency(curr)}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.currencyText,
                            currency === curr && styles.currencyTextActive,
                          ]}
                        >
                          {curr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Auto Invest Surplus Switch */}
                <View style={styles.switchGroup}>
                  <View style={styles.switchLabelCol}>
                    <Text style={styles.switchLabel}>{t('profile.auto_invest_surplus')}</Text>
                    <Text style={styles.switchSubLabel}>
                      {t('profile.auto_invest_surplus_desc')}
                    </Text>
                  </View>
                  <Switch
                    value={autoInvestSurplus}
                    onValueChange={setAutoInvestSurplus}
                    disabled={loading}
                    trackColor={{ false: '#D1D5DB', true: '#3629B7' }}
                    thumbColor={autoInvestSurplus ? '#FFFFFF' : '#F4F4F5'}
                  />
                </View>
              </ScrollView>
            )}

            {/* Action Buttons */}
            {!fetching && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.saveButton,
                    loading && styles.saveButtonDisabled,
                  ]}
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
            )}
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
    fontSize: 24,
    fontWeight: '700',
    color: '#3629B7',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
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
    color: '#3629B7',
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F2F1F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  currencyTabActive: {
    backgroundColor: '#EEF0FF',
    borderColor: '#3629B7',
  },
  currencyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  currencyTextActive: {
    color: '#3629B7',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F2F1F9',
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3629B7',
    marginBottom: 4,
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#6B7280',
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
  saveButton: {
    backgroundColor: '#3629B7',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
