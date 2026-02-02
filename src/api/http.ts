import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from "../storage/tokenStorage"; 
import { API_CONFIG } from '../config/api';


// Create axios instance with default config
const http: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor - Thêm token vào headers
http.interceptors.request.use(
  async (config) => {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý refresh token khi hết hạn
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu status 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Gọi API refresh token
        const response = await axios.post(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        await tokenStorage.setAccessToken(accessToken);

        // Retry request với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại - logout
        await tokenStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
