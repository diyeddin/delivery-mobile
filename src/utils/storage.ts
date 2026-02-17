import * as SecureStore from 'expo-secure-store';

export const storage = {
  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync('token');
    } catch (error) {
      console.error("Error getting token", error);
      return null;
    }
  },

  setToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync('token', token);
    } catch (error) {
      console.error("Error saving token", error);
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('token');
    } catch (error) {
      console.error("Error removing token", error);
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync('refresh_token');
    } catch (error) {
      console.error("Error getting refresh token", error);
      return null;
    }
  },

  setRefreshToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync('refresh_token', token);
    } catch (error) {
      console.error("Error saving refresh token", error);
    }
  },

  removeRefreshToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync('refresh_token');
    } catch (error) {
      console.error("Error removing refresh token", error);
    }
  },
};