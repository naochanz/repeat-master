import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

export default function TermsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleEmailPress = () => {
    Linking.openURL('mailto:naochanz927.2@gmail.com');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>利用規約</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={theme.colors.secondary[600]} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          この利用規約（以下「本規約」）は、DORILOOP（以下「本アプリ」）の利用に関する条件を定めるものです。
          本アプリをご利用になる前に、本規約をよくお読みください。
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第1条（サービスの内容）</Text>
          <Text style={styles.paragraph}>
            本アプリは、問題集を使った学習を管理するためのアプリケーションです。主な機能は以下の通りです。
          </Text>
          <Text style={styles.listItem}>• 問題集の登録・管理</Text>
          <Text style={styles.listItem}>• 問題の正解・不正解の記録</Text>
          <Text style={styles.listItem}>• 学習進捗の可視化</Text>
          <Text style={styles.listItem}>• メモ・付箋機能</Text>
          <Text style={styles.listItem}>• 周回ごとの成績記録</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第2条（アカウントについて）</Text>
          <Text style={styles.numberedItem}>1. 本アプリの一部機能を利用するにはアカウント登録が必要です。</Text>
          <Text style={styles.numberedItem}>2. ユーザーは、正確かつ最新の情報を登録する必要があります。</Text>
          <Text style={styles.numberedItem}>3. アカウント情報の管理はユーザー自身の責任で行うものとします。</Text>
          <Text style={styles.numberedItem}>4. アカウントの第三者への譲渡、貸与は禁止します。</Text>
          <Text style={styles.numberedItem}>5. 不正利用が発覚した場合、アカウントを停止または削除する場合があります。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第3条（料金プラン）</Text>
          <Text style={styles.numberedItem}>1. 本アプリには無料プランと有料プラン（プレミアムプラン、追加枠）があります。</Text>
          <Text style={styles.numberedItem}>2. 有料プランの料金は、アプリ内に表示された金額とします。</Text>
          <Text style={styles.numberedItem}>3. サブスクリプションは、解約手続きを行わない限り自動更新されます。</Text>
          <Text style={styles.numberedItem}>4. 支払いはApple IDを通じて行われ、Appleの決済規約が適用されます。</Text>
          <Text style={styles.numberedItem}>5. 返金については、Appleの返金ポリシーに従います。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第4条（禁止事項）</Text>
          <Text style={styles.paragraph}>ユーザーは、以下の行為を行ってはなりません。</Text>
          <Text style={styles.listItem}>• 法令または公序良俗に違反する行為</Text>
          <Text style={styles.listItem}>• 犯罪行為に関連する行為</Text>
          <Text style={styles.listItem}>• 本アプリのサーバーやネットワーク機能を妨害する行為</Text>
          <Text style={styles.listItem}>• 本アプリの運営を妨害するおそれのある行為</Text>
          <Text style={styles.listItem}>• 他のユーザーに関する個人情報等を収集または蓄積する行為</Text>
          <Text style={styles.listItem}>• 他のユーザーに成りすます行為</Text>
          <Text style={styles.listItem}>• 本アプリに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</Text>
          <Text style={styles.listItem}>• 本アプリの逆コンパイル、リバースエンジニアリング、逆アセンブル</Text>
          <Text style={styles.listItem}>• その他、運営者が不適切と判断する行為</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第5条（知的財産権）</Text>
          <Text style={styles.paragraph}>
            本アプリに関する著作権、商標権その他の知的財産権は、運営者または正当な権利者に帰属します。
            ユーザーは、本アプリのコンテンツを運営者の許可なく複製、転載、改変、配布することはできません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第6条（免責事項）</Text>
          <Text style={styles.numberedItem}>1. 運営者は、本アプリの内容の正確性、完全性、有用性等について保証しません。</Text>
          <Text style={styles.numberedItem}>2. 運営者は、本アプリの利用により生じた損害について、故意または重過失がある場合を除き、責任を負いません。</Text>
          <Text style={styles.numberedItem}>3. 運営者は、ユーザーのデータの消失、破損について責任を負いません。重要なデータはバックアップを取ることをお勧めします。</Text>
          <Text style={styles.numberedItem}>4. 運営者は、本アプリの中断、停止、終了、利用不能について責任を負いません。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第7条（サービスの変更・終了）</Text>
          <Text style={styles.numberedItem}>1. 運営者は、ユーザーに事前に通知することなく、本アプリの内容を変更することができます。</Text>
          <Text style={styles.numberedItem}>2. 運営者は、相当の予告期間をもって、本アプリの提供を終了することができます。</Text>
          <Text style={styles.numberedItem}>3. サービス終了の場合、有料プランの未使用期間については、適切な対応を行います。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第8条（利用規約の変更）</Text>
          <Text style={styles.paragraph}>
            運営者は、必要に応じて本規約を変更することができます。
            変更後の利用規約は、本アプリ内またはウェブサイトに掲載した時点で効力を生じるものとします。
            重要な変更がある場合は、適切な方法でユーザーに通知します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第9条（準拠法・管轄裁判所）</Text>
          <Text style={styles.numberedItem}>1. 本規約の解釈にあたっては、日本法を準拠法とします。</Text>
          <Text style={styles.numberedItem}>2. 本アプリに関して紛争が生じた場合には、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>第10条（お問い合わせ）</Text>
          <Text style={styles.paragraph}>
            本規約に関するお問い合わせは、以下までご連絡ください。
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
  numberedItem: {
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
