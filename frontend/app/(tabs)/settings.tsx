import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal, TextInput } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { router } from 'expo-router';
import { LogOut, Crown, ChevronRight, RefreshCw, Trash2, Moon, User, Edit3 } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useThemeStore } from '@/stores/themeStore';
import { userApi } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const logout = useAuthStore(state => state.logout);
  const profile = useAuthStore(state => state.profile);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const { isPremium, expirationDate, willRenew, refreshStatus, restorePurchases, isLoading } = useSubscriptionStore();
  const { isDark, setMode } = useThemeStore();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

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

  const handleToggleDarkMode = async (value: boolean) => {
    await setMode(value ? 'dark' : 'light');
  };

  const handleEditName = () => {
    setTempName(profile?.name || '');
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      showErrorToast('ユーザー名を入力してください');
      return;
    }

    setIsUpdatingName(true);
    try {
      await updateProfile({ name: tempName.trim() });
      showSuccessToast('ユーザー名を更新しました');
      setShowNameModal(false);
    } catch (error) {
      console.error('Failed to update name:', error);
      showErrorToast('ユーザー名の更新に失敗しました');
    } finally {
      setIsUpdatingName(false);
    }
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

        {/* プロフィール */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロフィール</Text>

          <TouchableOpacity
            style={styles.standardCard}
            onPress={handleEditName}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <User size={20} color={theme.colors.primary[600]} />
              <Text style={styles.cardLabel}>{profile?.name || '未設定'}</Text>
            </View>
            <Edit3 size={20} color={theme.colors.secondary[400]} />
          </TouchableOpacity>
        </View>

        {/* 外観 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外観</Text>

          <View style={styles.standardCard}>
            <View style={styles.cardLeft}>
              <Moon size={20} color={theme.colors.primary[600]} />
              <Text style={styles.cardLabel}>ダークモード</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: theme.colors.secondary[200], true: theme.colors.primary[400] }}
              thumbColor={isDark ? theme.colors.primary[600] : theme.colors.neutral.white}
            />
          </View>
        </View>

        {/* アカウント */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>

          <TouchableOpacity
            style={[styles.standardCard, { marginBottom: theme.spacing.sm }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <LogOut size={20} color={theme.colors.secondary[600]} />
              <Text style={styles.cardLabel}>ログアウト</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.standardCard, styles.dangerCard]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
            disabled={isDeleting}
          >
            <View style={styles.cardLeft}>
              <Trash2 size={20} color={theme.colors.error[600]} />
              <Text style={[styles.cardLabel, { color: theme.colors.error[600] }]}>
                {isDeleting ? '削除中...' : 'アカウントを削除'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 法的情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>法的情報</Text>

          <TouchableOpacity
            style={[styles.standardCard, { marginBottom: theme.spacing.sm }]}
            onPress={() => router.push('/privacy-policy')}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardLabel}>プライバシーポリシー</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.secondary[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.standardCard}
            onPress={() => router.push('/terms')}
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardLabel}>利用規約</Text>
            </View>
            <ChevronRight size={20} color={theme.colors.secondary[400]} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ユーザー名編集モーダル */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ユーザー名を変更</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="ユーザー名"
              placeholderTextColor={theme.colors.secondary[400]}
              maxLength={30}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNameModal(false)}
                disabled={isUpdatingName}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveName}
                disabled={isUpdatingName}
              >
                <Text style={styles.saveButtonText}>
                  {isUpdatingName ? '保存中...' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
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
  standardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    ...theme.shadows.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cardLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Medium',
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
    borderRadius: 999,
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
  dangerCard: {
    borderColor: theme.colors.error[300],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.secondary[100],
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Bold',
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
});
