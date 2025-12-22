import { theme } from '@/constants/theme';
import { useQuizBookStore } from '@/stores/quizBookStore';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { router, useFocusEffect } from 'expo-router';
import { List, TrendingDown, X } from 'lucide-react-native';
import { quizBookApi } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN - 15) + CARD_MARGIN; // marginLeft(5) + marginRight(20)

interface RoundStats {
  round: number;
  totalQuestions: number;
  correctAnswers: number;
  correctRate: number;
}

interface QuizBookAnalytics {
  quizBookId: string;
  totalRounds: number;
  roundStats: RoundStats[];
}

export default function AnalyticsScreen() {
  const quizBooks = useQuizBookStore(state => state.quizBooks);
  const categories = useQuizBookStore(state => state.categories);
  const fetchQuizBooks = useQuizBookStore(state => state.fetchQuizBooks);
  const fetchCategories = useQuizBookStore(state => state.fetchCategories);

  const [analytics, setAnalytics] = useState<{ [quizBookId: string]: QuizBookAnalytics }>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndexMap, setCurrentIndexMap] = useState<{ [categoryId: string]: number }>({});

  const scrollRefs = useRef<{ [categoryId: string]: ScrollView | null }>({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchQuizBooks(), fetchCategories()]);

    // すべての問題集の分析データを取得
    const analyticsData: { [quizBookId: string]: QuizBookAnalytics } = {};
    for (const book of quizBooks) {
      try {
        const response = await quizBookApi.getAnalytics(book.id);
        analyticsData[book.id] = response.data;
      } catch (error) {
        console.error(`Failed to fetch analytics for ${book.id}:`, error);
      }
    }
    setAnalytics(analyticsData);
    setLoading(false);
  };

  // 資格グループごとに問題集をグループ化（全カテゴリを表示）
  const groupedQuizBooks = useMemo(() => {
    const groups: { [categoryId: string]: { categoryName: string; books: typeof quizBooks } } = {};

    // まず全カテゴリを追加
    categories.forEach((category) => {
      groups[category.id] = { categoryName: category.name, books: [] };
    });

    // 問題集を各カテゴリに割り当て
    quizBooks.forEach((book) => {
      const categoryId = book.category?.id;

      if (categoryId && groups[categoryId]) {
        groups[categoryId].books.push(book);
      }
    });

    return groups;
  }, [quizBooks, categories]);

  const handleScroll = (categoryId: string, event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    setCurrentIndexMap(prev => ({ ...prev, [categoryId]: index }));
  };

  const scrollToIndex = (categoryId: string, index: number) => {
    scrollRefs.current[categoryId]?.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
    setCurrentIndexMap(prev => ({ ...prev, [categoryId]: index }));
  };

  const openQuizBookSelector = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setModalVisible(true);
  };

  const selectQuizBook = (categoryId: string, index: number) => {
    scrollToIndex(categoryId, index);
    setModalVisible(false);
  };

  const renderLineChart = (quizBookId: string) => {
    const data = analytics[quizBookId];

    if (!data || data.roundStats.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>データがありません</Text>
        </View>
      );
    }

    const chartLabels = data.roundStats.map(stat => `${stat.round}周`);
    const chartValues = data.roundStats.map(stat => stat.correctRate);

    const chartData = {
      labels: chartLabels,
      datasets: [
        {
          // メインのデータセット
          data: chartValues,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 3,
          withDots: true,
        },
        {
          // Y軸範囲を制御するための透明ダミーデータセット
          data: [0, 100],
          color: () => 'transparent',
          strokeWidth: 0,
          withDots: false,
        },
      ],
    };

    return (
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
          style: {
            borderRadius: theme.borderRadius.lg,
          },
          propsForDots: {
            r: '6',
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
        formatYLabel={(value) => value}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedQuizBooks).map(([categoryId, group]) => {
          const currentIndex = currentIndexMap[categoryId] || 0;

          return (
            <View key={categoryId} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{group.categoryName}</Text>
                <TouchableOpacity
                  style={styles.listButton}
                  onPress={() => openQuizBookSelector(categoryId)}
                >
                  <List size={20} color={theme.colors.primary[600]} />
                  <Text style={styles.listButtonText}>一覧</Text>
                </TouchableOpacity>
              </View>

              {group.books.length === 0 ? (
                <View style={styles.emptyBooksContainer}>
                  <Text style={styles.emptyBooksText}>問題集の登録がありません</Text>
                </View>
              ) : (
                <ScrollView
                  ref={(ref) => {
                    scrollRefs.current[categoryId] = ref;
                  }}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  onScroll={(e) => handleScroll(categoryId, e)}
                  scrollEventThrottle={16}
                  snapToInterval={SNAP_INTERVAL}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingRight: CARD_MARGIN }}
                >
                  {group.books.map((book) => (
                    <View key={book.id} style={styles.card}>
                      <TouchableOpacity onPress={() => router.push(`/study/${book.id}` as any)}>
                        <Text style={styles.cardTitle}>{book.title}</Text>
                      </TouchableOpacity>
                      <View style={styles.chartContainer}>
                        {renderLineChart(book.id)}
                      </View>
                      <TouchableOpacity style={styles.weaknessButton}>
                        <TrendingDown size={20} color={theme.colors.neutral.white} />
                        <Text style={styles.weaknessButtonText}>{book.title}の詳細分析へ</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* ページネーション */}
              {group.books.length > 0 && (
                <View style={styles.pagination}>
                  {group.books.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        index === currentIndex && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {Object.keys(groupedQuizBooks).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>問題集がありません</Text>
          </View>
        )}
      </ScrollView>

      {/* 問題集選択モーダル */}
      {selectedCategoryId && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>問題集を選択</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={theme.colors.secondary[600]} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {groupedQuizBooks[selectedCategoryId]?.books.map((book, index) => (
                  <TouchableOpacity
                    key={book.id}
                    style={styles.modalItem}
                    onPress={() => selectQuizBook(selectedCategoryId, index)}
                  >
                    <Text style={styles.modalItemText}>{book.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.white,
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
    padding: theme.spacing.md,
  },
  categoryContainer: {
    marginBottom: theme.spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  categoryTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
  },
  listButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.primary[600],
  },
  card: {
    width: CARD_WIDTH,
    marginLeft: CARD_MARGIN - 15,
    marginRight: CARD_MARGIN,
    backgroundColor: theme.colors.neutral.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.secondary[900],
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  chart: {
    borderRadius: theme.borderRadius.lg,
  },
  emptyChart: {
    height: 220,
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
  weaknessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.error[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  weaknessButtonText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Bold',
    color: theme.colors.neutral.white,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary[300],
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: theme.colors.primary[600],
  },
  emptyBooksContainer: {
    paddingVertical: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[50],
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  emptyBooksText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[500],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  emptyStateText: {
    fontSize: theme.typography.fontSizes.lg,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
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
  modalItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.secondary[200],
  },
  modalItemText: {
    fontSize: theme.typography.fontSizes.base,
    fontFamily: 'ZenKaku-Medium',
    color: theme.colors.secondary[900],
  },
});
