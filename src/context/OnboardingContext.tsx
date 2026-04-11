import React, { createContext, useState, useContext, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface OnboardingContextType {
  isFirstLaunch: boolean | null;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem("hasLaunched");

        setIsFirstLaunch(value === null);

      } catch (error) {
        console.error("Error checking first launch:", error);
        setIsFirstLaunch(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFirstLaunch();
  }, []);

  const completeOnboarding = async () => {
    setIsFirstLaunch(false);

    try {
      await AsyncStorage.setItem("hasLaunched", "true");
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const value = useMemo(
    () => ({
      isFirstLaunch,
      isLoading,
      completeOnboarding,
    }),
    [isFirstLaunch, isLoading]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};