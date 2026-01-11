import { useAppTheme } from '@/hooks/useAppTheme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import { quizBookApi } from '@/services/api';
import React, { useCallback, useState, useMemo } from 'react';
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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { router, useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import CustomTabBar from '@/components/CustomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 60;

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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionIndices, setSectionIndices] = useState<{ [chapterId: string]: number }>({});
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

      const sections = (chapter.sections || []).map(section => {
        const sectionStats = analytics.sectionStats
          .filter(s => s.sectionId === section.id)
          .sort((a, b) => a.round - b.round);

        return {
          id: section.id,
          chapterId: chapter.id,
          sectionNumber: section.sectionNumber,
          title: section.title || '',
          stats: sectionStats,
        };
      }).sort((a, b) => a.sectionNumber - b.sectionNumber);

      return {
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title || `第${chapter.chapterNumber}章`,
        stats,
        hasSections: quizBook.useSections && (chapter.sections?.length ?? 0) > 0,
        sections,
      };
    });
  }, [analytics, quizBook]);

  // 問題集が節を使用しているかどうか
  const useSections = quizBook?.useSections && chapterData.some(c => c.hasSections);

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

  const handleSectionScroll = (chapterId: string) => (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CAROUSEL_ITEM_WIDTH);
    setSectionIndices(prev => ({ ...prev, [chapterId]: index }));
  };

  const renderChart = (
    stats: { round: number; correctRate: number }[],
    targetId: string,
    targetType: 'chapter' | 'section',
    chapterId: string,
    chapterNumber: number,
    sectionId?: string,
    sectionNumber?: number,
    chartWidth?: number
  ) => {
    const width = chartWidth || CARD_WIDTH - 40;

    if (stats.length === 0) {
      return (
        <View style={[styles.emptyChart, { width }]}>
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
          width={width}
          height={200}
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
              r: '7',
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

  // 節カルーセルのインジケーター
  const renderSectionIndicator = (chapter: typeof chapterData[0]) => {
    const currentIndex = sectionIndices[chapter.id] || 0;
    return (
      <View style={styles.carouselIndicatorContainer}>
        {chapter.sections.map((_, index) => (
          <View
            key={index}
            style={[
              styles.carouselIndicator,
              index === currentIndex && styles.carouselIndicatorActive,
            ]}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!quizBook || !analytics) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>データが見つかりません</Text>
        </View>
      </SafeAreaView>
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
                style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: theme.colors.secondary[900] }}
              >
                {quizBook.title}の詳細分析
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
      <SafeAreaView style={styles.wrapper} edges={['left', 'right', 'bottom']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {chapterData.map((chapter) => (
            <View key={chapter.id} style={styles.chapterSection}>
              {/* 章ヘッダー */}
              <View style={styles.chapterHeader}>
                <Text style={styles.chapterTitle}>
                  第{chapter.chapterNumber}章
                </Text>
                {chapter.title && chapter.title !== `第${chapter.chapterNumber}章` && (
                  <Text style={styles.chapterSubtitle} numberOfLines={1}>
                    {chapter.title}
                  </Text>
                )}
              </View>

              {useSections && chapter.hasSections && chapter.sections.length > 0 ? (
                // 節カルーセル
                <View>
                  <ScrollView
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={CAROUSEL_ITEM_WIDTH}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                    onMomentumScrollEnd={handleSectionScroll(chapter.id)}
                  >
                    {chapter.sections.map((section) => (
                      <View key={section.id} style={styles.carouselCard}>
                        <Text style={styles.carouselCardTitle}>
                          {section.title?.trim()
                            ? `第${section.sectionNumber}節 ${section.title}`
                            : `第${section.sectionNumber}節`}
                        </Text>
                        <View style={styles.chartContainer}>
                          {renderChart(
                            section.stats,
                            section.id,
                            'section',
                            chapter.id,
                            chapter.chapterNumber,
                            section.id,
                            section.sectionNumber,
                            CAROUSEL_ITEM_WIDTH - 40
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  {renderSectionIndicator(chapter)}
                </View>
              ) : (
                // 章のグラフを直接表示（節がない場合、または節を使用しない問題集）
                <View style={styles.chartCard}>
                  <Text style={styles.chartCardTitle}>
                    正答率推移
                  </Text>
                  <View style={styles.chartContainer}>
                    {renderChart(
                      chapter.stats,
                      chapter.id,
                      'chapter',
                      chapter.id,
                      chapter.chapterNumber
                    )}
                  </View>
                </View>
              )}
            </View>
          ))}
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

        <CustomTabBar />
      </SafeAreaView>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
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
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  // 章セクション
  chapterSection: {
    marginTop: theme.spacing['2xl'],
  },
  chapterHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  chapterTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  chapterSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Regular',
    color: theme.colors.secondary[600],
    marginTop: theme.spacing.xs,
  },
  // カルーセル
  carouselContent: {
    paddingHorizontal: 20,
  },
  carouselCard: {
    width: CAROUSEL_ITEM_WIDTH,
    marginRight: 10,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  carouselCardTitle: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.md,
  },
  carouselIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  carouselIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[300],
  },
  carouselIndicatorActive: {
    width: 20,
    backgroundColor: theme.colors.primary[600],
  },
  // 通常チャートカード
  chartCard: {
    marginHorizontal: theme.spacing.lg,
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.lg,
  },
  emptyChartText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[500],
  },
  bottomSpacer: {
    height: theme.spacing['4xl'],
  },
  // モーダル
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
