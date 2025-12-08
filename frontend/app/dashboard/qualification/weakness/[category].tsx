import CustomTabBar from '@/components/CustomTabBar';
import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ArrowLeft, ChevronRight } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WeaknessAnalysisScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const quizBooks = useQuizBookStore(state => state.quizBooks);

  const weaknessData = useMemo(() => {
    const weakBooks = quizBooks
      .filter(book => book.category === category && (book.correctRate || 0) < 60);

    const weakChapters: any[] = [];

    weakBooks.forEach(book => {
      if (book.chapters) {
        book.chapters.forEach(chapter => {
          const totalQuestions = chapter.questions?.length || 0;
          const correctQuestions = chapter.questions?.filter(q => q.isCorrect)?.length || 0;
          const correctRate = totalQuestions > 0
            ? Math.round((correctQuestions / totalQuestions) * 100)
            : 0;

          if (correctRate < 60) {
            weakChapters.push({
              bookId: book.id,
              bookTitle: book.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              correctRate,
              totalQuestions,
              correctQuestions,
            });
          }
        });
      }
    });

    return {
      weakBooks,
      weakChapters: weakChapters.sort((a, b) => a.correctRate - b.correctRate),
    };
  }, [quizBooks, category]);

  const handleBack = () => {
    router.back();
  };

  const handleBookPress = (bookId: string) => {
    router.push({
      pathname: '/dashboard/book/[id]',
      params: { id: bookId },
    });
  };

  const getCorrectRateColor = (rate: number) => {
    if (rate >= 50) return theme.colors.warning[600];
    if (rate >= 30) return theme.colors.error[500];
    return theme.colors.error[600];
  };

  const getCorrectRateBackground = (rate: number) => {
    if (rate >= 50) return theme.colors.warning[50];
    if (rate >= 30) return theme.colors.error[100];
    return theme.colors.error[50];
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={theme.colors.secondary[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>弱点分析</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warningCard}>
            <AlertTriangle size={32} color={theme.colors.error[600]} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>
                {weaknessData.weakChapters.length}件の弱点が見つかりました
              </Text>
              <Text style={styles.warningDescription}>
                正答率60%未満の章を重点的に学習しましょう
              </Text>
            </View>
          </View>

          {weaknessData.weakBooks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>弱点はありません</Text>
              <Text style={styles.emptySubtext}>素晴らしいです！</Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                弱点章一覧 ({weaknessData.weakChapters.length}件)
              </Text>

              <View style={styles.chapterList}>
                {weaknessData.weakChapters.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.bookId}-${item.chapterId}`}
                    style={styles.chapterCard}
                    onPress={() => handleBookPress(item.bookId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.chapterCardLeft}>
                      <View style={styles.chapterRank}>
                        <Text style={styles.chapterRankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.chapterInfo}>
                        <Text style={styles.bookLabel}>{item.bookTitle}</Text>
                        <Text style={styles.chapterTitle} numberOfLines={2}>
                          {item.chapterTitle}
                        </Text>
                        <Text style={styles.chapterMeta}>
                          {item.correctQuestions}/{item.totalQuestions} 問正解
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chapterCardRight}>
                      <View style={[
                        styles.chapterRateBadge,
                        { backgroundColor: getCorrectRateBackground(item.correctRate) }
                      ]}>
                        <Text style={[
                          styles.chapterRateText,
                          { color: getCorrectRateColor(item.correctRate) }
                        ]}>
                          {item.correctRate}%
                        </Text>
                      </View>
                      <ChevronRight size={20} color={theme.colors.secondary[400]} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>学習のヒント</Text>
            <View style={styles.tipList}>
              <Text style={styles.tipItem}>• 正答率が低い章から優先的に学習</Text>
              <Text style={styles.tipItem}>• 間違えた問題を重点的に復習</Text>
              <Text style={styles.tipItem}>• 定期的に繰り返し学習して定着</Text>
            </View>
          </View>
        </ScrollView>
        <CustomTabBar />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.error[50],
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.error[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  warningCard: {
    backgroundColor: theme.colors.error[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.error[300],
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.error[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.xs,
  },
  warningDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.error[700],
    fontFamily: 'ZenKaku-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 3,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSizes.base,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.md,
  },
  chapterList: {
    gap: theme.spacing.md,
  },
  chapterCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.error[300],
    ...theme.shadows.sm,
  },
  chapterCardLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  chapterRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.error[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterRankText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  chapterInfo: {
    flex: 1,
  },
  bookLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.xs,
  },
  chapterMeta: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
  },
  chapterCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chapterRateBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  chapterRateText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    fontFamily: 'ZenKaku-Bold',
  },
  tipCard: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
  },
  tipTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    marginBottom: theme.spacing.md,
  },
  tipList: {
    gap: theme.spacing.sm,
  },
  tipItem: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[700],
    fontFamily: 'ZenKaku-Regular',
    lineHeight: 20,
  },
});
