import { theme } from '@/constants/theme';
import { usePathname, useRouter } from 'expo-router';
import { Home, Library, Settings, LineChart } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomTabBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isHomeActive = pathname === '/' || pathname === '/index';
  const isLibraryActive = pathname.includes('/library') || pathname.includes('/study') || pathname.includes('/dashboard');
  const isAnalyticsActive = pathname.includes('/analytics');
  const isSettingsActive = pathname.includes('/settings');

  return (
    <View style={{ backgroundColor: theme.colors.neutral.white }}>
      <View style={styles.container}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/')}
        activeOpacity={0.7}
      >
        <Home
          size={24}
          color={isHomeActive ? theme.colors.primary[600] : theme.colors.secondary[400]}
        />
        <Text
          style={[
            styles.label,
            isHomeActive && styles.labelActive
          ]}
        >
          ホーム
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/library')}
        activeOpacity={0.7}
      >
        <Library
          size={24}
          color={isLibraryActive ? theme.colors.primary[600] : theme.colors.secondary[400]}
        />
        <Text
          style={[
            styles.label,
            isLibraryActive && styles.labelActive
          ]}
        >
          ライブラリ
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/analytics')}
        activeOpacity={0.7}
      >
        <LineChart
          size={24}
          color={isAnalyticsActive ? theme.colors.primary[600] : theme.colors.secondary[400]}
        />
        <Text
          style={[
            styles.label,
            isAnalyticsActive && styles.labelActive
          ]}
        >
          分析
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => router.push('/settings')}
        activeOpacity={0.7}
      >
        <Settings
          size={24}
          color={isSettingsActive ? theme.colors.primary[600] : theme.colors.secondary[400]}
        />
        <Text
          style={[
            styles.label,
            isSettingsActive && styles.labelActive
          ]}
        >
          設定
        </Text>
      </TouchableOpacity>
    </View>
    <View style={{ height: insets.bottom }} />
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary[200],
    minHeight: 60,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[400],
    marginTop: 4,
  },
  labelActive: {
    color: theme.colors.primary[600],
  },
});

export default CustomTabBar;
