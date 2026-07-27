import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Switch 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useThemeMode } from '../../theme/ThemeProvider';
import NotificationNative from '../../notification/NotificationNative';
import { NotificationListenerService } from '../../notification/NotificationListenerService';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

const ENABLE_KEY = "notification_listener_enabled";
interface PrivacyAndSecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyAndSecurityModal: React.FC<PrivacyAndSecurityModalProps> = ({
  visible,
  onClose,
}) => {
  const { lang } = useLanguage();
  const { theme, mode } = useThemeMode();
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [enabled, setEnabled] = React.useState(false);

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
      paddingBottom: 32,
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
      fontSize: 20,
      fontWeight: '700',
      color: mode === 'dark' ? theme.text : theme.primary,
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
      color: theme.text,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 12,
    },
    switchLabel: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
      marginRight: 12,
    },
    hint: {
      marginTop: 12,
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
    },
    button: {
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 8,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  }), [theme, mode]);

  const loadEnabled = async () => {
    const val = await AsyncStorage.getItem(ENABLE_KEY);
    console.log("LOAD =", val);
    setEnabled(val === "true");
  };
  
  useEffect(() => {
    if (visible) {
      loadEnabled();
      checkPermission();
    }
  }, [visible]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (state: AppStateStatus) => {
        if (state === "active" && visible) {
          await checkPermission();
        }
      }
    );

    return () => subscription.remove();
  }, [visible]);

  const checkPermission = async () => {
    const res = await NotificationNative.hasPermission();
    setHasPermission(res);
  };

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await AsyncStorage.setItem(ENABLE_KEY, String(value));
    if (value) {
      if (!hasPermission) {
        NotificationNative.openSettings();
        return;
      }

      // ✅ chỉ init khi user bật
      NotificationListenerService.initialize();
      NotificationNative.notifyJSReady();

    } else {
      // ❌ tắt listener (bạn cần implement)
      NotificationListenerService.stop?.();
    }
  };

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
              <Text style={styles.title}>
                {t('notification.enable_bank_notification')}
              </Text>

              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={accent} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 20, width: '100%' }}>
              {/* Switch */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.switchLabel}>
                  {t('notification.enable_bank_notification')}
                </Text>

                <Switch
                  value={enabled}
                  onValueChange={handleToggle}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  ios_backgroundColor={theme.border}
                />
              </View>

              {/* Privacy */}
              <Text style={styles.hint}>
                {t('notification.notification_privacy')}
              </Text>

              {/* Guide (chỉ khi chưa có quyền) */}
              {hasPermission === false && (
                <Text style={[styles.hint, { color: '#EF4444' }]}>
                  {t('notification.notification_permission_guide')}
                </Text>
              )}
            </View>

          </KeyboardAvoidingView>
        </View>
      </BlurView>
    </Modal>
  );
};

export default PrivacyAndSecurityModal;