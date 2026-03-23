import { useAppTheme } from '@/hooks/useAppTheme';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { Crown, X, Sparkles } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

export default function PaywallScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    isAdFree,
    isLoading,
    packages,
    fetchPackages,
    purchaseRemoveAds,
    restorePurchases,
  } = useSubscriptionStore();

  const [purchasing, setPurchasing] = useState(false);
  const [fetchingPackages, setFetchingPackages] = useState(false);

  useEffect(() => {
    const loadPackages = async () => {
      if (!isLoading) {
        setFetchingPackages(true);
        await fetchPackages();
        setFetchingPackages(false);
      }
    };
    loadPackages();
  }, [isLoading]);

  const removeAdsPackage = packages.length > 0 ? packages[0] : null;

  const handlePurchase = async () => {
    if (!removeAdsPackage) return;

    setPurchasing(true);
    try {
      const success = await purchaseRemoveAds(removeAdsPackage);
      if (success) {
        showSuccessToast('広告を非表示にしました！');
        router.back();
      }
    } catch (error) {
      showErrorToast('購入に失敗しました。もう一度お試しください。');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        showSuccessToast('購入を復元しました');
        router.back();
      } else {
        showErrorToast('復元できる購入が見つかりませんでした');
      }
    } catch (error) {
      showErrorToast('購入の復元に失敗しました');
    } finally {
      setPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </SafeAreaView>
    );
  }

  if (isAdFree) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            {/* @ts-ignore */}
            <X size={24} color={theme.colors.secondary[600]} />
          </TouchableOpacity>
        </View>
        <View style={styles.alreadyPurchased}>
          {/* @ts-ignore */}
          <Crown size={48} color={theme.colors.warning[500]} fill={theme.colors.warning[500]} />
          <Text style={styles.title}>広告非表示 購入済み</Text>
          <Text style={styles.subtitle}>快適な学習をお楽しみください</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          {/* @ts-ignore */}
          <X size={24} color={theme.colors.secondary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            {/* @ts-ignore */}
            <Sparkles size={48} color={theme.colors.warning[500]} />
          </View>
          <Text style={styles.title}>広告を非表示にする</Text>
          <Text style={styles.subtitle}>買い切りで広告なしの快適な学習体験を</Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitItem}>すべてのバナー広告が非表示になります</Text>
          <Text style={styles.benefitItem}>一度の購入でずっと有効</Text>
          <Text style={styles.benefitItem}>学習に集中できる環境に</Text>
        </View>

        {removeAdsPackage ? (
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>買い切り価格</Text>
            <Text style={styles.priceValue}>{removeAdsPackage.product.priceString}</Text>
          </View>
        ) : (
          <View style={styles.noPackagesMessage}>
            {fetchingPackages ? (
              <>
                <ActivityIndicator size="small" color={theme.colors.primary[600]} style={{ marginBottom: theme.spacing.sm }} />
                <Text style={styles.noPackagesText}>読み込み中...</Text>
              </>
            ) : (
              <Text style={styles.noPackagesText}>
                現在利用可能な商品がありません。
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseButton, (purchasing || !removeAdsPackage) && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !removeAdsPackage}
        >
          {purchasing ? (
            <ActivityIndicator color={theme.colors.neutral.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>広告を非表示にする</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restoreButtonText}>購入を復元</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing.md,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  alreadyPurchased: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingBottom: 100,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.lg,
  },
  crownContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.warning[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[600],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  benefitsSection: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  benefitItem: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[700],
    textAlign: 'center',
    lineHeight: 24,
  },
  priceCard: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
  },
  priceLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[600],
    marginBottom: theme.spacing.xs,
  },
  priceValue: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.primary[600],
  },
  noPackagesMessage: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  noPackagesText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  purchaseButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  restoreButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
  },
});
