import { useThemeStore } from '@/stores/themeStore';
import { getTheme } from '@/constants/theme';

export const useAppTheme = () => {
  const isDark = useThemeStore(state => state.isDark);
  const accentPalette = useThemeStore(state => state.accentPalette);
  return getTheme(isDark, accentPalette);
};
