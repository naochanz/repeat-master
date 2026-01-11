import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { theme } from '@/constants/theme';
import { router } from 'expo-router';
import { LogOut, Crown, ChevronRight, RefreshCw, Trash2 } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { userApi } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function SettingsScreen() {
  const logout = useAuthStore(state => state.logout);
  const { isPremium, expirationDate, willRenew, refreshStatus, restorePurchases, isLoading } = useSubscriptionStore();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleUpgrade = () => {
    router.push('/paywall?source=settings');
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウントを削除',
      'アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。\n\n本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userApi.deleteAccount();
      showSuccessToast('アカウントを削除しました');
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Failed to delete account:', error);
      showErrorToast('アカウントの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        {/* サブスクリプション状態 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プラン</Text>

          {isPremium ? (
            <View style={styles.premiumCard}>
              <View style={styles.premiumHeader}>
                <View style={styles.premiumBadge}>
                  <Crown size={20} color={theme.colors.warning[500]} fill={theme.colors.warning[500]} />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              </View>

              <View style={styles.premiumDetails}>
                {expirationDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>次回更新日</Text>
                    <Text style={styles.detailValue}>{formatDate(expirationDate)}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>自動更新</Text>
                  <Text style={[styles.detailValue, { color: willRenew ? theme.colors.success[600] : theme.colors.secondary[500] }]}>
                    {willRenew ? 'オン' : 'オフ'}
                  </Text>
                </View>
              </View>

              <Text style={styles.premiumNote}>
                サブスクリプションの管理はApp Storeから行えます
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.upgradeCard} onPress={handleUpgrade} activeOpacity={0.8}>
              <View style={styles.upgradeContent}>
                <View style={styles.upgradeIcon}>
                  <Crown size={24} color={theme.colors.warning[500]} />
                </View>
                <View style={styles.upgradeText}>
                  <Text style={styles.upgradeTitle}>プレミアムにアップグレード</Text>
                  <Text style={styles.upgradeDescription}>
                    問題集を無制限に登録して学習を加速
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.secondary[400]} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <RefreshCw size={18} color={theme.colors.primary[600]} />
            <Text style={styles.restoreButtonText}>購入を復元</Text>
          </TouchableOpacity>
        </View>

        {/* アカウント */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color={theme.colors.error[600]} />
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={isDeleting}
          >
            <Trash2 size={20} color={theme.colors.error[600]} />
            <Text style={styles.deleteAccountButtonText}>
              {isDeleting ? '削除中...' : 'アカウントを削除'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 法的情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法的情報</Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkButtonText}>プライバシーポリシー</Text>
            <ChevronRight size={20} color={theme.colors.secondary[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/terms')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkButtonText}>利用規約</Text>
            <ChevronRight size={20} color={theme.colors.secondary[400]} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  premiumCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.warning[300],
    ...theme.shadows.sm,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.warning[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  premiumBadgeText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.warning[700],
    fontFamily: 'ZenKaku-Bold',
  },
  premiumDetails: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  detailValue: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  premiumNote: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
    textAlign: 'center',
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    ...theme.shadows.sm,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  upgradeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  upgradeText: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: 2,
  },
  upgradeDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  restoreButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary[600],
    fontFamily: 'ZenKaku-Medium',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  logoutButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.medium as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Medium',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    ...theme.shadows.sm,
  },
  deleteAccountButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.medium as any,
    color: theme.colors.error[600],
    fontFamily: 'ZenKaku-Medium',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  linkButtonText: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Medium',
  },
});
