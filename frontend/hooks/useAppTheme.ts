import { useThemeStore } from '@/stores/themeStore';
import { getTheme } from '@/constants/theme';

/**
 * Hook to get the current theme based on dark mode setting.
 * Use this instead of importing `theme` directly from constants.
 */
export const useAppTheme = () => {
  const isDark = useThemeStore(state => state.isDark);
  return getTheme(isDark);
};
