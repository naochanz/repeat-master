import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'プライバシーポリシー',
          headerBackTitle: '戻る',
        }}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>最終更新日: 2024年1月1日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. はじめに</Text>
          <Text style={styles.paragraph}>
            DORILOOP（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーは、本アプリがどのような情報を収集し、どのように使用するかを説明します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 収集する情報</Text>
          <Text style={styles.paragraph}>本アプリは以下の情報を収集します：</Text>
          <Text style={styles.listItem}>• メールアドレス（アカウント作成時）</Text>
          <Text style={styles.listItem}>• 学習記録（問題集、解答履歴、学習進捗）</Text>
          <Text style={styles.listItem}>• サブスクリプション情報</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 情報の使用目的</Text>
          <Text style={styles.paragraph}>収集した情報は以下の目的で使用します：</Text>
          <Text style={styles.listItem}>• アカウントの認証と管理</Text>
          <Text style={styles.listItem}>• 学習進捗の記録と表示</Text>
          <Text style={styles.listItem}>• サービスの改善</Text>
          <Text style={styles.listItem}>• サブスクリプションの管理</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 情報の共有</Text>
          <Text style={styles.paragraph}>
            本アプリは、法律で義務付けられている場合を除き、ユーザーの個人情報を第三者と共有することはありません。ただし、サービス提供のために以下のサードパーティサービスを利用しています：
          </Text>
          <Text style={styles.listItem}>• Supabase（データベース・認証）</Text>
          <Text style={styles.listItem}>• RevenueCat（サブスクリプション管理）</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. データの保護</Text>
          <Text style={styles.paragraph}>
            ユーザーのデータは暗号化され、安全なサーバーに保存されます。不正アクセス、改ざん、漏洩を防ぐための適切なセキュリティ対策を講じています。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. データの削除</Text>
          <Text style={styles.paragraph}>
            ユーザーはいつでもアカウントを削除することができます。アカウントを削除すると、関連するすべてのデータが完全に削除されます。アカウントの削除は設定画面から行えます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 子供のプライバシー</Text>
          <Text style={styles.paragraph}>
            本アプリは13歳未満の子供を対象としていません。13歳未満の子供から意図的に個人情報を収集することはありません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. ポリシーの変更</Text>
          <Text style={styles.paragraph}>
            本プライバシーポリシーは、必要に応じて更新されることがあります。重要な変更がある場合は、アプリ内で通知します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. お問い合わせ</Text>
          <Text style={styles.paragraph}>
            プライバシーに関するご質問やご懸念がある場合は、アプリのサポートまでお問い合わせください。
          </Text>
        </View>

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
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  lastUpdated: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[500],
    fontFamily: 'ZenKaku-Regular',
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
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});
