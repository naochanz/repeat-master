import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setAuthToken } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // アクション
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>; // アプリ起動時にトークン読み込み
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(email, password);
      const { access_token, user } = response.data;
  
      // トークンを保存
      await AsyncStorage.setItem('token', access_token);
      setAuthToken(access_token);
  
      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, name?: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(email, password, name);
      const { access_token, user } = response.data;

      // トークンを保存
      await AsyncStorage.setItem('token', access_token);
      setAuthToken(access_token);

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    setAuthToken('');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        // TODO: トークンからユーザー情報を取得するAPIを後で実装
        set({
          token,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  },
}));