import { http } from './http';
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

class AuthApi {
  // Register new user
  async register(data: RegisterRequest): Promise<CheckResponse<void>> {
    try {
      const res = await http.post('/api/v1/auth/register', data);
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
      const res = await http.post('/api/v1/auth/refresh-token', data);
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

  // Update user profile
  async updateUser(data: UpdateUserRequest): Promise<CheckResponse<UserResponse>> {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        return {
          success: false,
          message: 'No token found',
        };
      }

      const res = await http.put('/api/v1/auth/me', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    } catch (error: any) {
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
}

export default new AuthApi();