import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleEmailPress = () => {
    Linking.openURL('mailto:naochanz927.2@gmail.com');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>プライバシーポリシー</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={theme.colors.secondary[600]} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          DORILOOP（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。
          本プライバシーポリシーは、本アプリにおける個人情報の取り扱いについて説明します。
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 収集する情報</Text>
          <Text style={styles.paragraph}>本アプリでは、以下の情報を収集する場合があります。</Text>
          <Text style={styles.listItem}>• メールアドレス（アカウント登録時）</Text>
          <Text style={styles.listItem}>• 学習データ（問題集の登録情報、回答履歴、正答率など）</Text>
          <Text style={styles.listItem}>• アプリの利用状況に関するデータ</Text>
          <Text style={styles.listItem}>• お問い合わせ時にご提供いただく情報</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 情報の利用目的</Text>
          <Text style={styles.paragraph}>収集した情報は、以下の目的で利用します。</Text>
          <Text style={styles.listItem}>• 本アプリのサービス提供および機能の改善</Text>
          <Text style={styles.listItem}>• ユーザーサポートの提供</Text>
          <Text style={styles.listItem}>• サービスに関する重要なお知らせの送信</Text>
          <Text style={styles.listItem}>• 利用規約違反への対応</Text>
          <Text style={styles.listItem}>• 統計データの作成（個人を特定できない形式）</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 第三者への提供について</Text>
          <Text style={styles.paragraph}>
            本アプリは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
          </Text>
          <Text style={styles.listItem}>• ユーザーの同意がある場合</Text>
          <Text style={styles.listItem}>• 法令に基づく場合</Text>
          <Text style={styles.listItem}>• 人の生命、身体または財産の保護のために必要な場合</Text>
          <Text style={styles.listItem}>• サービス提供に必要な業務委託先に提供する場合（適切な管理のもと）</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. データの保護について</Text>
          <Text style={styles.paragraph}>
            本アプリは、ユーザーの個人情報を適切に管理し、不正アクセス、紛失、破壊、改ざん、
            漏洩などを防止するため、必要かつ適切なセキュリティ対策を講じています。
            データは暗号化され、安全なサーバーに保存されます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. データの保存期間</Text>
          <Text style={styles.paragraph}>
            ユーザーの個人情報は、サービス提供に必要な期間保存されます。
            アカウントを削除された場合、関連する個人情報は合理的な期間内に削除されます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. ユーザーの権利</Text>
          <Text style={styles.paragraph}>ユーザーは以下の権利を有します。</Text>
          <Text style={styles.listItem}>• 個人情報へのアクセス権</Text>
          <Text style={styles.listItem}>• 個人情報の訂正・削除の請求権</Text>
          <Text style={styles.listItem}>• 個人情報の利用停止の請求権</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. プライバシーポリシーの変更</Text>
          <Text style={styles.paragraph}>
            本プライバシーポリシーは、必要に応じて変更されることがあります。
            重要な変更がある場合は、アプリ内またはメールでお知らせします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. お問い合わせ先</Text>
          <Text style={styles.paragraph}>
            本プライバシーポリシーに関するお問い合わせは、以下までご連絡ください。
          </Text>
          <TouchableOpacity onPress={handleEmailPress}>
            <Text style={styles.emailLink}>naochanz927.2@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dateText}>
          制定日: 2026年1月1日{'\n'}
          最終更新日: 2026年1月1日
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[100],
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  intro: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Regular',
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  listItem: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Regular',
    lineHeight: 24,
    marginLeft: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emailLink: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.primary[600],
    fontFamily: 'ZenKaku-Regular',
    marginTop: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
    marginTop: theme.spacing.xl,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});
