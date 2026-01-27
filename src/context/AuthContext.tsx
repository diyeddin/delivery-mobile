import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { storage } from '../utils/storage';
import { View, ActivityIndicator } from 'react-native';
// NEW IMPORTS
import { setupAuthInterceptor } from '../api/client';
import Toast from 'react-native-toast-message';

// NOTE: Same User Interface as the Web!
interface User {
  email: string;
  role: 'admin' | 'store_owner' | 'driver' | 'customer';
  sub: string;
  name?: string;
  id?: number;
  exp?: number; // Added expiry field
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Define Logout Function First (so we can use it in effects)
  const logout = async () => {
    setToken(null);
    setUser(null);
    await storage.removeToken();
  };

  // 2. Connect the "Fire Alarm" (Interceptor)
  useEffect(() => {
    setupAuthInterceptor(() => {
      logout();
      Toast.show({
        type: 'error',
        text1: 'Session Expired',
        text2: 'Please log in again.',
        visibilityTime: 4000,
      });
    });
  }, []);

  // 3. Check for stored token on app launch
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await storage.getToken();
        if (storedToken) {
          const decoded = jwtDecode<User>(storedToken);
          
          // Optional: Check expiry immediately on load
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

  // 4. Login
  const login = async (newToken: string) => {
    try {
      const decoded = jwtDecode<User>(newToken);
      setToken(newToken);
      setUser(decoded);
      await storage.setToken(newToken);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (isLoading) {
    // Simple Native Loading Spinner
    return (
      <View className="flex-1 items-center justify-center bg-onyx">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};