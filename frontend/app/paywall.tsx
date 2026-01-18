import { useAppTheme } from '@/hooks/useAppTheme';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { Check, Crown, X } from 'lucide-react-native';
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
import { router, useLocalSearchParams } from 'expo-router';
import { PurchasesPackage } from 'react-native-purchases';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

export default function PaywallScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { source } = useLocalSearchParams<{ source?: string }>();
  const {
    isPremium,
    isLoading,
    packages,
    fetchPackages,
    purchasePackage,
    restorePurchases,
  } = useSubscriptionStore();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0]);
    }
  }, [packages]);

  // すでにプレミアムの場合は戻る
  useEffect(() => {
    if (isPremium) {
      router.back();
    }
  }, [isPremium]);

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setPurchasing(true);
    try {
      const success = await purchasePackage(selectedPackage);
      if (success) {
        showSuccessToast('プレミアムプランへようこそ！');
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

  const handleClose = () => {
    router.back();
  };

  const features = [
    { text: '問題集を無制限に登録', free: false, premium: true },
    { text: '資格カテゴリを無制限に作成', free: false, premium: true },
    { text: '全ての学習履歴にアクセス', free: false, premium: true },
    { text: '問題集1冊を登録', free: true, premium: true },
    { text: '完了した問題集の閲覧', free: true, premium: true },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <X size={24} color={theme.colors.secondary[600]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            <Crown size={48} color={theme.colors.warning[500]} fill={theme.colors.warning[500]} />
          </View>
          <Text style={styles.title}>Repeat Master Premium</Text>
          <Text style={styles.subtitle}>学習を加速させよう</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>プラン比較</Text>

          <View style={styles.planHeader}>
            <View style={styles.planHeaderItem} />
            <View style={styles.planHeaderItem}>
              <Text style={styles.planHeaderText}>無料</Text>
            </View>
            <View style={[styles.planHeaderItem, styles.premiumHeader]}>
              <Text style={styles.planHeaderTextPremium}>Premium</Text>
            </View>
          </View>

          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Text style={styles.featureText}>{feature.text}</Text>
              <View style={styles.featureCheck}>
                {feature.free ? (
                  <Check size={20} color={theme.colors.success[500]} />
                ) : (
                  <X size={20} color={theme.colors.secondary[300]} />
                )}
              </View>
              <View style={[styles.featureCheck, styles.premiumCheck]}>
                <Check size={20} color={theme.colors.success[500]} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingSection}>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.identifier}
              style={[
                styles.packageCard,
                selectedPackage?.identifier === pkg.identifier && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage(pkg)}
            >
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>月額プラン</Text>
                <Text style={styles.packagePrice}>{pkg.product.priceString}/月</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedPackage?.identifier === pkg.identifier && styles.radioButtonSelected,
                ]}
              >
                {selectedPackage?.identifier === pkg.identifier && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {packages.length === 0 && (
            <View style={styles.noPackagesMessage}>
              <Text style={styles.noPackagesText}>
                現在プランを取得中です...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !selectedPackage}
        >
          {purchasing ? (
            <ActivityIndicator color={theme.colors.neutral.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>
              プレミアムを始める
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restoreButtonText}>購入を復元</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          サブスクリプションはいつでもキャンセルできます。
          購入後、Apple ID に課金されます。
        </Text>
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
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.warning[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[600],
  },
  featuresSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  planHeaderItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  premiumHeader: {
    backgroundColor: theme.colors.primary[100],
    borderRadius: theme.borderRadius.md,
  },
  planHeaderText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[600],
  },
  planHeaderTextPremium: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.primary[600],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[100],
  },
  featureText: {
    flex: 2,
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[800],
  },
  featureCheck: {
    flex: 1,
    alignItems: 'center',
  },
  premiumCheck: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.xs,
  },
  pricingSection: {
    marginBottom: theme.spacing.lg,
  },
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.secondary[200],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  packageCardSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.xs,
  },
  packagePrice: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.primary[600],
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.secondary[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary[600],
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary[600],
  },
  noPackagesMessage: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noPackagesText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary[100],
  },
  purchaseButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: theme.typography.fontSizes.lg,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  restoreButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.primary[600],
  },
  legalText: {
    fontSize: theme.typography.fontSizes.xs,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
    textAlign: 'center',
    lineHeight: 18,
  },
});
