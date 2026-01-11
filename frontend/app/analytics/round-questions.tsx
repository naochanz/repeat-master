import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react-native';
import CustomTabBar from '@/components/CustomTabBar';
import { Attempt } from '@/types/QuizBook';

export default function RoundQuestionsScreen() {
  const params = useLocalSearchParams<{
    targetId: string;
    targetType: string;
    round: string;
    chapterId: string;
    sectionId: string;
    chapterNumber: string;
    sectionNumber: string;
    quizBookId: string;
  }>();

  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);

  const round = parseInt(params.round || '1', 10);
  const targetType = params.targetType as 'chapter' | 'section';
  const chapterNumber = parseInt(params.chapterNumber || '0', 10);
  const sectionNumber = parseInt(params.sectionNumber || '0', 10);

  useFocusEffect(
    useCallback(() => {
      fetchQuizBooks();
    }, [])
  );

  // 該当の章または節のデータを取得
  const targetData = useMemo(() => {
    const quizBook = quizBooks.find(b => b.id === params.quizBookId);
    if (!quizBook) return null;

    if (targetType === 'section' && params.sectionId) {
      for (const chapter of quizBook.chapters) {
        const section = chapter.sections?.find(s => s.id === params.sectionId);
        if (section) {
          return {
            type: 'section' as const,
            title: section.title?.trim()
              ? `第${section.sectionNumber}節 ${section.title}`
              : `第${section.sectionNumber}節`,
            chapterTitle: chapter.title?.trim()
              ? `第${chapter.chapterNumber}章 ${chapter.title}`
              : `第${chapter.chapterNumber}章`,
            questionCount: section.questionCount,
            questionAnswers: section.questionAnswers || [],
          };
        }
      }
    } else if (params.chapterId) {
      const chapter = quizBook.chapters.find(c => c.id === params.chapterId);
      if (chapter) {
        return {
          type: 'chapter' as const,
          title: chapter.title?.trim()
            ? `第${chapter.chapterNumber}章 ${chapter.title}`
            : `第${chapter.chapterNumber}章`,
          chapterTitle: '',
          questionCount: chapter.questionCount || 0,
          questionAnswers: chapter.questionAnswers || [],
        };
      }
    }

    return null;
  }, [quizBooks, params]);

  // 指定周回の結果を持つ問題をフィルタリング
  const roundQuestions = useMemo(() => {
    if (!targetData) return [];

    const questions: {
      questionNumber: number;
      result: '○' | '×';
      answeredAt: string;
    }[] = [];

    targetData.questionAnswers.forEach(qa => {
      const roundAttempt = qa.attempts.find(
        (a: Attempt) => a.round === round && a.resultConfirmFlg
      );
      if (roundAttempt) {
        questions.push({
          questionNumber: qa.questionNumber,
          result: roundAttempt.result,
          answeredAt: roundAttempt.answeredAt,
        });
      }
    });

    return questions.sort((a, b) => a.questionNumber - b.questionNumber);
  }, [targetData, round]);

  // 統計
  const stats = useMemo(() => {
    const total = roundQuestions.length;
    const correct = roundQuestions.filter(q => q.result === '○').length;
    const incorrect = total - correct;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, incorrect, rate };
  }, [roundQuestions]);

  if (!targetData) {
    return (
      <View style={styles.wrapper}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>データが見つかりません</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ maxWidth: 280 }}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}
              >
                {round}周目の問題一覧
              </Text>
              <Text style={{ fontSize: 14, textAlign: 'center' }}>
                {targetData.title}
              </Text>
            </View>
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft size={24} color={theme.colors.secondary[900]} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.wrapper}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* 統計カード */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{round}</Text>
              <Text style={styles.statLabel}>周目</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueRate]}>{stats.rate}%</Text>
              <Text style={styles.statLabel}>正答率</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueCorrect]}>{stats.correct}</Text>
              <Text style={styles.statLabel}>正解</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueIncorrect]}>{stats.incorrect}</Text>
              <Text style={styles.statLabel}>不正解</Text>
            </View>
          </View>

          {/* 問題リスト */}
          <View style={styles.questionListContainer}>
            <Text style={styles.sectionTitle}>回答済み問題 ({stats.total}問)</Text>

            {roundQuestions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>この周回のデータはありません</Text>
              </View>
            ) : (
              roundQuestions.map(question => (
                <View key={question.questionNumber} style={styles.questionItem}>
                  <View style={styles.questionLeft}>
                    {question.result === '○' ? (
                      <CheckCircle2 size={24} color={theme.colors.success[600]} fill={theme.colors.success[100]} />
                    ) : (
                      <XCircle size={24} color={theme.colors.error[600]} fill={theme.colors.error[100]} />
                    )}
                    <Text style={styles.questionNumber}>問題 {question.questionNumber}</Text>
                  </View>
                  <View style={styles.questionRight}>
                    <Text style={[
                      styles.questionResult,
                      question.result === '○' ? styles.resultCorrect : styles.resultIncorrect
                    ]}>
                      {question.result}
                    </Text>
                    <Text style={styles.questionDate}>
                      {new Date(question.answeredAt).toLocaleDateString('ja-JP', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
        <CustomTabBar />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[600],
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.neutral.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.secondary[200],
    marginHorizontal: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  statValueRate: {
    color: theme.colors.primary[600],
  },
  statValueCorrect: {
    color: theme.colors.success[600],
  },
  statValueIncorrect: {
    color: theme.colors.error[600],
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
    marginTop: theme.spacing.xs,
  },
  questionListContainer: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.md,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutral.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  questionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  questionNumber: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[900],
  },
  questionRight: {
    alignItems: 'flex-end',
  },
  questionResult: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: 'ZenKaku-Bold',
  },
  resultCorrect: {
    color: theme.colors.success[600],
  },
  resultIncorrect: {
    color: theme.colors.error[600],
  },
  questionDate: {
    fontSize: theme.typography.fontSizes.xs,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
    marginTop: theme.spacing.xs,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[500],
  },
  bottomSpacer: {
    height: theme.spacing['4xl'],
  },
});
