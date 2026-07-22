import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenStorage } from "../storage/tokenStorage";
import { userStorage } from "../storage/userStorage";
import authService from "../auth/authService";
import AuthApi from "../api/auth.api";
import { UserResponse, UpdateUserRequest } from "../types/auth.types";
import { initWebSocket, disconnectWebSocket } from "../services/websocket";
import { resumeUnfinishedJobs } from "../services/backgroundAIHandler";

type AuthContextType = {
  isLoading: boolean;
  isSignedIn: boolean;
  user: UserResponse | null;
  checkAuthStatus: () => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserResponse | null>;
  updateCachedUser: (data: Partial<UserResponse>) => Promise<UserResponse | null>;
  updateUser: (data: UpdateUserRequest | FormData) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);

  // Initialize auth service
  useEffect(() => {
    console.log("🔐 [AuthProvider] Mounted, checking auth status...");
    checkAuthStatus();
  }, []);

const loadCurrentUser = async () => {
  const response = await AuthApi.getCurrentUser();

  if (response.success && response.data) {
    const latestUser = authService.normalizeUser(response.data);
    await userStorage.setUser(latestUser);
    return latestUser;
  }

  return authService.getCurrentUser();
};

const checkAuthStatus = async () => {
  try {
    setIsLoading(true);

    const accessToken = await tokenStorage.getAccessToken();
    const refreshToken = await tokenStorage.getRefreshToken();

    console.log("🔍 [AuthProvider] Checking auth status...")
    console.log("🔍 [AuthProvider] Access Token:", accessToken ? "exists" : "null");
    console.log("🔍 [AuthProvider] Refresh Token:", refreshToken ? "exists" : "null");

    if (!accessToken && !refreshToken) {
      console.log("🔍 [AuthProvider] No tokens found, signing out");
      setIsSignedIn(false);
      setUser(null);
      return;
    }

    // ✅ Access token còn hạn
    if (accessToken && !authService.isTokenExpired(accessToken)) {
      console.log("✅ [AuthProvider] Access token valid");
      const userData = await loadCurrentUser();
      setUser(userData);
      setIsSignedIn(true);
      
      // 🔌 Initialize WebSocket for authenticated user
      if (userData?.id) {
        try {
          await initWebSocket(userData.id);
          console.log("✅ [AuthProvider] WebSocket initialized");
        } catch (err) {
          console.error("❌ [AuthProvider] WebSocket init failed:", err);
        }
      }

      // 🔄 Resume unfinished AI jobs
      await resumeUnfinishedJobs();

      return;
    }

    if (refreshToken) {
      try {
        console.log("🔄 [AuthProvider] Refreshing token...");

        const res = await authService.refreshToken({ refreshToken });

        if (res.success && res.data) {
          console.log("✅ [AuthProvider] Token refreshed successfully");
          await tokenStorage.setAccessToken(res.data.accessToken);

          if (res.data.refreshToken) {
            await tokenStorage.setRefreshToken(res.data.refreshToken);
          }

          const userData = await loadCurrentUser();
          setUser(userData);
          setIsSignedIn(true);
          
          // 🔌 Initialize WebSocket after token refresh
          if (userData?.id) {
            try {
              await initWebSocket(userData.id);
              console.log("✅ [AuthProvider] WebSocket initialized after refresh");
            } catch (err) {
              console.error("❌ [AuthProvider] WebSocket init failed:", err);
            }
          }

          // 🔄 Resume unfinished AI jobs
          await resumeUnfinishedJobs();

          return;
        }

        // ❗ chỉ clear nếu BE trả invalid refresh token
        if (!res.success && res.message === "INVALID_REFRESH_TOKEN") {
          console.log("❌ [AuthProvider] Refresh token invalid");
          await authService.clearAuthData();
          setUser(null);
          setIsSignedIn(false);
          return;
        }

      } catch (e) {
        console.log("❌ [AuthProvider] Refresh failed (network?) → KEEP TOKEN");
        
        // ❗ KHÔNG clear token ở đây
        setIsSignedIn(false);
        return;
      }
    }
    setUser(null);
    setIsSignedIn(false);

  } catch (error) {
    console.error("❌ [AuthProvider] Auth check failed:", error);
    setUser(null);
    setIsSignedIn(false);
  } finally {
    console.log("✅ [AuthProvider] Auth check complete");
    setIsLoading(false);
  }
};

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsSignedIn(true);
        
        // 🔌 Initialize WebSocket after successful login
        if (userData?.id) {
          try {
            await initWebSocket(userData.id);
            console.log("✅ [AuthProvider] WebSocket initialized after login");
          } catch (err) {
            console.error("❌ [AuthProvider] WebSocket init failed:", err);
          }
        }

        // 🔄 Resume unfinished AI jobs
        await resumeUnfinishedJobs();
      }
      else {
        setIsSignedIn(false);
        setUser(null);
      }
      
      return response;
    } catch (error) {
      setIsSignedIn(false);
      setUser(null);
      console.error("Login error:", error);
      throw error;
    } finally {
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // 🔌 Disconnect WebSocket on logout
      disconnectWebSocket();
      
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
      const userData = await loadCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Refresh user error:", error);
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    }
  };

  const updateCachedUser = async (data: Partial<UserResponse>) => {
    const current = user ?? (await userStorage.getUser());

    if (!current) {
      return null;
    }

    const latestUser = authService.normalizeUser({
      ...current,
      ...data,
    });

    await userStorage.setUser(latestUser);
    setUser(latestUser);
    return latestUser;
  };

  const updateUser = async (data: UpdateUserRequest | FormData) => {
    try {
      setIsLoading(true);
      const response = await authService.updateProfile(data);
      
      if (response.success && response.data) {
        const latestUser = authService.normalizeUser(response.data);
        await userStorage.setUser(latestUser);
        setUser(latestUser);
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
        updateCachedUser,
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
