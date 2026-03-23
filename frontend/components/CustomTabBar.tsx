import { useAppTheme } from '@/hooks/useAppTheme';
import { usePathname, useRouter } from 'expo-router';
import { Home, Library, Settings, BarChart3 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { key: 'home', label: 'HOME', icon: Home, route: '/' as const },
  { key: 'library', label: 'LIBRARY', icon: Library, route: '/library' as const },
  { key: 'analytics', label: 'ANALYTICS', icon: BarChart3, route: '/analytics' as const },
  { key: 'settings', label: 'SETTINGS', icon: Settings, route: '/settings' as const },
] as const;

const getActiveTab = (pathname: string): string => {
  if (pathname.includes('/library') || pathname.includes('/study') || pathname.includes('/dashboard')) return 'library';
  if (pathname.includes('/analytics')) return 'analytics';
  if (pathname.includes('/settings')) return 'settings';
  return 'home';
};

const CustomTabBar = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeTab = getActiveTab(pathname);

  return (
    <View style={[styles.outer, { paddingBottom: insets.bottom }]}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => router.push(tab.route)}
              activeOpacity={0.7}
            >
              <Icon size={18} color={isActive ? '#FFFFFF' : theme.colors.secondary[400]} />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  outer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 21,
    paddingTop: 12,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.white,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    height: 62,
    padding: 4,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  tabActive: {
    backgroundColor: theme.colors.primary[600],
  },
  label: {
    fontSize: 10,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[400],
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#FFFFFF',
  },
});

export default CustomTabBar;
