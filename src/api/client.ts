import axios from 'axios';
import { storage } from '../utils/storage';
import NetInfo from '@react-native-community/netinfo'; // <--- 1. Import NetInfo

// ---------------------------------------------------------
// OPTION 1: If using Android Emulator (Standard Way)
// ---------------------------------------------------------
// const API_URL = 'http://10.0.2.2:8000/api/v1'; 

// ---------------------------------------------------------
// OPTION 2: LAN IP
// ---------------------------------------------------------
const API_URL = 'http://192.168.1.101:8000/api/v1'; 

// 1. Create a variable to hold the logout function
let logoutAction: (() => void) | null = null;

// 2. Export a helper to allow AuthContext to "inject" the logout function
export const setupAuthInterceptor = (logoutFn: () => void) => {
  logoutAction = logoutFn;
};

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Good practice: Fail if request takes > 10s
});

// Request Interceptor: Attach Token & Check Offline
client.interceptors.request.use(async (config) => {
  
  // 3. NEW: Fail Fast if Offline
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    // This stops the request instantly.
    // The calling screen will immediately jump to the 'catch' block.
    return Promise.reject(new Error('NO_INTERNET'));
  }

  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. Response Interceptor: Catch 401s (Session Expired)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.log('Session expired (401). Logging out...');
      
      if (logoutAction) {
        logoutAction();
      }
    }
    return Promise.reject(error);
  }
);

export default client;