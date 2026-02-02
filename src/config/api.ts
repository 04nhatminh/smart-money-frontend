// src/config/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseURL = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (apiUrl) return apiUrl;

  // Development environments
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080'; // Android Emulator
    }
    
    if (Platform.OS === 'ios') {
      // iOS Simulator
      return 'http://localhost:8080';
    }
    
    // Thiết bị thật - cần IP thật của máy host
    return 'http://192.168.1.100:8080'; // Thay bằng IP thật của bạn
  }
  
  // Production
  return 'https://api.yourdomain.com';
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 30000,
};