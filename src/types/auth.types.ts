// Types cho authentication
export interface RegisterRequest {
  username: string;
  fullName: string;
  avatar: string;
  password: string;
  dateOfBirth: Date | string;
  phone: string;
  email: string;
  confirmPassword?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface FacebookLoginRequest {
  accessToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export interface CheckResponse<T> extends ApiResponse<T> {}


export interface SendResetPasswordResponseData {
  resetToken: string;
  email: string;
}


export interface SendResetPasswordResponse extends ApiResponse<SendResetPasswordResponseData> {}

export interface VerifyResetPasswordResponse extends ApiResponse<{}> {}

export interface UpdateUserRequest {
  username?: string;
  fullname?: string;
  avatar?: string;
  dateofBirth?: Date | string;
  phone?: string;
  email?: string;
  gender?: string;
}

export interface SendResetPasswordOtpRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

// Response types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
  user?: UserResponse;
}

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
  dateOfBirth?: Date | string;
  phone?: string;
  email: string;
  coin: number;
  rate: number;
  role: string;
  active: boolean
}

export interface CheckResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// User state type
export interface UserState {
  user: UserResponse | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}