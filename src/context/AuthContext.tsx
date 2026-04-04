import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenStorage } from "../storage/tokenStorage";
import { userStorage } from "../storage/userStorage";
import authService from "../auth/authService";
import { UserResponse, UpdateUserRequest } from "../types/auth.types";

type AuthContextType = {
  isLoading: boolean;
  isSignedIn: boolean;
  user: UserResponse | null;
  checkAuthStatus: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (data: UpdateUserRequest | FormData) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);

  // Initialize auth service
  useEffect(() => {
    authService.init();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Load user state from storage
      const state = await authService.loadUserFromStorage();
      const accessToken = await tokenStorage.getAccessToken();
      const userData = await userStorage.getUser();
      
      // Check if token is valid
      const isValid = accessToken ? !authService.isTokenExpired(accessToken) : false;
      
      setIsSignedIn(isValid);
      setUser(userData);
      
      // If token is expired but refresh token exists, try to refresh
      if (accessToken && !isValid) {
        const refreshed = await authService.refreshTokenIfNeeded();
        if (refreshed) {
          const newUserData = await userStorage.getUser();
          setUser(newUserData);
          setIsSignedIn(true);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsSignedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      
      if (response.success) {
        const userData = await userStorage.getUser();
        setUser(userData);
        setIsSignedIn(true);
      }
      
      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local data even if API fails
      await authService.clearAuthData();
    } finally {
      setUser(null);
      setIsSignedIn(false);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await userStorage.getUser();
      setUser(userData);
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const updateUser = async (data: UpdateUserRequest | FormData) => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(data);
      
      if (response.success && response.data) {
        await userStorage.setUser(response.data);
        setUser(response.data);
      }
      
      return response;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoading, 
        isSignedIn, 
        user,
        checkAuthStatus, 
        login,
        logout,
        refreshUser,
        updateUser
      }}
    >
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