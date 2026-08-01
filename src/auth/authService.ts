import AuthApi from '../api/auth.api';
import {
  AuthResponse,
  UserResponse,
  UserState,
  RegisterRequest,
  CheckResponse,
  UpdateUserRequest,
  VerifyEmailRequest,
  SendResetPasswordOtpRequest,
  ApiResponse,
  SendResetPasswordResponseData,
  ResetPasswordRequest,
  GoogleLoginRequest,
  FacebookLoginRequest,
  RefreshTokenRequest
} from '../types/auth.types';
import { userStorage } from '../storage/userStorage';
import { tokenStorage } from '../storage/tokenStorage';
import aiInsightStorage from '../storage/aiInsightStorage';
import * as base64 from "base-64";

class AuthService {
  private tokenRefreshPromise: Promise<boolean> | null = null;

  normalizeUser(user: any): UserResponse {
    const financialSetupCompleted =
      user?.financialSetupCompleted ?? user?.financial_setup_completed ?? false;

    return {
      ...user,
      financialSetupCompleted,
      onboardingCompleted: financialSetupCompleted,
    };
  }

  // Initialize service
  init() {
    this.loadUserFromStorage();
  }

  // Load user from localStorage
  async loadUserFromStorage(): Promise<UserState> {
    const token = await tokenStorage.getAccessToken();
    const refreshToken = await tokenStorage.getRefreshToken();
    const user = await userStorage.getUser();

    return {
      user,
      token,
      refreshToken,
      isAuthenticated: !!token && !this.isTokenExpired(token),
      loading: false,
      error: null,
    };
  }

  private decodeJWT(token: string) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(base64.decode(payload));
    } catch {
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    const payload = this.decodeJWT(token);
    if (!payload?.exp) return true;
    return payload.exp * 1000 < Date.now();
  }

  // Store tokens and user data
  async storeAuthData(auth: AuthResponse) {
    if (auth.accessToken) {
      await tokenStorage.setAccessToken(auth.accessToken);
    }

    if (auth.refreshToken) {
      await tokenStorage.setRefreshToken(auth.refreshToken);
    }

    if (auth.user) {
      await userStorage.setUser(this.normalizeUser(auth.user));
    }
  }

  async setResetStorage(token: string) {
    if (!token) {
      throw new Error('Token is missing');
    }
    await tokenStorage.setResetToken(token);
  }

  async getResetStorage() {
    return await tokenStorage.getResetToken();
  }

  // Clear auth data
  async clearAuthData() {
    await tokenStorage.clear();
    await userStorage.clear();
    await aiInsightStorage.clear();
  }

  // Get current token
  async getToken() {
    return await tokenStorage.getAccessToken();
  }

  async getRefreshToken() {
    return await tokenStorage.getRefreshToken();
  }

  async getCurrentUser() {
    const user = await userStorage.getUser();
    return user ? this.normalizeUser(user) : null;
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Login method
  async login(email: string, password: string): Promise<CheckResponse<AuthResponse>> {
    const response = await AuthApi.login({ email, password });
    if (response.success && response.data) {
      await this.storeAuthData(response.data);
    }
    return response;
  }

  async googleLogin(data: GoogleLoginRequest): Promise<CheckResponse<AuthResponse>> {
    try {
      const response = await AuthApi.googleLogin(data);
      if (response.success && response.data) {
        await this.storeAuthData(response.data);
      }
      return response;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Google login failed',
      };
    }
  }

  async facebookLogin(data: FacebookLoginRequest): Promise<CheckResponse<AuthResponse>> {
    try {
      const response = await AuthApi.facebookLogin(data);
      if (response.success && response.data) {
        await this.storeAuthData(response.data);
      }
      return response;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Facebook login failed',
      };
    }
  }

  // Generate username from email
  private generateUsername(email: string): string {
    try {
      // Extract the local part before @
      const emailPart = email.split('@')[0];

      // Clean the email part (remove special characters, keep only alphanumeric)
      const cleanedPart = emailPart.replace(/[^a-zA-Z0-9]/g, '');

      // Use cleaned part or 'user' as fallback
      const baseUsername = cleanedPart || 'user';

      // Add random suffix (4 characters from UUID)
      const randomSuffix = this.generateRandomSuffix(4);

      return `${baseUsername}_${randomSuffix}`.toLowerCase();
    } catch (error) {
      // Fallback username generation
      return `user_${this.generateRandomSuffix(6)}`;
    }
  }

  // Generate random suffix
  private generateRandomSuffix(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validate and prepare register data
  prepareRegisterData(userData: Partial<RegisterRequest>): RegisterRequest {
    const { email, username, ...rest } = userData;

    if (!email) {
      throw new Error('Email is required');
    }

    // Generate username from email if not provided
    const finalUsername = username?.trim() || this.generateUsername(email);

    // Validate username (alphanumeric and underscores only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(finalUsername)) {
      throw new Error('Username can only contain letters, numbers, and underscores');
    }

    // Ensure username length
    if (finalUsername.length < 3 || finalUsername.length > 30) {
      throw new Error('Username must be between 3 and 30 characters');
    }

    return {
      ...rest,
      email: email.trim(),
      username: finalUsername,
    } as RegisterRequest;
  }


  // Register method
  async register(userData: Partial<RegisterRequest>): Promise<CheckResponse<void>> {
    try {
      // Prepare and validate register data
      const preparedData = this.prepareRegisterData(userData);

      // Call API
      const response = await AuthApi.register(preparedData);

      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  async verifyEmail(
    data: VerifyEmailRequest
  ): Promise<CheckResponse<void>> {
    try {
      const response = await AuthApi.verifyEmail(data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Email verification failed",
      };
    }
  }

  async resendOTP(
    data: SendResetPasswordOtpRequest
  ): Promise<CheckResponse<void>> {
    try {
      const response = await AuthApi.forgotPassword(data);
      return response;
    }
    catch (error: any) {
      return {
        success: false,
        message: error.message || "Invalid OTP",
      }
    }
  }

  async forgotPassword(
    data: SendResetPasswordOtpRequest
  ): Promise<CheckResponse<void>> {
    try {
      const response = await AuthApi.forgotPassword(data);
      return response;
    }
    catch (error: any) {
      return {
        success: false,
        message: error.message || "Invalid Email",
      }
    }
  }

  async verifyResetPassword(
    data: VerifyEmailRequest
  ): Promise<ApiResponse<SendResetPasswordResponseData>> {
    try {
      const response = await AuthApi.verifyResetPassword(data);
      this.setResetStorage(response.data?.resetToken!);
      return response;
    }
    catch (error: any) {
      return {
        success: false,
        message: error.message || "Invalid OTP",
      }
    }
  }

  async checkOtpExists(email: string): Promise<CheckResponse<boolean>> {
    try {
      const response = await AuthApi.checkOtpExists(email);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "OTP not found",
      };
    }
  }

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<CheckResponse<void>> {
    try {
      const resetToken = await this.getResetStorage();

      if (!resetToken) {
        return {
          success: false,
          message: 'Reset token is missing or expired',
        };
      }

      const response = await AuthApi.resetPassword(data, resetToken);
      return response;

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Wrong!',
      };
    }
  }

  // Refresh token method
  async refreshToken(refreshToken: RefreshTokenRequest): Promise<CheckResponse<AuthResponse>> {
    try {
      const response = await AuthApi.refreshToken(refreshToken);
      if (response.success && response.data) {
        await this.storeAuthData(response.data);
      }
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Token refresh failed',
      };
    }
  }





  // Logout method
  async logout(): Promise<CheckResponse<void>> {
    const response = await AuthApi.logout();
    if (response.success) {
      await this.clearAuthData();
    }
    return response;
  }

  // Update profile
  async updateProfile(data: UpdateUserRequest | FormData): Promise<CheckResponse<UserResponse>> {
    const response = await AuthApi.updateUser(data);
    if (response.success && response.data) {
      await userStorage.setUser(this.normalizeUser(response.data));
    }
    return response;
  }

  //Enable Notification
  async enableNotification(): Promise<CheckResponse<string>> {
    try {
      const response = await AuthApi.enableNotification();
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Enable notification failed',
      };
    }
  }

  //Disable Notification
  async disableNotification(): Promise<CheckResponse<string>> {
    try {
      const response = await AuthApi.disableNotification();
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Disable notification failed',
      };
    }
  }

  async getNotificationStatus(): Promise<CheckResponse<boolean>> {
    try {
      const response = await AuthApi.getNotificationStatus();
      return response;
    } catch (error: any) {
      return {
        data: false,
        success: false,
        message: error.message || 'Get notification status failed',
      };
    }
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
