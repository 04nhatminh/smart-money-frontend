import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomBar } from "../../src/components/BottomBar";
import { CameraModal } from "../../src/components/transactions/camera/CameraModal";
import { useTabNavigation } from "../../src/hooks/useTabNavigation";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { UserResponse } from '../../src/types/auth.types';
import { Receipt } from '../../src/types/transaction.types';
import { RefreshControl } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { useThemeMode } from "../../src/theme/ThemeProvider";
import { Modal } from 'react-native';
import {useAuth} from "../../src/context/AuthContext";
import { useOnboarding } from '../../src/context/OnboardingContext';
import transactionApi from "../../src/api/transaction.api";


const { width, height } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { logout, checkAuthStatus, user: currentUser } = useAuth();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [stats, setStats] = useState({
    coin: 0,
    rate: 0,
  });
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);


  const navigation = useTabNavigation(() => setCameraVisible(true));
  const { lang, setLang } = useLanguage();
  const { mode, toggleMode } = useThemeMode();

  // Load user data
  const loadUserData = async () => {
    try {
      setLoading(true);

      if (currentUser) {
        setUser(currentUser);
        setStats({
          coin: currentUser.coin || 0,
          rate: currentUser.rate || 0,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setStats({
        coin: currentUser.coin || 0,
        rate: currentUser.rate || 0,
      });
      setLoading(false);
    } else {
      // Nếu không có currentUser (đã logout), set user về null
      setUser(null);
      setLoading(false);
    }
  }, [currentUser]);

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout(); // Logout từ context
              
              // Reset local state ngay lập tức
              setUser(null);
              setStats({ coin: 0, rate: 0 });
              
              // Điều hướng về màn hình auth
              router.replace('/(auth)/auth');
              
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // Handle capture bill
  const handleCaptureBill = async (receipt: Receipt) => {
    console.log("🚀 profile.handleCaptureBill called");
    try {
      const parseReceiptDate = (input: string): string => {
        // Input format: "28/02/2026"
        // Expected backend format: "dd/MM/yyyy HH:mm"
        const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy;
          return `${day}/${month}/${year} 00:00`;
        }
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const h = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${d}/${m}/${y} ${h}:${min}`;
      };

      const transactionType = receipt.type === "Income" ? "INCOME" as const : "EXPENSE" as const;
      const payload = {
        amount: receipt.amount,
        type: transactionType,
        category: receipt.category.toUpperCase(),
        description: receipt.description?.trim() || receipt.transactionName,
        date: parseReceiptDate(receipt.date),
      };
      console.log("📤 Creating transaction with payload:", JSON.stringify(payload, null, 2));
      
      const result = await transactionApi.create(payload);
      console.log("📥 API Response:", result);

      if (!result.success) {
        const errorMsg = result.message || "Tao giao dich that bai";
        console.error("❌ Transaction creation failed:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("✅ Transaction created successfully:", result.data);
      Alert.alert("Success", "Transaction created successfully");
      setCameraVisible(false);
    } catch (error: any) {
      const message = error?.message || "Failed to create transaction";
      console.error("❌ Error in handleCaptureBill:", error);
      Alert.alert("Error", message);
      throw error;
    }
  };

  // Format date
  const formatDate = (date?: string | Date) => {
    if (!date) return 'Not set';

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
      return 'Not set';
    }
  };

  const background_profile = require("../../assets/profile-background.jpg");

  // Render loading state
  if (isLoggingOut || (loading && !user)) {
    return (
      <LinearGradient
        colors={['#3629B7', '#5655B9']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </LinearGradient>
    );
  }

  // Render when user is not found
  if (!user) {
    return (
      <LinearGradient
        colors={['#3629B7', '#5655B9']}
        style={styles.errorContainer}
      >
        <Ionicons name="person-circle-outline" size={100} color="#FFFFFF" />
        <Text style={styles.errorText}>No user data found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
          <Text style={styles.retryButtonText}>Retry</Text>
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
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={['#3629B7', '#5655B9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Decorative Circles */}
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setSettingsModalVisible(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={['#A8A3D7', '#F2F1F9']}
                  style={styles.avatarPlaceholder}
                >
                  <Ionicons name="person" size={50} color="#3629B7" />
                </LinearGradient>
              )}
              <TouchableOpacity style={styles.editAvatarButton}>
                <LinearGradient
                  colors={['#3629B7', '#5655B9']}
                  style={styles.editAvatarGradient}
                >
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userUsername}>@{user.username}</Text>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < Math.floor(user.rate || 0) ? "star" : "star-outline"}
                  size={18}
                  color="#FFD700"
                />
              ))}
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{(user.rate || 0).toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section with Cards */}
        <View style={styles.statsSection}>
          <LinearGradient
            colors={['#FFFFFF', '#F2F1F9']}
            style={styles.statsCard}
          >
            <View style={[styles.statIcon, { backgroundColor: '#FFD70020' }]}>
              <Ionicons name="logo-bitcoin" size={28} color="#FFD700" />
            </View>
            <Text style={styles.statValue}>{stats.coin}</Text>
            <Text style={styles.statLabel}>Total Coins</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F2F1F9']}
            style={styles.statsCard}
          >
            <View style={[styles.statIcon, { backgroundColor: '#4CD96420' }]}>
              <Ionicons name="star" size={28} color="#4CD964" />
            </View>
            <Text style={styles.statValue}>{user.rate?.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FFFFFF', '#F2F1F9']}
            style={styles.statsCard}
          >
            <View style={[styles.statIcon, { backgroundColor: '#3629B720' }]}>
              <Ionicons name="shield-checkmark" size={28} color="#3629B7" />
            </View>
            <Text style={styles.statValue}>{user.role}</Text>
            <Text style={styles.statLabel}>User Role</Text>
          </LinearGradient>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={22} color="#3629B7" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail-outline" size={20} color="#3629B7" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={20} color="#3629B7" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{user.phone || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color="#3629B7" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>{formatDate(user.dateOfBirth)}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#3629B7" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: user.active ? '#4CD964' : '#FF3B30' }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: user.active ? '#4CD964' : '#FF3B30' }
                  ]}>
                    {user.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Account Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={22} color="#3629B7" />
            <Text style={styles.sectionTitle}>Account Settings</Text>
          </View>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <LinearGradient
                  colors={['#3629B7', '#5655B9']}
                  style={styles.menuIconGradient}
                >
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.menuText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A8A3D7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <LinearGradient
                  colors={['#3629B7', '#5655B9']}
                  style={styles.menuIconGradient}
                >
                  <Ionicons name="key-outline" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.menuText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A8A3D7" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <LinearGradient
                  colors={['#3629B7', '#5655B9']}
                  style={styles.menuIconGradient}
                >
                  <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.menuText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A8A3D7" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]}>
              <View style={styles.menuLeft}>
                <LinearGradient
                  colors={['#3629B7', '#5655B9']}
                  style={styles.menuIconGradient}
                >
                  <Ionicons name="shield-outline" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.menuText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A8A3D7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>ID: {user.id?.slice(0, 8)}...{user.id?.slice(-4)}</Text>
          <Text style={styles.versionText}>Version 2.0.0</Text>
        </View>
      </ScrollView>
      <BottomBar
        active={navigation.activeTab}
        handlers={{
          onHome: () => router.push('/(tabs)'),
          onStats: () => router.push('/(tabs)/stats'),
          onAdd: () => setCameraVisible(true),
          onWallet: () => router.push('/(tabs)/wallet'),
          onProfile: () => {},
          onTransaction: () => router.push('/(tabs)/transactions'),
        }}
      />

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCaptureBill={handleCaptureBill}
      />

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <BlurView intensity={90} style={styles.blurContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.settingsPanel}>
              {/* Settings Header */}
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>Settings</Text>
                <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#3629B7" />
                </TouchableOpacity>
              </View>

              {/* Language Section */}
              <View style={styles.settingSection}>
                <View style={styles.settingRowHeader}>
                  <Ionicons name="globe-outline" size={22} color="#3629B7" />
                  <Text style={styles.settingSectionTitle}>Language</Text>
                </View>
                
                <View style={styles.languageButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.languageButton,
                      lang === 'en' && styles.languageButtonActive
                    ]}
                    onPress={() => setLang('en')}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      lang === 'en' && styles.languageButtonTextActive
                    ]}>
                      English
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.languageButton,
                      lang === 'vi' && styles.languageButtonActive
                    ]}
                    onPress={() => setLang('vi')}
                  >
                    <Text style={[
                      styles.languageButtonText,
                      lang === 'vi' && styles.languageButtonTextActive
                    ]}>
                      Tiếng Việt
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dark Mode Section */}
              <View style={styles.settingSection}>
                <View style={styles.settingRowHeader}>
                  <Ionicons name="moon-outline" size={22} color="#3629B7" />
                  <Text style={styles.settingSectionTitle}>Dark Mode</Text>
                </View>

                <View style={styles.darkModeToggleContainer}>
                  <View style={styles.darkModeInfo}>
                    <Text style={styles.darkModeStatus}>
                      {mode === 'dark' ? 'Dark mode is ON' : 'Dark mode is OFF'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggleSwitch,
                      mode === 'dark' && styles.toggleSwitchActive
                    ]}
                    onPress={toggleMode}
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
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={styles.settingsCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F1F9',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#3629B7',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  headerCircle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -width * 0.1,
    left: -width * 0.2,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editAvatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    color: '#F2F1F9',
    marginBottom: 12,
    opacity: 0.9,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3629B7',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#5655B9',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3629B7',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F1F9',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F1F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#A8A3D7',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#3629B7',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F1F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 15,
    color: '#3629B7',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    gap: 10,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 12,
    color: '#A8A3D7',
    marginBottom: 4,
  },
  // Settings Modal Styles
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

export default ProfileScreen;