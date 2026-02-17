import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// ─── API URL Configuration ──────────────────────────
const API_URL = process.env.EXPO_PUBLIC_API_URL;
export const WS_HOST = process.env.EXPO_PUBLIC_WS_HOST;
export const WS_PROTOCOL = API_URL?.startsWith('https') ? 'wss' : 'ws';

// ─── Auth Interceptor Manager ───────────────────────
class AuthInterceptorManager {
  private logoutFn: (() => void) | null = null;
  private onTokenRefreshed: ((accessToken: string, refreshToken: string) => void) | null = null;

  setup(
    logoutFn: () => void,
    onTokenRefreshed: (accessToken: string, refreshToken: string) => void,
  ) {
    this.logoutFn = logoutFn;
    this.onTokenRefreshed = onTokenRefreshed;
  }

  logout() {
    this.logoutFn?.();
  }

  handleNewTokens(accessToken: string, refreshToken: string) {
    this.onTokenRefreshed?.(accessToken, refreshToken);
  }

  teardown() {
    this.logoutFn = null;
    this.onTokenRefreshed = null;
  }
}

export const authInterceptor = new AuthInterceptorManager();

// ─── Network State (cached, not per-request) ────────
let isConnected = true;
NetInfo.addEventListener((state: NetInfoState) => {
  isConnected = state.isConnected ?? true;
});

// ─── Axios Client ───────────────────────────────────
const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request Interceptor: Attach Token & Check Offline
client.interceptors.request.use(async (config) => {
  if (!isConnected) {
    return Promise.reject(new Error('NO_INTERNET'));
  }

  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Token Refresh Logic ────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

// Response Interceptor: Attempt refresh on 401, then retry
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only attempt refresh for 401s that aren't from auth endpoints
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken: string = data.access_token;
        const newRefreshToken: string = data.refresh_token;

        // Persist new tokens
        await storage.setToken(newAccessToken);
        await storage.setRefreshToken(newRefreshToken);

        // Notify AuthContext so in-memory state stays in sync
        authInterceptor.handleNewTokens(newAccessToken, newRefreshToken);

        // Retry queued requests
        processQueue(null, newAccessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authInterceptor.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
