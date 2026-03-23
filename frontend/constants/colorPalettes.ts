export type AccentPalette = {
  name: string;
  label: string;
  primary: string;
  primaryLight: string;
  primaryMuted: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  isPremium: boolean;
};

export const accentPalettes: Record<string, AccentPalette> = {
  amber: {
    name: 'amber',
    label: 'アンバー',
    primary: '#D4874A',
    primaryLight: '#D4874A12',
    primaryMuted: '#D4874A30',
    success: '#50A050',
    successLight: '#50A05010',
    error: '#D05050',
    errorLight: '#D0505010',
    isPremium: false,
  },
  ocean: {
    name: 'ocean',
    label: 'オーシャン',
    primary: '#4A87D4',
    primaryLight: '#4A87D412',
    primaryMuted: '#4A87D430',
    success: '#50A050',
    successLight: '#50A05010',
    error: '#D05050',
    errorLight: '#D0505010',
    isPremium: true,
  },
  forest: {
    name: 'forest',
    label: 'フォレスト',
    primary: '#4A8E5A',
    primaryLight: '#4A8E5A12',
    primaryMuted: '#4A8E5A30',
    success: '#4A8E5A',
    successLight: '#4A8E5A10',
    error: '#C4655A',
    errorLight: '#C4655A10',
    isPremium: true,
  },
  berry: {
    name: 'berry',
    label: 'ベリー',
    primary: '#9B5AA8',
    primaryLight: '#9B5AA812',
    primaryMuted: '#9B5AA830',
    success: '#50A050',
    successLight: '#50A05010',
    error: '#D05050',
    errorLight: '#D0505010',
    isPremium: true,
  },
  rose: {
    name: 'rose',
    label: 'ローズ',
    primary: '#D4647A',
    primaryLight: '#D4647A12',
    primaryMuted: '#D4647A30',
    success: '#50A050',
    successLight: '#50A05010',
    error: '#C45050',
    errorLight: '#C4505010',
    isPremium: true,
  },
  graphite: {
    name: 'graphite',
    label: 'グラファイト',
    primary: '#6B7280',
    primaryLight: '#6B728012',
    primaryMuted: '#6B728030',
    success: '#50A050',
    successLight: '#50A05010',
    error: '#D05050',
    errorLight: '#D0505010',
    isPremium: true,
  },
};

export const defaultPaletteName = 'amber';

export const getPalette = (name: string): AccentPalette =>
  accentPalettes[name] ?? accentPalettes[defaultPaletteName];
