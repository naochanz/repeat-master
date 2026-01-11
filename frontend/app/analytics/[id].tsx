import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { quizBookApi } from '@/services/api';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { router, useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import CustomTabBar from '@/components/CustomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;

interface ChapterStats {
  round: number;
  chapterId: string;
  chapterNumber: number;
  correctRate: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface SectionStats {
  round: number;
  sectionId: string;
  chapterId: string;
  sectionNumber: number;
  correctRate: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface Analytics {
  quizBookId: string;
  totalRounds: number;
  roundStats: { round: number; correctRate: number; totalQuestions: number; correctAnswers: number }[];
  chapterStats: ChapterStats[];
  sectionStats: SectionStats[];
}

export default function DetailedAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [selectedPlot, setSelectedPlot] = useState<{
    round: number;
    correctRate: number;
    targetId: string;
    targetType: 'chapter' | 'section';
    chapterId: string;
    sectionId?: string;
    chapterNumber: number;
    sectionNumber?: number;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const quizBook = quizBooks.find(b => b.id === id);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  const loadData = async () => {
    setLoading(true);
    await fetchQuizBooks();
    if (id) {
      try {
        const response = await quizBookApi.getAnalytics(id);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    }
    setLoading(false);
  };

  // 章ごとのデータをグループ化
  const chapterData = useMemo(() => {
    if (!analytics || !quizBook) return [];

    const chapters = quizBook.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

    return chapters.map(chapter => {
      const stats = analytics.chapterStats
        .filter(s => s.chapterId === chapter.id)
        .sort((a, b) => a.round - b.round);

      return {
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title || `第${chapter.chapterNumber}章`,
        stats,
        hasSections: quizBook.useSections && (chapter.sections?.length ?? 0) > 0,
        sections: chapter.sections || [],
      };
    });
  }, [analytics, quizBook]);

  // 現在の章の節データ
  const currentChapterSections = useMemo(() => {
    if (!analytics || chapterData.length === 0) return [];

    const currentChapter = chapterData[currentChapterIndex];
    if (!currentChapter?.hasSections) return [];

    return currentChapter.sections.map(section => {
      const stats = analytics.sectionStats
        .filter(s => s.sectionId === section.id)
        .sort((a, b) => a.round - b.round);

      return {
        id: section.id,
        chapterId: currentChapter.id,
        sectionNumber: section.sectionNumber,
        title: section.title || `${section.sectionNumber}節`,
        stats,
      };
    }).sort((a, b) => a.sectionNumber - b.sectionNumber);
  }, [analytics, chapterData, currentChapterIndex]);

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
      setCurrentSectionIndex(0);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapterData.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
      setCurrentSectionIndex(0);
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < currentChapterSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePlotSelect = (
    round: number,
    correctRate: number,
    targetId: string,
    targetType: 'chapter' | 'section',
    chapterId: string,
    chapterNumber: number,
    sectionId?: string,
    sectionNumber?: number
  ) => {
    setSelectedPlot({
      round,
      correctRate,
      targetId,
      targetType,
      chapterId,
      sectionId,
      chapterNumber,
      sectionNumber,
    });
    setModalVisible(true);
  };

  const handleNavigateToQuestionList = () => {
    if (!selectedPlot) return;

    setModalVisible(false);

    // 周回別問題リスト画面へ遷移
    router.push({
      pathname: '/analytics/round-questions',
      params: {
        targetId: selectedPlot.targetId,
        targetType: selectedPlot.targetType,
        round: selectedPlot.round,
        chapterId: selectedPlot.chapterId,
        sectionId: selectedPlot.sectionId || '',
        chapterNumber: selectedPlot.chapterNumber,
        sectionNumber: selectedPlot.sectionNumber || '',
        quizBookId: id,
      },
    });
  };

  const renderChart = (
    stats: { round: number; correctRate: number }[],
    targetId: string,
    targetType: 'chapter' | 'section',
    chapterId: string,
    chapterNumber: number,
    sectionId?: string,
    sectionNumber?: number
  ) => {
    if (stats.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>データがありません</Text>
        </View>
      );
    }

    const chartLabels = stats.map(stat => `${stat.round}周`);
    const chartValues = stats.map(stat => stat.correctRate);

    const chartData = {
      labels: chartLabels,
      datasets: [
        {
          data: chartValues,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: [0, 100],
          color: () => 'transparent',
          strokeWidth: 0,
          withDots: false,
        },
      ],
    };

    return (
      <View>
        <LineChart
          data={chartData}
          width={CARD_WIDTH - 40}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.neutral.white,
            backgroundGradientFrom: theme.colors.neutral.white,
            backgroundGradientTo: theme.colors.neutral.white,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
            fillShadowGradientFromOpacity: 0,
            fillShadowGradientToOpacity: 0,
            style: {
              borderRadius: theme.borderRadius.lg,
            },
            propsForDots: {
              r: '8',
              strokeWidth: '2',
              stroke: theme.colors.primary[600],
            },
          }}
          bezier
          style={styles.chart}
          yAxisSuffix="%"
          yAxisInterval={1}
          segments={4}
          fromZero={true}
          onDataPointClick={({ index }) => {
            const stat = stats[index];
            handlePlotSelect(
              stat.round,
              stat.correctRate,
              targetId,
              targetType,
              chapterId,
              chapterNumber,
              sectionId,
              sectionNumber
            );
          }}
        />
        <Text style={styles.chartHint}>※ プロットをタップで詳細を表示</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[600]} />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!quizBook || !analytics) {
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

  const currentChapter = chapterData[currentChapterIndex];
  const currentSection = currentChapterSections[currentSectionIndex];
  const hasSections = currentChapter?.hasSections;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={theme.colors.secondary[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {quizBook.title}の詳細分析
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 章ページネーション */}
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentChapterIndex === 0 && styles.paginationButtonDisabled]}
              onPress={handlePrevChapter}
              disabled={currentChapterIndex === 0}
            >
              <ChevronLeft size={24} color={currentChapterIndex === 0 ? theme.colors.secondary[300] : theme.colors.primary[600]} />
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              <Text style={styles.paginationTitle}>
                第{currentChapter?.chapterNumber}章
              </Text>
              {currentChapter?.title && (
                <Text style={styles.paginationSubtitle} numberOfLines={1}>
                  {currentChapter.title}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, currentChapterIndex === chapterData.length - 1 && styles.paginationButtonDisabled]}
              onPress={handleNextChapter}
              disabled={currentChapterIndex === chapterData.length - 1}
            >
              <ChevronRight size={24} color={currentChapterIndex === chapterData.length - 1 ? theme.colors.secondary[300] : theme.colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {/* 章インジケーター */}
          <View style={styles.indicatorContainer}>
            {chapterData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentChapterIndex && styles.indicatorActive,
                ]}
              />
            ))}
          </View>

          {/* 節がある場合 */}
          {hasSections && currentChapterSections.length > 0 ? (
            <>
              {/* 節ページネーション */}
              <View style={styles.sectionPaginationContainer}>
                <TouchableOpacity
                  style={[styles.sectionPaginationButton, currentSectionIndex === 0 && styles.paginationButtonDisabled]}
                  onPress={handlePrevSection}
                  disabled={currentSectionIndex === 0}
                >
                  <ChevronLeft size={20} color={currentSectionIndex === 0 ? theme.colors.secondary[300] : theme.colors.primary[600]} />
                </TouchableOpacity>

                <View style={styles.sectionPaginationInfo}>
                  <Text style={styles.sectionPaginationTitle}>
                    {currentSection?.sectionNumber}. {currentSection?.title}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.sectionPaginationButton, currentSectionIndex === currentChapterSections.length - 1 && styles.paginationButtonDisabled]}
                  onPress={handleNextSection}
                  disabled={currentSectionIndex === currentChapterSections.length - 1}
                >
                  <ChevronRight size={20} color={currentSectionIndex === currentChapterSections.length - 1 ? theme.colors.secondary[300] : theme.colors.primary[600]} />
                </TouchableOpacity>
              </View>

              {/* 節インジケーター */}
              <View style={styles.indicatorContainer}>
                {currentChapterSections.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.sectionIndicator,
                      index === currentSectionIndex && styles.sectionIndicatorActive,
                    ]}
                  />
                ))}
              </View>

              {/* 節グラフカード */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>
                  {currentSection?.sectionNumber}. {currentSection?.title}
                </Text>
                <View style={styles.chartContainer}>
                  {currentSection && renderChart(
                    currentSection.stats,
                    currentSection.id,
                    'section',
                    currentSection.chapterId,
                    currentChapter.chapterNumber,
                    currentSection.id,
                    currentSection.sectionNumber
                  )}
                </View>
              </View>
            </>
          ) : (
            /* 章グラフカード（節がない場合） */
            <View style={styles.chartCard}>
              <Text style={styles.chartCardTitle}>
                第{currentChapter?.chapterNumber}章の正答率推移
              </Text>
              <View style={styles.chartContainer}>
                {currentChapter && renderChart(
                  currentChapter.stats,
                  currentChapter.id,
                  'chapter',
                  currentChapter.id,
                  currentChapter.chapterNumber
                )}
              </View>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* プロット選択モーダル */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>周回詳細</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={theme.colors.secondary[600]} />
                </TouchableOpacity>
              </View>

              {selectedPlot && (
                <View style={styles.modalBody}>
                  <View style={styles.modalStatContainer}>
                    <Text style={styles.modalStatLabel}>周回数</Text>
                    <Text style={styles.modalStatValue}>{selectedPlot.round}周目</Text>
                  </View>

                  <View style={styles.modalStatContainer}>
                    <Text style={styles.modalStatLabel}>正答率</Text>
                    <Text style={[styles.modalStatValue, styles.modalStatValueLarge]}>
                      {selectedPlot.correctRate}%
                    </Text>
                  </View>

                  <View style={styles.modalStatContainer}>
                    <Text style={styles.modalStatLabel}>対象</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedPlot.targetType === 'chapter'
                        ? `第${selectedPlot.chapterNumber}章`
                        : `${selectedPlot.sectionNumber}節`}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleNavigateToQuestionList}
                  >
                    <Text style={styles.modalButtonText}>
                      {selectedPlot.round}周目の問題一覧を見る
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[600],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
  },
  headerButton: {
    padding: theme.spacing.sm,
    width: 44,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold as any,
    color: theme.colors.secondary[900],
    textAlign: 'center',
    fontFamily: 'ZenKaku-Bold',
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  paginationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: theme.colors.neutral[100],
  },
  paginationInfo: {
    flex: 1,
    alignItems: 'center',
  },
  paginationTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  paginationSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[600],
    marginTop: theme.spacing.xs,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[300],
  },
  indicatorActive: {
    width: 24,
    backgroundColor: theme.colors.primary[600],
  },
  sectionIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.secondary[300],
  },
  sectionIndicatorActive: {
    width: 18,
    backgroundColor: theme.colors.primary[400],
  },
  sectionPaginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  sectionPaginationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionPaginationInfo: {
    flex: 1,
    alignItems: 'center',
  },
  sectionPaginationTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[900],
  },
  chartCard: {
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  chartCardTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  chartHint: {
    fontSize: theme.typography.fontSizes.xs,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[500],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
    width: CARD_WIDTH - 40,
  },
  emptyChartText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[500],
  },
  bottomSpacer: {
    height: theme.spacing['4xl'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary[200],
    backgroundColor: theme.colors.primary[50],
  },
  modalTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  modalStatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  modalStatLabel: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[600],
  },
  modalStatValue: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  modalStatValueLarge: {
    fontSize: theme.typography.fontSizes['2xl'],
    color: theme.colors.primary[600],
  },
  modalButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  modalButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
});
