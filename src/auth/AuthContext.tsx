import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenStorage } from "../storage/tokenStorage";

type AuthContextType = {
  isLoading: boolean;
  isSignedIn: boolean;
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      setIsSignedIn(!!accessToken);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsSignedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await tokenStorage.clear();
    setIsSignedIn(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isSignedIn, checkAuthStatus, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}