import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  isLoading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@repeat_master_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isDark: false,
  isLoading: true,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const mode = stored as ThemeMode;
        set({
          mode,
          isDark: mode === 'dark',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      set({ isLoading: false });
    }
  },

  setMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      set({
        mode,
        isDark: mode === 'dark',
      });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },
}));
