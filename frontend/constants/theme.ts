/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ライトモードのカラー
const lightColors = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    white: '#ffffff',
  },
  background: '#ffffff',
  surface: '#f9fafb',
  error: {
    50: '#fef2f2',
    300: '#fca5a5',
    500: '#ef4444',
    600: '#dc2626',
  },
  warning: {
    50: '#fffbeb',
    300: '#fcd34d',
    500: '#f59e0b',
    600: '#d97706',
  },
  success: {
    50: '#ecfdf5',
    300: '#6ee7b7',
    500: '#10b981',
    600: '#059669',
  },
};

// ダークモードのカラー
const darkColors = {
  primary: {
    50: '#7c2d12',
    100: '#9a3412',
    200: '#c2410c',
    300: '#ea580c',
    400: '#f97316',
    500: '#fb923c',
    600: '#fdba74',
    700: '#fed7aa',
    800: '#ffedd5',
    900: '#fff7ed',
  },
  secondary: {
    50: '#1e293b',
    100: '#334155',
    200: '#475569',
    300: '#64748b',
    400: '#94a3b8',
    500: '#cbd5e1',
    600: '#e2e8f0',
    700: '#f1f5f9',
    800: '#f8fafc',
    900: '#ffffff',
  },
  neutral: {
    50: '#1e293b',
    100: '#334155',
    white: '#0f172a',
  },
  background: '#0f172a',
  surface: '#1e293b',
  error: {
    50: '#450a0a',
    300: '#b91c1c',
    500: '#ef4444',
    600: '#f87171',
  },
  warning: {
    50: '#451a03',
    300: '#b45309',
    500: '#f59e0b',
    600: '#fbbf24',
  },
  success: {
    50: '#022c22',
    300: '#047857',
    500: '#10b981',
    600: '#34d399',
  },
};

const baseTheme = {
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
    fontWeights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    fontFamilies: {
      regular: 'ZenKaku-Regular',
      medium: 'ZenKaku-Medium',
      bold: 'ZenKaku-Bold',
      black: 'ZenKaku-Black',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '4xl': 64,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 12,
    },
  },
};

export const lightTheme = {
  ...baseTheme,
  colors: lightColors,
};

export const darkTheme = {
  ...baseTheme,
  colors: darkColors,
};

// デフォルトはライトテーマ（後方互換性のため）
export const theme = lightTheme;

// テーマを取得する関数
export const getTheme = (isDark: boolean) => isDark ? darkTheme : lightTheme;
