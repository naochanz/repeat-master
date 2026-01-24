import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>プライバシーポリシー</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={theme.colors.secondary[600]} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>最終更新日: 2026年1月24日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. はじめに</Text>
          <Text style={styles.paragraph}>
            本プライバシーポリシー（以下「本ポリシー」）は、DORILOOP（以下「本アプリ」）における個人情報の取り扱いについて定めるものです。本アプリをご利用いただく前に、本ポリシーをよくお読みください。本アプリをダウンロードまたは利用することにより、本ポリシーに同意したものとみなされます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 運営者情報</Text>
          <Text style={styles.paragraph}>
            本アプリは個人開発者により運営されています。
          </Text>
          <Text style={styles.listItem}>• 運営者: 個人開発者</Text>
          <Text style={styles.listItem}>• お問い合わせ: アプリ内のお問い合わせ機能をご利用ください</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 収集する情報</Text>
          <Text style={styles.paragraph}>本アプリは、サービス提供のために以下の情報を収集します。</Text>

          <Text style={styles.subTitle}>3.1 ユーザーが提供する情報</Text>
          <Text style={styles.listItem}>• メールアドレス（アカウント作成・認証時）</Text>
          <Text style={styles.listItem}>• ユーザー名（任意で設定可能）</Text>
          <Text style={styles.listItem}>• Apple IDに関連する情報（Appleでサインイン利用時）</Text>

          <Text style={styles.subTitle}>3.2 自動的に収集される情報</Text>
          <Text style={styles.listItem}>• 学習記録（問題集、解答履歴、学習進捗、正答率）</Text>
          <Text style={styles.listItem}>• アプリの利用状況</Text>
          <Text style={styles.listItem}>• サブスクリプションおよび購入情報</Text>
          <Text style={styles.listItem}>• デバイス情報（OS、アプリバージョン）</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 情報の利用目的</Text>
          <Text style={styles.paragraph}>収集した情報は、以下の目的のために利用します。</Text>
          <Text style={styles.listItem}>• ユーザーアカウントの作成・認証・管理</Text>
          <Text style={styles.listItem}>• 学習進捗の記録・分析・表示</Text>
          <Text style={styles.listItem}>• サブスクリプションおよび購入の管理</Text>
          <Text style={styles.listItem}>• アプリの機能改善およびバグ修正</Text>
          <Text style={styles.listItem}>• ユーザーサポートの提供</Text>
          <Text style={styles.listItem}>• 利用規約の遵守確認</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 第三者サービスとの連携</Text>
          <Text style={styles.paragraph}>
            本アプリは、サービス提供のために以下の第三者サービスを利用しています。これらのサービスは、それぞれ独自のプライバシーポリシーに基づいて情報を取り扱います。
          </Text>
          <Text style={styles.listItem}>• Supabase: ユーザー認証およびデータベース管理</Text>
          <Text style={styles.listItem}>• RevenueCat: サブスクリプションおよび購入管理</Text>
          <Text style={styles.listItem}>• Apple: Apple IDによる認証、App Store決済</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 情報の共有</Text>
          <Text style={styles.paragraph}>
            当運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
          </Text>
          <Text style={styles.listItem}>• ユーザーの同意がある場合</Text>
          <Text style={styles.listItem}>• 法令に基づく開示請求があった場合</Text>
          <Text style={styles.listItem}>• 人の生命、身体または財産の保護のために必要な場合</Text>
          <Text style={styles.listItem}>• 上記第5項に記載の第三者サービスへの提供</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. データの保護</Text>
          <Text style={styles.paragraph}>
            当運営者は、ユーザーの個人情報を保護するために、以下のセキュリティ対策を講じています。
          </Text>
          <Text style={styles.listItem}>• データの暗号化（通信時および保存時）</Text>
          <Text style={styles.listItem}>• セキュアなクラウドインフラストラクチャの利用</Text>
          <Text style={styles.listItem}>• アクセス権限の適切な管理</Text>
          <Text style={styles.paragraph}>
            ただし、インターネット上のデータ送信および電子的な保存方法は、100%安全であることを保証するものではありません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. データの保存期間</Text>
          <Text style={styles.paragraph}>
            ユーザーの個人情報は、アカウントが有効である限り保存されます。アカウントを削除した場合、関連するすべてのデータは速やかに削除されます。ただし、法令により保存が義務付けられている情報については、必要な期間保存する場合があります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. ユーザーの権利</Text>
          <Text style={styles.paragraph}>ユーザーは、自己の個人情報について以下の権利を有します。</Text>
          <Text style={styles.listItem}>• アクセス権: 保存されている個人情報の確認</Text>
          <Text style={styles.listItem}>• 訂正権: 不正確な情報の訂正（設定画面から変更可能）</Text>
          <Text style={styles.listItem}>• 削除権: アカウントおよび関連データの削除（設定画面から実行可能）</Text>
          <Text style={styles.listItem}>• データポータビリティ: データのエクスポート（今後対応予定）</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 子供のプライバシー</Text>
          <Text style={styles.paragraph}>
            本アプリは、13歳未満の子供を対象としていません。13歳未満の方は、保護者の同意なく本アプリを利用することはできません。13歳未満の子供から意図せず個人情報を収集したことが判明した場合は、速やかに当該情報を削除します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Cookieおよびトラッキング技術</Text>
          <Text style={styles.paragraph}>
            本アプリは、ウェブサイトではないため、Cookieを使用しません。ただし、アプリの利用状況を把握するために、匿名化された分析データを収集する場合があります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. 本ポリシーの変更</Text>
          <Text style={styles.paragraph}>
            当運営者は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、アプリ内通知またはその他の適切な方法でお知らせします。変更後のポリシーは、アプリ内に掲載した時点で効力を生じます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. お問い合わせ</Text>
          <Text style={styles.paragraph}>
            本ポリシーに関するご質問やお問い合わせは、アプリ内のお問い合わせ機能よりご連絡ください。
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
  subTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold as any,
    color: theme.colors.secondary[800],
    fontFamily: 'ZenKaku-Medium',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
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
