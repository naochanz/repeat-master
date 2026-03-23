import { Platform } from 'react-native';
import { type AccentPalette, getPalette, defaultPaletteName } from './colorPalettes';

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FAFAFA',
    tint: '#D4874A',
    icon: '#999999',
    tabIconDefault: '#BBBBBB',
    tabIconSelected: '#D4874A',
  },
  dark: {
    text: '#E5E5E5',
    background: '#1A1A1A',
    tint: '#D4874A',
    icon: '#888888',
    tabIconDefault: '#555555',
    tabIconSelected: '#D4874A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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

const buildLightColors = (palette: AccentPalette) => ({
  primary: {
    50: palette.primaryLight,
    100: palette.primaryLight,
    200: palette.primaryMuted,
    300: palette.primaryMuted,
    400: palette.primary,
    500: palette.primary,
    600: palette.primary,
    700: palette.primary,
    800: palette.primary,
    900: palette.primary,
  },
  secondary: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#DDDDDD',
    400: '#BBBBBB',
    500: '#999999',
    600: '#777777',
    700: '#555555',
    800: '#333333',
    900: '#1A1A1A',
  },
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    white: '#FFFFFF',
  },
  background: '#FAFAFA',
  surface: '#FFFFFF',
  error: {
    50: palette.errorLight,
    300: palette.error,
    500: palette.error,
    600: palette.error,
  },
  warning: {
    50: '#FFF8E1',
    300: '#FFD54F',
    500: '#FFB300',
    600: '#FFA000',
  },
  success: {
    50: palette.successLight,
    300: palette.success,
    500: palette.success,
    600: palette.success,
  },
});

const buildDarkColors = (palette: AccentPalette) => ({
  primary: {
    50: palette.primaryLight,
    100: palette.primaryLight,
    200: palette.primaryMuted,
    300: palette.primaryMuted,
    400: palette.primary,
    500: palette.primary,
    600: palette.primary,
    700: palette.primary,
    800: palette.primary,
    900: palette.primary,
  },
  secondary: {
    50: '#1A1A1A',
    100: '#242424',
    200: '#333333',
    300: '#444444',
    400: '#666666',
    500: '#888888',
    600: '#AAAAAA',
    700: '#CCCCCC',
    800: '#DDDDDD',
    900: '#E5E5E5',
  },
  neutral: {
    50: '#1A1A1A',
    100: '#242424',
    white: '#242424',
  },
  background: '#1A1A1A',
  surface: '#242424',
  error: {
    50: palette.errorLight,
    300: palette.error,
    500: palette.error,
    600: palette.error,
  },
  warning: {
    50: '#332B00',
    300: '#FFB300',
    500: '#FFB300',
    600: '#FFD54F',
  },
  success: {
    50: palette.successLight,
    300: palette.success,
    500: palette.success,
    600: palette.success,
  },
});

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
    lg: 16,
    xl: 20,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
  },
};

const buildTheme = (isDark: boolean, palette: AccentPalette) => ({
  ...baseTheme,
  colors: isDark ? buildDarkColors(palette) : buildLightColors(palette),
});

const defaultPalette = getPalette(defaultPaletteName);
export const lightTheme = buildTheme(false, defaultPalette);
export const darkTheme = buildTheme(true, defaultPalette);

// 後方互換
export const theme = lightTheme;

export const getTheme = (isDark: boolean, paletteName?: string) => {
  const palette = getPalette(paletteName ?? defaultPaletteName);
  return buildTheme(isDark, palette);
};
