import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { storage } from '../utils/storage';
import { View, ActivityIndicator, Platform } from 'react-native';
import { authInterceptor } from '../api/client';
import Toast from 'react-native-toast-message';
import { usersApi } from '../api/users';
import { User } from '../types';

// EXPO NOTIFICATIONS IMPORTS
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  registerPushToken: () => Promise<void>; // <--- Expose this for the Settings Screen
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- LOGOUT ---
  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await storage.removeToken();
  }, []);

  // Keep a ref to the latest logout for the interceptor
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  // --- INTERCEPTOR ---
  useEffect(() => {
    authInterceptor.setup(() => {
      logoutRef.current();
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please log in again.',
      });
    });
    return () => {
      authInterceptor.teardown();
    };
  }, []);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await storage.getToken();
        if (storedToken) {
          const decoded = jwtDecode<User>(storedToken);
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp < currentTime) {
            console.log("Token expired on load");
            await logout();
          } else {
            setToken(storedToken);
            setUser(decoded);
          }
        }
      } catch (e) {
        console.error("Auth Load Error:", e);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // --- PUSH NOTIFICATION LOGIC ---
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    try {
      // 1. Check/Request Permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // 2. Get the Token
      // NOTE: We need projectId for Expo 49+
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId, 
      });
      const expoToken = tokenData.data;
      console.log("📲 Expo Push Token:", expoToken);

      // 3. Send to Backend
      await usersApi.registerPushToken(expoToken);
      console.log("✅ Token sent to backend successfully");

    } catch (error) {
      console.error("Error registering push token:", error);
    }

    // Android specific channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  // --- LOGIN ---
  const login = async (newToken: string) => {
    try {
      const decoded = jwtDecode<User>(newToken);
      setToken(newToken);
      setUser(decoded);
      await storage.setToken(newToken);
      
      // AUTO-REGISTER ON LOGIN
      // We wait a brief moment to ensure state is settled
      setTimeout(() => {
        registerForPushNotificationsAsync();
      }, 1000);

    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-onyx">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated: !!user, 
      isLoading,
      registerPushToken: registerForPushNotificationsAsync 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};