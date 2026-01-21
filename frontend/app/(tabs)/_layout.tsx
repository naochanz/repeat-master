import { useAppTheme } from '@/hooks/useAppTheme';
import { Tabs } from 'expo-router';
import { Home, Library, Settings, LineChart } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.secondary[400],
        headerShown: false,
        lazy: false,
        animation: 'fade',
        tabBarStyle: {
          backgroundColor: theme.colors.neutral.white,
          borderTopColor: theme.colors.secondary[200],
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'ZenKaku-Bold',
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'ライブラリ',
          tabBarIcon: ({ color, size }) => <Library size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: '分析',
          tabBarIcon: ({ color, size }) => <LineChart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
