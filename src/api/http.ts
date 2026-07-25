import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { tokenStorage } from "../storage/tokenStorage"; 
import { API_CONFIG } from '../config/api';


// Create axios instance with default config
console.log("📡 HTTP Config - baseURL:", API_CONFIG.BASE_URL, "timeout:", API_CONFIG.TIMEOUT);

const http: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});


const refreshHttp = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export const setSessionExpiredHandler = (handler: SessionExpiredHandler) => {
  sessionExpiredHandler = handler;
};

export const notifySessionExpired = () => {
  if (sessionExpiredHandler) {
    sessionExpiredHandler();
  }
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

export const refreshToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((token: string) => {
        if (token) {
          resolve(token);
        } else {
          reject(new Error("Refresh token failed"));
        }
      });
    });
  }

  isRefreshing = true;

  try {
    const storedRefreshToken = await tokenStorage.getRefreshToken();

    if (!storedRefreshToken || !storedRefreshToken.trim()) {
      await tokenStorage.clear();
      notifySessionExpired();
      throw new Error("Refresh token is required");
    }

    const response = await refreshHttp.post("/api/v1/auth/refresh-token", {
      refreshToken: storedRefreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    await tokenStorage.setAccessToken(accessToken);
    if (newRefreshToken) {
      await tokenStorage.setRefreshToken(newRefreshToken);
    }
    onRefreshed(accessToken);
    isRefreshing = false;

    return accessToken;
  } catch (err) {
    isRefreshing = false;
    onRefreshed("");
    await tokenStorage.clear();
    notifySessionExpired();
    throw err;
  }
};

// Request interceptor - Thêm token vào headers
http.interceptors.request.use(
  async (config) => {
    const isRefreshRequest = config.url?.includes("/api/v1/auth/refresh-token");

    if (isRefreshRequest) {
      return config;
    }

    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers = config.headers || {};
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
    const originalRequest = error.config as CustomAxiosRequestConfig;

    const isRefreshRequest = originalRequest?.url?.includes("/api/v1/auth/refresh-token");

    const hasAuthorization =
        originalRequest.headers?.Authorization ||
        originalRequest.headers?.authorization;

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && hasAuthorization) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return http(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export { http, refreshHttp };
export default http;