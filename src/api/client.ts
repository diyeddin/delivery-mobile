import axios from 'axios';
import { storage } from '../utils/storage';
import NetInfo from '@react-native-community/netinfo'; 

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
  timeout: 10000, 
});

// Request Interceptor: Attach Token & Check Offline
client.interceptors.request.use(async (config) => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
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
      if (logoutAction) {
        logoutAction();
      }
    }
    return Promise.reject(error);
  }
);

// 👇 NEW: EXTEND THE CLIENT WITH CUSTOM METHODS
// We attach this method directly to the client object so you can call client.submitReview()
(client as any).submitReview = async (storeId: number, orderId: number, rating: number, comment: string) => {
  return client.post(`/stores/${storeId}/review`, { rating, comment }, {
    params: { order_id: orderId }
  });
};

export default client as typeof client & { 
  submitReview: (storeId: number, orderId: number, rating: number, comment: string) => Promise<any> 
};

(client as any).getStoreReviews = async (storeId: number) => {
  const res = await client.get(`/stores/${storeId}/reviews`);
  return res.data;
};