import { http, refreshHttp } from './http';
import {
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  GoogleLoginRequest,
  FacebookLoginRequest,
  RefreshTokenRequest,
  UpdateUserRequest,
  SendResetPasswordOtpRequest,
  ResetPasswordRequest,
  AuthResponse,
  UserResponse,
  CheckResponse,
  ApiResponse,
  SendResetPasswordResponseData
} from '../types/auth.types';
import { tokenStorage } from '../storage/tokenStorage';
import { Asset } from 'expo-asset';

class AuthApi {
  // Convert RegisterRequest to FormData for multipart upload
  private async toFormData(data: RegisterRequest): Promise<FormData> {
    const formData = new FormData();

    formData.append('username', data.username);
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone', data.phone);
    formData.append('dateOfBirth', data.dateOfBirth?.toString() || '');

    if (data.avatar) {
      formData.append('avatar', data.avatar);
    } else {
      const asset = Asset.fromModule(require('../../assets/avatar-default.png'));
      await asset.downloadAsync();

      formData.append('avatar', {
        uri: asset.localUri || asset.uri,
        name: 'default-avatar.png',
        type: 'image/png'
      } as any);
    }

    return formData;
  }


  private async getAuthHeader() {
    const token = await tokenStorage.getAccessToken();

    if (!token) {
      throw new Error("No token found");
    }

    return {
      Authorization: `Bearer ${token}`
    };
  }


  // Register new user
  async register(data: RegisterRequest): Promise<CheckResponse<void>> {
    try {
      const formData = await this.toFormData(data);

      const res = await http.post('/api/v1/auth/register', formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  // Verify email with OTP
  async verifyEmail(data: VerifyEmailRequest): Promise<CheckResponse<void>> {
    try {
      const res = await http.post('/api/v1/auth/verify-email', data);
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Email verification failed',
      };
    }
  }

  // Check OTP still exists
  async checkOtpExists(email: string): Promise<CheckResponse<boolean>> {
    try {
      const res = await http.get('/api/v1/auth/otp-exists', {
        params: { email },
      });

      return res.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          success: false,
          message: error.message || 'Failed to check OTP',
        }
      );
    }
  }

  // Login with email/password
  async login(data: LoginRequest): Promise<CheckResponse<AuthResponse>> {
    try {
      const res = await http.post('/api/v1/auth/login', data);
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  // Login with Google
  async googleLogin(data: GoogleLoginRequest): Promise<CheckResponse<AuthResponse>> {
    try {
      const res = await http.post('/api/v1/auth/login/google', data);
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Google login failed',
      };
    }
  }

  // Login with Facebook
  async facebookLogin(data: FacebookLoginRequest): Promise<CheckResponse<AuthResponse>> {
    try {
      const res = await http.post('/api/v1/auth/login/facebook', data);
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Facebook login failed',
      };
    }
  }

  // Refresh access token
  async refreshToken(data: RefreshTokenRequest): Promise<CheckResponse<AuthResponse>> {
    try {
      const res = await refreshHttp.post('/api/v1/auth/refresh-token', data);
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Token refresh failed',
      };
    }
  }

  // Logout user
  async logout(): Promise<CheckResponse<void>> {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        return {
          success: true,
          message: 'Already logged out',
        };
      }

      const res = await http.post('/api/v1/auth/logout', null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Logout failed',
      };
    }
  }

  // Health check
  async health(): Promise<CheckResponse<string>> {
    try {
      const res = await http.get('/api/v1/auth/health');
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Health check failed',
      };
    }
  }

  // Get current user info
  async getCurrentUser(): Promise<CheckResponse<UserResponse>> {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const res = await http.get('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Failed to get user info',
      };
    }
  }

  // Convert UpdateUserRequest to FormData for multipart upload
  private toUpdateFormData(data: UpdateUserRequest): FormData {
    const formData = new FormData();

    if (data.fullName) formData.append('fullName', data.fullName);
    if (data.phone) formData.append('phone', data.phone);
    if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth.toString());
    if (data.avatar) formData.append('avatar', data.avatar);

    return formData;
  }

  // Update user profile
  async updateUser(data: UpdateUserRequest | FormData): Promise<CheckResponse<UserResponse>> {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const isFormData = data instanceof FormData;

      // If data is not FormData, convert it to FormData
      let requestData = isFormData ? data : this.toUpdateFormData(data as UpdateUserRequest);

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      };


      // Don't set Content-Type for FormData - let axios auto-detect and handle it with boundary
      // If data is FormData, axios will automatically set Content-Type: multipart/form-data with proper boundary

      const res = await http.put('/api/v1/auth/me', requestData, { headers });

      return res.data;

    } catch (error: any) {
      console.log("UPDATE USER ERROR:", error);

      return error.response?.data || {
        success: false,
        message: error.message || 'Failed to update user',
      };
    }
  }
  // Forgot password - request OTP
  async forgotPassword(data: SendResetPasswordOtpRequest): Promise<CheckResponse<void>> {
    try {
      const res = await http.post('/api/v1/auth/forgot', data);
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Failed to send reset email',
      };
    }
  }

  async verifyResetPassword(data: VerifyEmailRequest): Promise<ApiResponse<SendResetPasswordResponseData>> {
    try {
      const res = await http.post('/api/v1/auth/verify-otp', data);
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Failed to verify OTP',
        errorCode: error.response?.data?.errorCode || 'VERIFICATION_FAILED'
      };
    }
  }

  // Reset password with OTP
  async resetPassword(
    data: ResetPasswordRequest,
    resetToken: string
  ): Promise<CheckResponse<void>> {
    try {
      const res = await http.post(
        '/api/v1/auth/reset-password',
        data,
        {
          headers: {
            'X-Reset-Token': resetToken,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Failed to reset password',
      };
    }
  }

  async enableNotification(): Promise<CheckResponse<string>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.patch(
        '/api/v1/auth/notification/enable',
        null,
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Enable notification failed',
      };
    }
  }

  async disableNotification(): Promise<CheckResponse<string>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.patch(
        '/api/v1/auth/notification/disable',
        null,
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Disable notification failed',
      };
    }
  }

  async getNotificationStatus(): Promise<CheckResponse<boolean>> {
    try {
      const headers = await this.getAuthHeader();

      const res = await http.get(
        '/api/v1/auth/notification',
        { headers }
      );

      return res.data;
    } catch (error: any) {
      return error.response?.data || {
        success: false,
        message: error.message || 'Get notification status failed',
      };
    }
  }
}

export default new AuthApi();