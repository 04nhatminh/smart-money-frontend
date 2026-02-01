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

http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) =>  {
    // Ensure headers is AxiosHeaders
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    // Content-Type
    if (!config.headers.has('Content-Type')) {
      config.headers.set('Content-Type', 'application/json');
    }

    // Authorization
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // Prevent GET cache
    if (config.method?.toLowerCase() === 'get' && config.params) {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);


// Response interceptor
http.interceptors.response.use(
   (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Clear tokens on 401 Unauthorized
      if (status === 401) {
        await tokenStorage.clear();
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
      
      // Log errors based on status
      switch (status) {
        case 400:
          console.error('Bad Request:', data);
          break;
        case 403:
          console.error('Forbidden:', data);
          break;
        case 404:
          console.error('Not Found:', data);
          break;
        case 409:
          console.error('Conflict:', data);
          break;
        case 500:
          console.error('Server Error:', data);
          break;
        default:
          console.error(`API Error ${status}:`, data);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export { http };
export default http;