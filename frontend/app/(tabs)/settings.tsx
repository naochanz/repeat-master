import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_COMPLETE_KEY } from '../onboarding';
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
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  const handleUpgrade = () => {
    router.push('/paywall?source=settings');
  };

  const handlePremiumTap = () => {
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

  // TODO: 確認後削除
  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    Alert.alert('リセット完了', 'アプリを再起動してください');
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* プラン */}
        <Text style={styles.sectionLabel}>プラン</Text>
        {isPremium ? (
          <>
            <TouchableOpacity style={styles.row} onPress={handlePremiumTap} activeOpacity={0.6}>
              <View style={styles.rowLeft}>
                <Crown size={20} color={theme.colors.warning[500]} fill={theme.colors.warning[500]} />
                <Text style={styles.rowLabel}>Premium</Text>
              </View>
              <ChevronRight size={18} color={theme.colors.secondary[400]} />
            </TouchableOpacity>
            {expirationDate && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>次回更新日</Text>
                <Text style={styles.rowValue}>{formatDate(expirationDate)}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>自動更新</Text>
              <Text style={[styles.rowValue, { color: willRenew ? theme.colors.success[600] : theme.colors.secondary[500] }]}>
                {willRenew ? 'オン' : 'オフ'}
              </Text>
            </View>
          </>
        ) : (
          <TouchableOpacity style={styles.row} onPress={handleUpgrade} activeOpacity={0.6}>
            <View style={styles.rowLeft}>
              <Crown size={20} color={theme.colors.warning[500]} />
              <Text style={styles.rowLabel}>プレミアムにアップグレード</Text>
            </View>
            <ChevronRight size={18} color={theme.colors.secondary[400]} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.row}
          onPress={handleRestore}
          activeOpacity={0.6}
          disabled={isLoading}
        >
          <View style={styles.rowLeft}>
            <RefreshCw size={20} color={theme.colors.primary[600]} />
            <Text style={styles.rowLabel}>購入を復元</Text>
          </View>
        </TouchableOpacity>

        {/* アカウント */}
        <Text style={styles.sectionLabel}>アカウント</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={handleEditName}
          activeOpacity={0.6}
        >
          <View style={styles.rowLeft}>
            <User size={20} color={theme.colors.primary[600]} />
            <Text style={styles.rowLabel}>ユーザー名</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowValue}>{profile?.name || '未設定'}</Text>
            <Edit3 size={18} color={theme.colors.secondary[400]} />
          </View>
        </TouchableOpacity>

        {/* 外観 */}
        <Text style={styles.sectionLabel}>外観</Text>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Moon size={20} color={theme.colors.primary[600]} />
            <Text style={styles.rowLabel}>ダークモード</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={handleToggleDarkMode}
            trackColor={{ false: theme.colors.secondary[200], true: theme.colors.primary[400] }}
            thumbColor={isDark ? theme.colors.primary[600] : theme.colors.neutral.white}
          />
        </View>

        {/* 法的情報 */}
        <Text style={styles.sectionLabel}>法的情報</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/privacy-policy')}
          activeOpacity={0.6}
        >
          <Text style={styles.rowLabel}>プライバシーポリシー</Text>
          <ChevronRight size={18} color={theme.colors.secondary[400]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/terms')}
          activeOpacity={0.6}
        >
          <Text style={styles.rowLabel}>利用規約</Text>
          <ChevronRight size={18} color={theme.colors.secondary[400]} />
        </TouchableOpacity>

        {/* デバッグ（確認後削除） */}
        <Text style={styles.sectionLabel}>デバッグ</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={handleResetOnboarding}
          activeOpacity={0.6}
        >
          <Text style={styles.rowLabel}>オンボーディングをリセット</Text>
        </TouchableOpacity>

        {/* その他 */}
        <Text style={styles.sectionLabel}>その他</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={handleLogout}
          activeOpacity={0.6}
        >
          <View style={styles.rowLeft}>
            <LogOut size={20} color={theme.colors.secondary[600]} />
            <Text style={styles.rowLabel}>ログアウト</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={handleDeleteAccount}
          activeOpacity={0.6}
          disabled={isDeleting}
        >
          <View style={styles.rowLeft}>
            <Trash2 size={20} color={theme.colors.error[600]} />
            <Text style={[styles.rowLabel, { color: theme.colors.error[600] }]}>
              {isDeleting ? '削除中...' : 'アカウントを削除'}
            </Text>
          </View>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowLabel: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Medium',
  },
  rowValue: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
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
