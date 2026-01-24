import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import React, { useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

export default function TermsScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>利用規約</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={theme.colors.secondary[600]} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>最終更新日: 2026年1月24日</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. はじめに</Text>
          <Text style={styles.paragraph}>
            本利用規約（以下「本規約」）は、DORILOOP（以下「本アプリ」）の利用条件を定めるものです。ユーザーは、本アプリをダウンロード、インストール、または利用することにより、本規約に同意したものとみなされます。本規約に同意いただけない場合は、本アプリをご利用いただくことはできません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. サービスの内容</Text>
          <Text style={styles.paragraph}>
            本アプリは、問題集を使った反復学習をサポートする学習管理アプリです。ユーザーは以下の機能を利用することができます。
          </Text>
          <Text style={styles.listItem}>• 問題集の登録・管理</Text>
          <Text style={styles.listItem}>• 学習記録の保存・分析</Text>
          <Text style={styles.listItem}>• 学習進捗の可視化</Text>
          <Text style={styles.listItem}>• 復習スケジュールの管理</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. アカウント</Text>
          <Text style={styles.subTitle}>3.1 アカウントの作成</Text>
          <Text style={styles.paragraph}>
            本アプリの利用には、アカウントの作成が必要です。アカウント作成時には、正確かつ最新の情報を提供してください。
          </Text>
          <Text style={styles.subTitle}>3.2 アカウントの管理</Text>
          <Text style={styles.paragraph}>
            ユーザーは、自己のアカウント情報（パスワードを含む）を適切に管理する責任を負います。アカウントの不正使用が発生した場合は、速やかにご連絡ください。
          </Text>
          <Text style={styles.subTitle}>3.3 アカウントの削除</Text>
          <Text style={styles.paragraph}>
            ユーザーは、設定画面からいつでもアカウントを削除することができます。アカウントを削除すると、すべてのデータが完全に削除され、復元することはできません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 料金プラン</Text>
          <Text style={styles.subTitle}>4.1 無料プラン</Text>
          <Text style={styles.paragraph}>
            無料プランでは、1つの問題集を登録して利用することができます。
          </Text>
          <Text style={styles.subTitle}>4.2 プレミアムプラン（サブスクリプション）</Text>
          <Text style={styles.paragraph}>
            プレミアムプランでは、問題集を無制限に登録することができます。プレミアムプランは月額または年額のサブスクリプション形式で提供されます。
          </Text>
          <Text style={styles.listItem}>• 購入確認時にApple IDアカウントに請求されます</Text>
          <Text style={styles.listItem}>• サブスクリプションは、現在の期間終了の24時間以上前にキャンセルしない限り、自動的に更新されます</Text>
          <Text style={styles.listItem}>• 更新料金は、現在の期間終了前の24時間以内に請求されます</Text>
          <Text style={styles.listItem}>• サブスクリプションの管理およびキャンセルは、購入後にApp Storeのアカウント設定から行うことができます</Text>
          <Text style={styles.subTitle}>4.3 問題集追加枠（買い切り）</Text>
          <Text style={styles.paragraph}>
            無料プランのユーザーは、買い切り購入により問題集の登録枠を追加することができます。購入した追加枠は永続的に有効です。
          </Text>
          <Text style={styles.subTitle}>4.4 無料トライアル</Text>
          <Text style={styles.paragraph}>
            無料トライアル期間が提供される場合、トライアル期間終了前にキャンセルしない限り、トライアル終了時に自動的に有料サブスクリプションに移行します。未使用のトライアル期間は、サブスクリプション購入時に失効します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 禁止事項</Text>
          <Text style={styles.paragraph}>ユーザーは、以下の行為を行ってはなりません。</Text>
          <Text style={styles.listItem}>• 法令または本規約に違反する行為</Text>
          <Text style={styles.listItem}>• 不正アクセス、ハッキング、その他のセキュリティを侵害する行為</Text>
          <Text style={styles.listItem}>• 本アプリのリバースエンジニアリング、逆コンパイル、逆アセンブル</Text>
          <Text style={styles.listItem}>• 本アプリの運営を妨害する行為</Text>
          <Text style={styles.listItem}>• 他のユーザーまたは第三者の権利を侵害する行為</Text>
          <Text style={styles.listItem}>• 虚偽の情報を登録する行為</Text>
          <Text style={styles.listItem}>• 本アプリを商業目的で利用する行為（当運営者の許可がある場合を除く）</Text>
          <Text style={styles.listItem}>• その他、当運営者が不適切と判断する行為</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 知的財産権</Text>
          <Text style={styles.paragraph}>
            本アプリおよびそのコンテンツ（デザイン、ロゴ、テキスト、グラフィック、ソフトウェアなど）に関するすべての知的財産権は、当運営者または正当なライセンス権者に帰属します。ユーザーは、当運営者の事前の書面による許可なく、これらを複製、配布、修正、公開することはできません。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. ユーザーコンテンツ</Text>
          <Text style={styles.paragraph}>
            ユーザーが本アプリに登録したコンテンツ（問題集のタイトル、学習記録など）の権利はユーザーに帰属します。ただし、ユーザーは、当運営者がサービス提供のために必要な範囲でこれらのコンテンツを利用することを許諾します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 免責事項</Text>
          <Text style={styles.subTitle}>8.1 サービスの提供</Text>
          <Text style={styles.paragraph}>
            本アプリは「現状有姿」で提供され、明示または黙示を問わず、いかなる保証も行いません。当運営者は、本アプリが中断なく、エラーなく動作することを保証しません。
          </Text>
          <Text style={styles.subTitle}>8.2 損害の免責</Text>
          <Text style={styles.paragraph}>
            法律で許容される最大限の範囲において、当運営者は、本アプリの利用または利用不能に起因する直接的、間接的、偶発的、特別、結果的損害について、一切の責任を負いません。
          </Text>
          <Text style={styles.subTitle}>8.3 データの損失</Text>
          <Text style={styles.paragraph}>
            当運営者は、技術的な問題やその他の理由により生じたデータの損失について、責任を負いません。重要なデータは定期的にバックアップすることをお勧めします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. サービスの変更・終了</Text>
          <Text style={styles.paragraph}>
            当運営者は、事前の通知の有無にかかわらず、本アプリの内容を変更、または提供を一時的もしくは永久に終了することがあります。サービス終了の場合、可能な限り事前に通知するよう努めます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 利用停止・アカウント削除</Text>
          <Text style={styles.paragraph}>
            当運営者は、ユーザーが本規約に違反した場合、または違反したと合理的に判断した場合、事前の通知なくユーザーのアカウントを停止または削除することができます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. 規約の変更</Text>
          <Text style={styles.paragraph}>
            当運営者は、必要に応じて本規約を変更することがあります。重要な変更がある場合は、アプリ内通知またはその他の適切な方法でお知らせします。変更後も本アプリを継続して利用することにより、変更後の規約に同意したものとみなされます。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. 準拠法および管轄</Text>
          <Text style={styles.paragraph}>
            本規約は日本法に準拠し、日本法に従って解釈されるものとします。本規約に関連する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. 分離可能性</Text>
          <Text style={styles.paragraph}>
            本規約のいずれかの条項が無効または執行不能と判断された場合でも、残りの条項は引き続き有効に存続します。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. お問い合わせ</Text>
          <Text style={styles.paragraph}>
            本規約に関するご質問やお問い合わせは、アプリ内のお問い合わせ機能よりご連絡ください。
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
