import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPaletteName } from '@/constants/colorPalettes';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  accentPalette: string;
  isLoading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  setAccentPalette: (name: string) => Promise<void>;
  initialize: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@repeat_master_theme';
const PALETTE_STORAGE_KEY = '@repeat_master_accent_palette';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  isDark: false,
  accentPalette: defaultPaletteName,
  isLoading: true,

  initialize: async () => {
    try {
      const [storedMode, storedPalette] = await Promise.all([
        AsyncStorage.getItem(THEME_STORAGE_KEY),
        AsyncStorage.getItem(PALETTE_STORAGE_KEY),
      ]);
      set({
        mode: (storedMode as ThemeMode) ?? 'light',
        isDark: storedMode === 'dark',
        accentPalette: storedPalette ?? defaultPaletteName,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      set({ isLoading: false });
    }
  },

  setMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      set({ mode, isDark: mode === 'dark' });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },

  setAccentPalette: async (name: string) => {
    try {
      await AsyncStorage.setItem(PALETTE_STORAGE_KEY, name);
      set({ accentPalette: name });
    } catch (error) {
      console.error('Failed to save accent palette:', error);
    }
  },
}));
