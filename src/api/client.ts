import axios from 'axios';
import { storage } from '../utils/storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// ─── API URL Configuration ──────────────────────────
// Set via environment or override here for local development
// const API_URL = __DEV__
//   ? 'http://192.168.1.101:8000/api/v1'
//   : 'https://api.production.com/api/v1';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// export const WS_HOST = __DEV__
//   ? '192.168.1.101:8000'
//   : 'api.production.com';

export const WS_HOST = process.env.EXPO_PUBLIC_WS_HOST;

// ─── Auth Interceptor Manager ───────────────────────
class AuthInterceptorManager {
  private logoutFn: (() => void) | null = null;

  setup(fn: () => void) {
    this.logoutFn = fn;
  }

  logout() {
    this.logoutFn?.();
  }

  teardown() {
    this.logoutFn = null;
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

// Response Interceptor: Catch 401s (Session Expired)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Session expired (401). Logging out...');
      authInterceptor.logout();
    }
    return Promise.reject(error);
  }
);

export default client;
