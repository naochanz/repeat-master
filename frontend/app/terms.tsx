import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function TermsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '利用規約',
          headerBackTitle: '戻る',
        }}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>最終更新日: 2024年1月1日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 規約への同意</Text>
          <Text style={styles.paragraph}>
            Repeat Master（以下「本アプリ」）をご利用いただくことにより、本利用規約に同意したものとみなされます。本規約に同意いただけない場合は、本アプリをご利用いただけません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. サービスの説明</Text>
          <Text style={styles.paragraph}>
            本アプリは、問題集を使った反復学習をサポートするための学習管理アプリです。ユーザーは問題集を登録し、解答履歴を記録することで、効率的な学習を行うことができます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. アカウント</Text>
          <Text style={styles.paragraph}>
            本アプリを利用するには、アカウントの作成が必要です。ユーザーは、正確な情報を提供し、アカウント情報を安全に管理する責任を負います。アカウントの不正使用については、ユーザー自身が責任を負います。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. サブスクリプション</Text>
          <Text style={styles.paragraph}>
            本アプリは、無料プランとプレミアムプランを提供しています。
          </Text>
          <Text style={styles.listItem}>• 無料プラン：1つの問題集を登録可能</Text>
          <Text style={styles.listItem}>• プレミアムプラン：問題集を無制限に登録可能</Text>
          <Text style={styles.paragraph}>
            プレミアムプランは月額課金制で、購入確認時にApple IDアカウントに請求されます。サブスクリプションは、現在の期間が終了する24時間以上前にキャンセルしない限り、自動的に更新されます。
          </Text>
          <Text style={styles.paragraph}>
            サブスクリプションの管理やキャンセルは、App Storeのアカウント設定から行うことができます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 禁止事項</Text>
          <Text style={styles.paragraph}>以下の行為は禁止されています：</Text>
          <Text style={styles.listItem}>• 不正アクセスやハッキング行為</Text>
          <Text style={styles.listItem}>• 本アプリの逆コンパイル、逆アセンブル、リバースエンジニアリング</Text>
          <Text style={styles.listItem}>• 他のユーザーへの迷惑行為</Text>
          <Text style={styles.listItem}>• 法律に違反する行為</Text>
          <Text style={styles.listItem}>• 本アプリの運営を妨害する行為</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 知的財産権</Text>
          <Text style={styles.paragraph}>
            本アプリおよびそのコンテンツ（デザイン、ロゴ、ソフトウェアなど）に関するすべての知的財産権は、当社または正当なライセンス権者に帰属します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 免責事項</Text>
          <Text style={styles.paragraph}>
            本アプリは「現状有姿」で提供され、明示または黙示を問わず、いかなる保証も行いません。本アプリの使用によって生じたいかなる損害についても、当社は責任を負いません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. サービスの変更・終了</Text>
          <Text style={styles.paragraph}>
            当社は、事前の通知なく、本アプリの内容を変更、または提供を終了することがあります。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 規約の変更</Text>
          <Text style={styles.paragraph}>
            当社は、必要に応じて本規約を変更することがあります。重要な変更がある場合は、アプリ内で通知します。変更後も本アプリを継続して利用することにより、変更後の規約に同意したものとみなされます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 準拠法</Text>
          <Text style={styles.paragraph}>
            本規約は日本法に準拠し、日本法に従って解釈されるものとします。
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
