import { theme } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { Home, Library, Settings } from 'lucide-react-native';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.secondary[400],
        headerShown: false,
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
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}