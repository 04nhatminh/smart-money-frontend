import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Receipt } from "../../src/types/transaction.types";
import { LinearGradient } from 'expo-linear-gradient';
import AppBottomBar from "../../src/components/AppBottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { useTabNavigation } from "../../src/hooks/useTabNavigation";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UserResponse } from '../../src/types/auth.types';
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { useAuth } from "../../src/context/AuthContext";
import { t } from "../../src/i18n";
import { userStorage } from '../../src/storage/userStorage';
import authService from '../../src/auth/authService';
import { ProfileHeader } from "../../src/components/profile/ProfileHeader";
import { StatsSection } from "../../src/components/profile/StatsSection";
import { PersonalInfo } from "../../src/components/profile/PersonalInfo";
import { AccountSettings } from "../../src/components/profile/AccountSettings";
import { SettingsModal } from "../../src/components/profile/SettingsModal";
import { EditProfileModal } from "../../src/components/profile/EditProfileModal";
import { ResetPasswordModal } from "../../src/components/profile/ResetPasswordModal";
import { NotificationsModal } from "../../src/components/profile/NotificationsModal";
import { PrivacyAndSecurityModal } from "../../src/components/profile/PrivacyAndSecurityModal";
import { ProfileActions } from "../../src/components/profile/ProfileActions";
import { useCreateTransaction } from "../../src/hooks/useCreateTransaction";

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { logout, user: currentUser } = useAuth();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const { createFromReceipt, createFromVoice } = useCreateTransaction();
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);
  const [loadingNotification, setLoadingNotification] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);


  const navigation = useTabNavigation({
    onCameraOpen: () => setCameraVisible(true),
  });
  const { lang, setLang } = useLanguage();
  const { mode, toggleMode } = useThemeMode();

  // Load user data từ context
  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await userStorage.getUser();
    setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert(t('common.error'), t('profile.profile_load_error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Đồng bộ khi currentUser thay đổi (login, logout, update)
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (notificationsModalVisible) {
      loadNotificationStatus();
    }
  }, [notificationsModalVisible]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout_title'),
      t('profile.logout_subtitle'),
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('profile.logout_confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout();
              setUser(null);
              router.replace('/auth');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('common.error'), t('profile.logout_error'));
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateReceiptTransaction = async (receipt: Receipt) => {
    const success = await createFromReceipt(receipt);
    if (success) setCameraVisible(false);
  };

  // Xử lý đổi avatar – gọi authService trực tiếp để tránh global loading state
  const handleEditAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('profile.permission_denied'), t('profile.avatar_permission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('avatar', {
          uri: asset.uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);

        setIsUpdatingAvatar(true);
        // Gọi authService trực tiếp thay vì updateUser() để tránh trigger global isLoading
        const response = await authService.updateProfile(formData);
        if (response.success && response.data) {
          // Cập nhật user state từ context
          setUser(response.data);
          // Dùng một flag để dismiss alert mà không gây navigation issues
          Alert.alert(
            t('common.name_app'),
            t('profile.avatar_success')
          );
        } else {
            Alert.alert(t('common.error'), response.message);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), t('profile.avatar_error'));
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const loadNotificationStatus = async () => {
    try {
      setLoadingNotification(true);

      const reponse = await authService.getNotificationStatus();

      if(reponse.success) {
        setNotificationEnabled(reponse.data??false);
      }

    } catch (error) {
      console.error("Load notification error:", error);
    } finally {
      setLoadingNotification(false);
    }
  };

  const handleToggleNotification = async (enabled: boolean) => {
    try {
      setLoadingNotification(true);

      let res;

      if (enabled) {
        res = await authService.enableNotification();
      } else {
        res = await authService.disableNotification();
      }

      if (res.success) {
        setNotificationEnabled(enabled);

        // update user local nếu bạn muốn sync
        setUser(prev => prev ? { ...prev, active: enabled } : prev);

      } else {
        Alert.alert(t('common.error'), res.message);
      }

    } catch (error) {
      console.error(error);
      Alert.alert(t('common.error'), "Update notification failed");
    } finally {
      setLoadingNotification(false);
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return t('profile.not_set');
    try {
      const d = date instanceof Date
        ? date
        : (() => {
            const [day, month, year] = date.split('/');
            return new Date(`${year}-${month}-${day}`);
          })();
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return t('profile.not_set');
    }
  };

  if (isLoggingOut || (loading && !user)) {
    return (
      <LinearGradient colors={['#3629B7', '#5655B9']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('profile.loading_profile')}</Text>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#3629B7', '#5655B9']} style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={100} color="#FFFFFF" />
        <Text style={styles.errorText}>{t('profile.no_user_data')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>{t('profile.retry')}</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3629B7']}
            tintColor="#3629B7"
          />
        }
      >
        <ProfileHeader
          user={user}
          onBack={() => router.back()}
          onSettings={() => setSettingsModalVisible(true)}
          onEditAvatar={handleEditAvatar}
          // 👇 Thêm prop để force refresh ảnh (nếu component hỗ trợ)
          avatarTimestamp={Date.now()} // giúp bust cache nếu dùng trong key
        />

        <StatsSection user={user} coin={user.coin || 0} />
        <PersonalInfo user={user} formatDate={formatDate} />
        <AccountSettings onEditProfile={() => setEditProfileModalVisible(true)} 
                         onResetPassword={() => setResetPasswordModalVisible(true)} 
                         onNotifications={() => setNotificationsModalVisible(true)}
                         onPrivacy={() => setPrivacyModalVisible(true)}
                        />
        <ProfileActions userId={user.id} onLogout={handleLogout} />
      </ScrollView>

      <AppBottomBar
        onCameraOpen={() => setCameraVisible(true)}
        onVoiceOpen={() => setVoiceVisible(true)}
        onFormOpen={() => setManualVisible(true)}
      />

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCaptureBill={handleCreateReceiptTransaction}
      />

      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        lang={lang}
        onLangChange={setLang}
        mode={mode}
        onModeToggle={toggleMode}
      />

      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        user={user}
        onSuccess={(updatedUser) => setUser(updatedUser)}
      />

      <ResetPasswordModal
        visible={resetPasswordModalVisible}
        onClose={() => setResetPasswordModalVisible(false)}
        onSuccess={() => {
          setResetPasswordModalVisible(false);
          Alert.alert(t('common.name_app'), t('profile.password_reset_success'));
        }}
      />

      <NotificationsModal
        visible={notificationsModalVisible}
        onClose={() => setNotificationsModalVisible(false)}
        enabled={notificationEnabled}
        loading={loadingNotification}
        onToggle={handleToggleNotification}
      />

      <PrivacyAndSecurityModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      {/* Loading overlay khi đang cập nhật avatar */}
      <Modal
        visible={isUpdatingAvatar}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.avatarUpdateOverlay}>
          <View style={styles.avatarUpdateBox}>
            <ActivityIndicator size="large" color="#3629B7" />
            <Text style={styles.avatarUpdateText}>{t('profile.avatar_updating')}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F1F9' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginTop: 20, fontSize: 18, color: '#FFFFFF', textAlign: 'center', fontWeight: '600' },
  retryButton: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: '#FFFFFF', borderRadius: 25 },
  retryButtonText: { color: '#3629B7', fontSize: 16, fontWeight: '600' },
  avatarUpdateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUpdateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 200,
  },
  avatarUpdateText: {
    marginTop: 15,
    fontSize: 16,
    color: '#3629B7',
    fontWeight: '500',
  },
});

export default ProfileScreen;