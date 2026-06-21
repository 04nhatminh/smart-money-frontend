// src/config/api.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseURL = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!apiUrl) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  }
  return apiUrl;
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 60000,
};