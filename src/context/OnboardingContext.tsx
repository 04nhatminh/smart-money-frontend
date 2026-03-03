// src/context/OnboardingContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  isFirstLaunch: boolean | null; // Thay đổi từ boolean thành boolean | null
  setIsFirstLaunch: (value: boolean) => void;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;    
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const value = await AsyncStorage.getItem('hasLaunched');
      if (value === null) {
        // Lần đầu tiên mở app
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        // Không phải lần đầu
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false); // Mặc định là false nếu có lỗi
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setIsFirstLaunch(false);
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
    }
    catch (error) {
      console.error('Error completing onboarding:', error);
    }
    };

  const value = {
    isFirstLaunch,
    setIsFirstLaunch: async (value: boolean) => {
      setIsFirstLaunch(value);
      if (!value) {
        await AsyncStorage.setItem('hasLaunched', 'true');
      }
    },
    isLoading,
    completeOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};