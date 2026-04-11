import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { UserResponse } from '../../types/auth.types';

const { width } = Dimensions.get('window');

interface ProfileHeaderProps {
  user: UserResponse;
  onBack: () => void;
  onSettings: () => void;
  onEditAvatar?: () => void;
  avatarTimestamp?: number; // To force refresh avatar when it changes
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onBack,
  onSettings,
  onEditAvatar,
  avatarTimestamp = Date.now(), // To force refresh avatar when it changes
}) => {
  return (
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
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Settings Button */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={onSettings}
      >
        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          {user.avatar ? (
            <Image
            source={{ uri: user.avatar + '?t=' + avatarTimestamp }}
            style={styles.avatar}
            />
          ) : (
            <LinearGradient
              colors={['#A8A3D7', '#F2F1F9']}
              style={styles.avatarPlaceholder}
            >
              <Ionicons name="person" size={50} color="#3629B7" />
            </LinearGradient>
          )}
          <TouchableOpacity 
            style={styles.editAvatarButton}
            onPress={onEditAvatar}
          >
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
  );
};

const styles = StyleSheet.create({
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
});
