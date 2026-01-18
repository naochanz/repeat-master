import CustomTabBar from '@/components/CustomTabBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ArrowLeft, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookDetailScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const quizBooks = useQuizBookStore(state => state.quizBooks);

  const book = useMemo(() => {
    return quizBooks.find(b => b.id === id);
  }, [quizBooks, id]);

  const chapterStats = useMemo(() => {
    if (!book || !book.chapters) return [];

    return book.chapters.map(chapter => {
      const totalQuestions = chapter.questions?.length || 0;
      const correctQuestions = chapter.questions?.filter(q => q.isCorrect)?.length || 0;
      const correctRate = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

      return {
        ...chapter,
        totalQuestions,
        correctQuestions,
        correctRate,
      };
    }).sort((a, b) => a.correctRate - b.correctRate);
  }, [book]);

  const stats = useMemo(() => {
    const weakChapters = chapterStats.filter(ch => ch.correctRate < 60);
    const strongChapters = chapterStats.filter(ch => ch.correctRate >= 80);
    const avgCorrectRate = chapterStats.length > 0
      ? Math.round(chapterStats.reduce((sum, ch) => sum + ch.correctRate, 0) / chapterStats.length)
      : 0;

    return {
      weakChapters,
      strongChapters,
      avgCorrectRate,
      totalChapters: chapterStats.length,
    };
  }, [chapterStats]);

  const handleBack = () => {
    router.back();
  };

  const handleStartStudy = () => {
    router.push({
      pathname: '/study/[id]',
      params: { id: book?.id },
    });
  };

  const getCorrectRateColor = (rate: number) => {
    if (rate >= 80) return theme.colors.success[600];
    if (rate >= 60) return theme.colors.warning[600];
    return theme.colors.error[600];
  };

  const getCorrectRateBackground = (rate: number) => {
    if (rate >= 80) return theme.colors.success[50];
    if (rate >= 60) return theme.colors.warning[50];
    return theme.colors.error[50];
  };

  if (!book) {
    return (
      <View style={styles.container}>
        <Text>問題集が見つかりません</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={theme.colors.secondary[900]} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerCategory}>{book.category}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>全体正答率</Text>
                <View style={[
                  styles.summaryBadge,
                  { backgroundColor: getCorrectRateBackground(book.correctRate || 0) }
                ]}>
                  <Text style={[
                    styles.summaryValue,
                    { color: getCorrectRateColor(book.correctRate || 0) }
                  ]}>
                    {book.correctRate || 0}%
                  </Text>
                </View>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>周回数</Text>
                <Text style={styles.summaryValue}>{book.currentRound || 0}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>章数</Text>
                <Text style={styles.summaryValue}>{stats.totalChapters}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.studyButton}
              onPress={handleStartStudy}
              activeOpacity={0.7}
            >
              <Text style={styles.studyButtonText}>学習を開始</Text>
            </TouchableOpacity>
          </View>

          {stats.weakChapters.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <AlertTriangle size={20} color={theme.colors.error[600]} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.error[700] }]}>
                    弱点章 ({stats.weakChapters.length})
                  </Text>
                </View>
                <Text style={styles.sectionSubtitle}>正答率60%未満 - 重点的に学習しましょう</Text>
              </View>

              <View style={styles.chapterList}>
                {stats.weakChapters.map((chapter) => (
                  <View key={chapter.id} style={[styles.chapterCard, styles.chapterCardWeak]}>
                    <View style={styles.chapterCardLeft}>
                      <View style={styles.chapterTitleRow}>
                        <TrendingDown size={16} color={theme.colors.error[600]} />
                        <Text style={styles.chapterTitle} numberOfLines={1}>
                          {chapter.title}
                        </Text>
                      </View>
                      <Text style={styles.chapterMeta}>
                        {chapter.correctQuestions}/{chapter.totalQuestions} 問正解
                      </Text>
                    </View>
                    <View style={[
                      styles.chapterRateBadge,
                      { backgroundColor: getCorrectRateBackground(chapter.correctRate) }
                    ]}>
                      <Text style={[
                        styles.chapterRateText,
                        { color: getCorrectRateColor(chapter.correctRate) }
                      ]}>
                        {chapter.correctRate}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>全章の正答率</Text>
            </View>

            <View style={styles.chapterList}>
              {chapterStats.map((chapter, index) => (
                <View key={chapter.id} style={styles.chapterCard}>
                  <View style={styles.chapterCardLeft}>
                    <Text style={styles.chapterTitle} numberOfLines={1}>
                      {chapter.title}
                    </Text>
                    <Text style={styles.chapterMeta}>
                      {chapter.correctQuestions}/{chapter.totalQuestions} 問正解
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${chapter.correctRate}%`,
                            backgroundColor: getCorrectRateColor(chapter.correctRate),
                          }
                        ]}
                      />
                    </View>
                  </View>
                  <View style={[
                    styles.chapterRateBadge,
                    { backgroundColor: getCorrectRateBackground(chapter.correctRate) }
                  ]}>
                    <Text style={[
                      styles.chapterRateText,
                      { color: getCorrectRateColor(chapter.correctRate) }
                    ]}>
                      {chapter.correctRate}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {stats.strongChapters.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <CheckCircle2 size={20} color={theme.colors.success[600]} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.success[700] }]}>
                    得意章 ({stats.strongChapters.length})
                  </Text>
                </View>
                <Text style={styles.sectionSubtitle}>正答率80%以上 - よくできています！</Text>
              </View>

              <View style={styles.chapterList}>
                {stats.strongChapters.map((chapter) => (
                  <View key={chapter.id} style={[styles.chapterCard, styles.chapterCardStrong]}>
                    <View style={styles.chapterCardLeft}>
                      <View style={styles.chapterTitleRow}>
                        <TrendingUp size={16} color={theme.colors.success[600]} />
                        <Text style={styles.chapterTitle} numberOfLines={1}>
                          {chapter.title}
                        </Text>
                      </View>
                      <Text style={styles.chapterMeta}>
                        {chapter.correctQuestions}/{chapter.totalQuestions} 問正解
                      </Text>
                    </View>
                    <View style={[
                      styles.chapterRateBadge,
                      { backgroundColor: getCorrectRateBackground(chapter.correctRate) }
                    ]}>
                      <Text style={[
                        styles.chapterRateText,
                        { color: getCorrectRateColor(chapter.correctRate) }
                      ]}>
                        {chapter.correctRate}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        <CustomTabBar />
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerCategory: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
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
  summaryCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    ...theme.shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    marginBottom: theme.spacing.sm,
  },
  summaryBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 70,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.secondary[200],
    marginHorizontal: theme.spacing.sm,
  },
  studyButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  studyButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.neutral.white,
    fontFamily: 'ZenKaku-Bold',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
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
    borderColor: theme.colors.primary[200],
    ...theme.shadows.sm,
  },
  chapterCardWeak: {
    borderColor: theme.colors.error[300],
    backgroundColor: theme.colors.error[50],
  },
  chapterCardStrong: {
    borderColor: theme.colors.success[300],
    backgroundColor: theme.colors.success[50],
  },
  chapterCardLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  chapterTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    fontFamily: 'ZenKaku-Bold',
    flex: 1,
  },
  chapterMeta: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.secondary[600],
    fontFamily: 'ZenKaku-Regular',
    marginBottom: theme.spacing.xs,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.secondary[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
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
});
