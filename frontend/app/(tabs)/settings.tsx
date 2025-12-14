import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import React from 'react';
import { theme } from '@/constants/theme';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsScreen() {
  const logout = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    // ログアウト処理（セッションクリア）
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={24} color={theme.colors.error[600]} />
          <Text style={styles.logoutButtonText}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    backgroundColor: theme.colors.neutral.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    ...theme.shadows.sm,
  },
  logoutButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.error[600],
    fontFamily: 'ZenKaku-Bold',
  },
});
